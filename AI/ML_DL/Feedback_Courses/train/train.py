import pandas as pd
import numpy as np
import re
import joblib
import nltk
import os
import time
from datetime import datetime, timedelta

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split, RandomizedSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from nltk.corpus import stopwords
from nltk.stem import SnowballStemmer

nltk.download('stopwords', quiet=True)

stop_words = stopwords.words('english')
stemmer = SnowballStemmer('english')

# Load data with proper path handling
print("[" + datetime.now().strftime("%H:%M:%S") + "] Starting data loading...")
data_path = 'data/Feedback_Training.csv'
if not os.path.exists(data_path):
    raise FileNotFoundError(f"Data file not found: {data_path}")

columns = ['Feedback_ID', 'Entity', 'label', 'comment']

train_data = pd.read_csv(data_path, names=columns)
print(f"[{datetime.now().strftime('%H:%M:%S')}] Data loaded successfully. Shape: {train_data.shape}")

# Drop unnecessary columns
print(f"[{datetime.now().strftime('%H:%M:%S')}] Preprocessing data...")
train_data.drop(['Feedback_ID', 'Entity'], axis=1, inplace=True)

# Check and handle null values
null_count = train_data.isnull().sum().sum()
print(f"[{datetime.now().strftime('%H:%M:%S')}] Found {null_count} null values")
if null_count > 0:
    train_data.dropna(inplace=True)
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Removed null values")

# Check and handle duplicates
duplicate_count = train_data.duplicated().sum()
print(f"[{datetime.now().strftime('%H:%M:%S')}] Found {duplicate_count} duplicate rows")
if duplicate_count > 0:
    train_data.drop_duplicates(inplace=True)
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Removed duplicate rows")

print(f"[{datetime.now().strftime('%H:%M:%S')}] Final data shape: {train_data.shape}")

# Standardize labels
print(f"[{datetime.now().strftime('%H:%M:%S')}] Standardizing labels...")
train_data['label'] = train_data['label'].str.strip().str.lower()
initial_count = len(train_data)
train_data = train_data[train_data['label'].isin(['positive', 'negative', 'neutral'])]
filtered_count = initial_count - len(train_data)
if filtered_count > 0:
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Filtered out {filtered_count} invalid labels")

print(f"[{datetime.now().strftime('%H:%M:%S')}] Label distribution:")
print(train_data['label'].value_counts())

def data_cleaner(text):

    if not isinstance(text, str):
        return ""

    text = text.lower()
    # Handle emojis/emoticons
    text = text.replace("(", " sad")
    text = text.replace(";", " happy")
    text = text.replace(":3", " cute")
    text = text.replace(":d", " happy")
    text = text.replace(":-)", " happy")
    text = text.replace(":=", " happy")

    # Regex cleaning
    text = re.sub(r'http\S+', '', text)
    text = re.sub(r'<.*?>', '', text)
    text = re.sub(r'\d+', '', text)
    text = re.sub(r'@\w+', '', text)
    text = re.sub(r'#\w+', '', text)
    text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'[^A-Za-z0-9 ]+', ' ', text)

    # Remove stopwords and stem
    text = ' '.join([word for word in text.split() if word not in stop_words])
    text = ' '.join([stemmer.stem(word) for word in text.split()])

    return text.strip()

# Apply Text Cleaning
print(f"[{datetime.now().strftime('%H:%M:%S')}] Cleaning text data...")
start_time = time.time()
train_data['cleaned_comment'] = train_data['comment'].apply(data_cleaner)
cleaning_time = time.time() - start_time
print(f"[{datetime.now().strftime('%H:%M:%S')}] Text cleaning completed in {cleaning_time:.2f} seconds")

# Encode Labels (Target)
print(f"[{datetime.now().strftime('%H:%M:%S')}] Encoding labels...")
le_model = LabelEncoder()
train_data['label_code'] = le_model.fit_transform(train_data['label'])
print(f"[{datetime.now().strftime('%H:%M:%S')}] Labels encoded: {dict(zip(le_model.classes_, le_model.transform(le_model.classes_)))}")

# Feature Selection
X = train_data['cleaned_comment']
y = train_data['label_code']

# Vectorization
print(f"[{datetime.now().strftime('%H:%M:%S')}] Vectorizing text with TF-IDF...")
start_time = time.time()
tfidf_vectorizer = TfidfVectorizer(
    max_features=8000,  # Reduced for faster training
    ngram_range=(1, 2),   # unigram + bigram
    min_df=2
)

X_tfidf = tfidf_vectorizer.fit_transform(X)
vectorization_time = time.time() - start_time
print(f"[{datetime.now().strftime('%H:%M:%S')}] Vectorization completed in {vectorization_time:.2f} seconds")
print(f"[{datetime.now().strftime('%H:%M:%S')}] Feature matrix shape: {X_tfidf.shape}")

# Optimized parameter grid for faster training
param_grid = {
    'n_estimators': [100, 200, 300],  # Reduced range
    'max_depth': [None, 20, 30],     # Reduced options
    'min_samples_split': [2, 5],     # Reduced options
    'min_samples_leaf': [1, 2],       # Reduced options
    'max_features': ['sqrt', 'log2']  # Keep both options
}

print(f"[{datetime.now().strftime('%H:%M:%S')}] Setting up RandomizedSearchCV with {len(param_grid['n_estimators']) * len(param_grid['max_depth']) * len(param_grid['min_samples_split']) * len(param_grid['min_samples_leaf']) * len(param_grid['max_features'])} possible combinations")

rf_search = RandomizedSearchCV(
    estimator=RandomForestClassifier(class_weight='balanced', random_state=42, n_jobs=-1),
    param_distributions=param_grid,
    n_iter=10,  # Reduced from 20 for faster training
    cv=3,       # Reduced from 5 for faster training
    n_jobs=-1,
    scoring='accuracy',
    verbose=2,  # Increased verbosity for better progress tracking
    random_state=42
)

# Split the dataset
print(f"[{datetime.now().strftime('%H:%M:%S')}] Splitting data into train/test sets...")
X_train, X_test, y_train, y_test = train_test_split(
    X_tfidf, y, test_size=0.2, random_state=42, stratify=y
)

print(f"[{datetime.now().strftime('%H:%M:%S')}] Data split completed:")
print(f"  - X_train shape: {X_train.shape}")
print(f"  - X_test shape: {X_test.shape}")
print(f"  - y_train shape: {y_train.shape}")
print(f"  - y_test shape: {y_test.shape}")

# Train the model
print(f"[{datetime.now().strftime('%H:%M:%S')}] Starting model training...")
print(f"[{datetime.now().strftime('%H:%M:%S')}] This will test {rf_search.n_iter} parameter combinations with {rf_search.cv}-fold cross-validation")
print(f"[{datetime.now().strftime('%H:%M:%S')}] Estimated total fits: {rf_search.n_iter * rf_search.cv}")

training_start = time.time()
rf_search.fit(X_train, y_train)
training_time = time.time() - training_start

print(f"[{datetime.now().strftime('%H:%M:%S')}] Training completed in {training_time:.2f} seconds ({training_time/60:.2f} minutes)")

# Get best model
rf_model = rf_search.best_estimator_
print(f"[{datetime.now().strftime('%H:%M:%S')}] Best Parameters found:")
for param, value in rf_search.best_params_.items():
    print(f"  - {param}: {value}")
print(f"[{datetime.now().strftime('%H:%M:%S')}] Best cross-validation score: {rf_search.best_score_:.4f}")

# Evaluate model
print(f"[{datetime.now().strftime('%H:%M:%S')}] Evaluating model performance...")
train_pred = rf_model.predict(X_train)
train_accuracy = accuracy_score(y_train, train_pred)
print(f"[{datetime.now().strftime('%H:%M:%S')}] Training Accuracy: {train_accuracy:.4f}")

y_pred = rf_model.predict(X_test)
test_accuracy = accuracy_score(y_test, y_pred)
print(f"[{datetime.now().strftime('%H:%M:%S')}] Testing Accuracy: {test_accuracy:.4f}")

print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Classification Report:")
print(classification_report(y_test, y_pred, target_names=le_model.classes_))

# Create models directory if it doesn't exist
os.makedirs('models', exist_ok=True)

# Save models
print(f"[{datetime.now().strftime('%H:%M:%S')}] Saving models to disk...")
saving_start = time.time()

joblib.dump(tfidf_vectorizer, 'models/vectorizer.pkl')
joblib.dump(rf_model, 'models/rf_model.pkl')
joblib.dump(le_model, 'models/label_encoder.pkl')

saving_time = time.time() - saving_start
print(f"[{datetime.now().strftime('%H:%M:%S')}] Models saved successfully in 'models' directory in {saving_time:.2f} seconds!")

# Final summary
total_time = time.time() - time.time() + training_start
print(f"\n[{datetime.now().strftime('%H:%M:%S')}] ===== TRAINING COMPLETED =====")
print(f"[{datetime.now().strftime('%H:%M:%S')}] Total training time: {training_time:.2f} seconds ({training_time/60:.2f} minutes)")
print(f"[{datetime.now().strftime('%H:%M:%S')}] Final test accuracy: {test_accuracy:.4f}")
print(f"[{datetime.now().strftime('%H:%M:%S')}] Models saved and ready for use!")