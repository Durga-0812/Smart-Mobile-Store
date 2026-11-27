import re
from pathlib import Path

import joblib
from nltk.stem import PorterStemmer


BASE_DIR = Path(__file__).resolve().parents[1]
MODEL_DIR = BASE_DIR / "ml_models"

MODEL_PATH = MODEL_DIR / "customer_satisfaction_model.pkl"
STOPWORDS_PATH = MODEL_DIR / "english_stopwords.txt"

# Load the trained model and vectorizer once.
_bundle = joblib.load(MODEL_PATH)

model = _bundle["model"]
vectorizer = _bundle["vectorizer"]

# Load the same stopwords used during training.
with open(STOPWORDS_PATH, "r", encoding="utf-8") as file:
    stop_words = set(file.read().splitlines())

stemmer = PorterStemmer()


def clean_text(text: str) -> str:
    text = text.lower()

    # Preserve negation words such as not, no and nor.
    text = re.sub(r"n't\b", " not", text)

    # Remove special characters and numbers.
    text = re.sub(r"[^a-z\s]", " ", text)

    words = text.split()

    words = [
        stemmer.stem(word)
        for word in words
        if word not in stop_words
    ]

    return " ".join(words)


def predict_customer_satisfaction(review: str) -> dict:
    cleaned_review = clean_text(review)

    if not cleaned_review.strip():
        return {
            "prediction": "UNKNOWN",
            "confidence": None
        }

    review_vector = vectorizer.transform([cleaned_review])

    predicted_class = model.predict(review_vector)[0]

    probabilities = model.predict_proba(review_vector)[0]

    class_index = list(model.classes_).index(predicted_class)

    confidence = round(float(probabilities[class_index]) * 100, 2)

    prediction = (
        "SATISFIED"
        if predicted_class == "positive"
        else "NOT SATISFIED"
    )

    return {
        "prediction": prediction,
        "confidence": confidence
    }
