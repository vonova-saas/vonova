import json
import pickle
import torch
from pathlib import Path
from sentence_transformers import SentenceTransformer

# إعداد المسارات بناءً على الهيكل الجديد
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "src" / "data"

print("Loading Pre-trained Models...")
# تحميل موديلات اللغات
model_en = SentenceTransformer('all-MiniLM-L6-v2')
model_ar = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')


def process_and_save(model, json_filename, pkl_filename):
  json_path = DATA_DIR / json_filename

  if not json_path.exists():
    print(f"Error: File {json_filename} not found at {json_path}")
    return

  # قراءة ملف الـ JSON
  with open(json_path, "r", encoding="utf-8") as f:
    intents = json.load(f)

  data_pkl = {"embeddings": [], "tags": []}

  # تحويل الأنماط لـ Vectors
  for intent in intents:
    tag = intent['tag']
    patterns = intent.get('patterns', [])

    if patterns:
      embeddings = model.encode(patterns, convert_to_tensor=True)
      data_pkl["embeddings"].append(embeddings)
      data_pkl["tags"].extend([tag] * len(patterns))

  # دمج وحفظ في ملف .pkl
  if data_pkl["embeddings"]:
    data_pkl["embeddings"] = torch.cat(data_pkl["embeddings"], dim=0)
    output_path = DATA_DIR / pkl_filename
    with open(output_path, "wb") as f:
      pickle.dump(data_pkl, f)
    print(f"Success: Saved {len(data_pkl['tags'])} patterns to {pkl_filename}")


if __name__ == "__main__":
  print("-" * 30)
  print("Generating English Embeddings...")
  process_and_save(model_en, "en_intents.json", "en_data.pkl")

  print("-" * 30)
  print("Generating Arabic Embeddings...")
  process_and_save(model_ar, "ar_intents.json", "ar_data.pkl")

  print("-" * 30)
  print("Training Complete! You can now run main.py")
