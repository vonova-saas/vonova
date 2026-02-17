import pandas as pd
import numpy as np
import os
import zipfile
import pickle
from pathlib import Path
from dotenv import load_dotenv

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Load environment variables
load_dotenv()

def setup_kaggle():
    """Setup Kaggle API using environment variables"""
    kaggle_token = os.getenv('KAGGLE_API_TOKEN')
    if not kaggle_token:
        print("KAGGLE_API_TOKEN not found in environment variables.")
        print("Please add KAGGLE_API_TOKEN to your .env file")
        return False
    
    # Create kaggle directory and config file
    kaggle_dir = os.path.expanduser("~/.kaggle")
    os.makedirs(kaggle_dir, exist_ok=True)
    
    # Write kaggle.json from environment variable
    kaggle_json_path = os.path.join(kaggle_dir, "kaggle.json")
    with open(kaggle_json_path, 'w') as f:
        f.write(kaggle_token)
    
    # Set proper permissions
    os.chmod(kaggle_json_path, 0o600)
    
    print("Kaggle API setup complete using environment variables")
    return True

def download_dataset():
    """Download and extract the Amazon Kindle Books dataset"""
    dataset_name = "asaniczka/amazon-kindle-books-dataset-2023-130k-books"
    csv_file = "data/kindle_data-v2.csv"
    
    # Create data directory if it doesn't exist
    data_dir = Path("data")
    data_dir.mkdir(exist_ok=True)
    
    # Check if data already exists
    if os.path.exists(csv_file):
        print(f"Dataset file {csv_file} already exists. Skipping download.")
        return csv_file
    
    print("Downloading dataset from Kaggle...")
    try:
        import kaggle
        kaggle.api.dataset_download_files(dataset_name, path='data', unzip=True)
        print("Dataset downloaded and extracted successfully!")
        return csv_file
    except Exception as e:
        print(f"Error downloading dataset: {e}")
        return None

def get_track(cat):
    """Categorize books into technical tracks based on category"""
    cat = str(cat).lower()
    if any(word in cat for word in ['math', 'statistics', 'probability', 'algebra', 'calculus', 'geometry']):
        return 'Mathematics & Statistics'
    elif any(word in cat for word in ['machine learning', 'deep learning', 'data science', 'artificial intelligence', 'python', 'programming', 'software', 'algorithm']):
        return 'Machine Learning & Programming'
    elif any(word in cat for word in ['computer', 'technology', 'network', 'security', 'database', 'cloud']):
        return 'Computer Science & Technology'
    elif any(word in cat for word in ['education', 'teaching', 'learning', 'pedagogy']):
        return 'Education & Teaching'
    else:
        return 'Science & Engineering'

def preprocess_data(df):
    """Preprocess the raw dataset"""
    print(f"Total books before cleaning: {len(df)}")
    print("Columns:", df.columns.tolist())
    
    # Create new columns
    df["track"] = df["category_name"].apply(get_track)
    df["rating"] = df["stars"]
    df["text_for_similarity"] = (
        df["title"].fillna("") + " " +
        df["author"].fillna("") + " " +
        df["category_name"].fillna("")
    )
    print("Extra columns (track, rating, text_for_similarity) created.")
    
    # Define technical tracks
    tech_tracks = [
        'Machine Learning & Programming',
        'Computer Science & Technology',
        'Mathematics & Statistics',
        'Education & Teaching'
    ]
    
    # Create final books dataframe
    books = df[[
        "asin", "title", "author", "category_name", "track", "rating",
        "reviews", "imgUrl", "productURL", "text_for_similarity"
    ]].copy()
    
    # Rename columns
    books.rename(columns={"imgUrl": "image", "productURL": "link"}, inplace=True)
    
    # Clean data
    books.dropna(subset=["title", "link"], inplace=True)
    books = books[(books["reviews"] >= 5) & (books["rating"] >= 3)]
    books = books[books["track"].isin(tech_tracks)]
    
    print(f"Number of TECH books after cleaning: {len(books)}")
    print(books["track"].value_counts())
    
    return books

def build_recommendation_model(books):
    """Build TF-IDF vectors and cosine similarity matrix"""
    print("Building recommendation model...")
    
    tfidf = TfidfVectorizer(stop_words='english', max_features=10000)
    tfidf_matrix = tfidf.fit_transform(books['text_for_similarity'])
    cosine_sim = cosine_similarity(tfidf_matrix)
    
    print("Recommendation engine ready!")
    return tfidf, cosine_sim

def recommend(title, books, cosine_sim, top_k=8):
    """Recommend books based on title"""
    # Reset index to ensure clean 0-N indexing
    books_reset = books.reset_index(drop=True)

    if title not in books_reset['title'].values:
        print("Book not found")
        return []

    # Use reset index (0 to len(books)-1)
    idx = books_reset[books_reset['title'] == title].index[0]

    # Now idx is guaranteed within cosine_sim bounds
    sim_scores = list(enumerate(cosine_sim[idx]))
    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)[1:top_k+1]

    recommendations = []
    print(f"\nRecommended because you viewed:\n→ {title}\n")
    for i, score in sim_scores:
        b = books_reset.iloc[i]
        recommendation = {
            'title': b['title'],
            'author': b['author'],
            'track': b['track'],
            'rating': b['rating'],
            'image': b['image'],
            'link': b['link'],
            'similarity_score': score
        }
        recommendations.append(recommendation)
        
        print(f"• {b['title']}")
        print(f"   Author: {b['author']} | Track: {b['track']} | Rating: {b['rating']}/5")
        print(f"   Image → {b['image']}")
        print(f"   Link  → {b['link']}\n")
    
    return recommendations

def save_model_files(books, tfidf, cosine_sim):
    """Save model files for deployment"""
    output_dir = Path("model_files")
    output_dir.mkdir(exist_ok=True)
    
    # Save cleaned DataFrame
    books.to_csv(output_dir / 'FINAL_BOOKS_CLEAN.csv', index=False)
    
    # Save model files
    with open(output_dir / 'vectorizer.pkl', 'wb') as f:
        pickle.dump(tfidf, f)
    
    with open(output_dir / 'similarity_sparse.pkl', 'wb') as f:
        pickle.dump(cosine_sim, f)

    print("All core files saved for deployment:")
    print(f"- {output_dir / 'FINAL_BOOKS_CLEAN.csv'}")
    print(f"- {output_dir / 'vectorizer.pkl'}")
    print(f"- {output_dir / 'similarity_sparse.pkl'}")

def main():
    """Main training pipeline"""
    print("=== Books Recommendation System Training ===")
    
    # Setup Kaggle
    if not setup_kaggle():
        print("Failed to setup Kaggle API. Exiting.")
        return
    
    # Download dataset
    csv_file = download_dataset()
    if not csv_file:
        print("Failed to download dataset. Exiting.")
        return
    
    # Load data
    print("Loading data...")
    try:
        df = pd.read_csv(csv_file)
        print("Data loaded successfully!")
    except Exception as e:
        print(f"Error loading data: {e}")
        return
    
    # Preprocess data
    books = preprocess_data(df)
    
    # Build recommendation model
    tfidf, cosine_sim = build_recommendation_model(books)
    
    # Test recommendations
    print("\n=== Testing Recommendations ===")
    test_books = [
        "Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow",
        "Introduction to Probability",
        "Python Crash Course",
        "Clean Code"
    ]
    
    for book_title in test_books:
        if book_title in books['title'].values:
            recommend(book_title, books, cosine_sim)
        else:
            print(f"Book '{book_title}' not found in dataset")
    
    # Save model files
    save_model_files(books, tfidf, cosine_sim)
    
    print("\n=== Training Complete ===")

if __name__ == "__main__":
    main()
