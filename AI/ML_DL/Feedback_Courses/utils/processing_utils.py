import re
import nltk
from nltk.corpus import stopwords
from nltk.stem import SnowballStemmer

try:
    nltk.download('stopwords', quiet=True)
    stop_words = stopwords.words('english')
    stemmer = SnowballStemmer('english')
except Exception as e:
    print(f"Warning: NLTK components failed to load. The data_cleaner may not work correctly. Error: {e}")
    stop_words = set()
    stemmer = None


def data_cleaner(text: str) -> str:
    if not isinstance(text, str):
        return ""

    text = text.lower()
    # Handle emojis/emoticons (matching training script)
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
    words = [word for word in text.split() if word not in stop_words]
    if stemmer:
        words = [stemmer.stem(word) for word in words]

    return ' '.join(words).strip()
