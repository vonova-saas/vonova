import numpy as np
import json
from pathlib import Path
import sys

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader

# Add the src directory to sys.path so this script can be run directly
BASE_DIR = Path(__file__).resolve().parent
SRC_DIR = BASE_DIR.parent
if str(SRC_DIR) not in sys.path:
    sys.path.append(str(SRC_DIR))

from utils.nltk_utils import bag_of_words, tokenize, stem
from model.model import NeuralNet

DATA_DIR = SRC_DIR / "data"
INTENTS_PATH = DATA_DIR / "intents.json"
MODEL_OUT = DATA_DIR / "data.pth"

with open(INTENTS_PATH, "r", encoding="utf-8") as f:
    intents = json.load(f)

all_words = []
tags = []
xy = []
# loop through each sentence in our intents patterns (bilingual schema)
for intent in intents["intents"]:
    tag = intent["tag"]
    if tag not in tags:
        tags.append(tag)

    # intent["patterns"] is now a dict: { "en": [...], "ar": [...] }
    patterns_by_lang = intent.get("patterns", {})
    for lang, patterns in patterns_by_lang.items():
        for pattern in patterns:
            # tokenize each sentence
            w = tokenize(pattern)
            # add to our words list
            all_words.extend(w)
            # add to xy pair (same tag for all languages)
            xy.append((w, tag))

# stem and lower each word
ignore_words = ["?", ".", "!"]
all_words = [stem(w) for w in all_words if w not in ignore_words]
# remove duplicates and sort
all_words = sorted(set(all_words))
tags = sorted(set(tags))

print(len(xy), "patterns")
print(len(tags), "tags:", tags)
print(len(all_words), "unique stemmed words:", all_words)

# create training data
X_train = []
y_train = []
for pattern_sentence, tag in xy:
    # X: bag of words for each pattern_sentence
    bag = bag_of_words(pattern_sentence, all_words)
    X_train.append(bag)
    # y: PyTorch CrossEntropyLoss needs only class labels, not one-hot
    label = tags.index(tag)
    y_train.append(label)

# Ensure correct dtypes to match model (float32 inputs, int64 labels)
X_train = np.array(X_train, dtype=np.float32)
y_train = np.array(y_train, dtype=np.int64)

# Hyper-parameters
num_epochs = 1000
batch_size = 8
learning_rate = 0.001
input_size = len(X_train[0])
hidden_size = 8
output_size = len(tags)
print(input_size, output_size)


class ChatDataset(Dataset):

    def __init__(self):
        self.n_samples = len(X_train)
        self.x_data = X_train
        self.y_data = y_train

    # support indexing such that dataset[i] can be used to get i-th sample
    def __getitem__(self, index):
        return self.x_data[index], self.y_data[index]

    # we can call len(dataset) to return the size
    def __len__(self):
        return self.n_samples


dataset = ChatDataset()
train_loader = DataLoader(
    dataset=dataset, batch_size=batch_size, shuffle=True, num_workers=0
)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

model = NeuralNet(input_size, hidden_size, output_size).to(device)

# Loss and optimizer
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)

# Train the model
for epoch in range(num_epochs):
    for words, labels in train_loader:
        words = torch.as_tensor(words, dtype=torch.float32, device=device)
        labels = torch.as_tensor(labels, dtype=torch.long, device=device)

        # Forward pass
        outputs = model(words)
        loss = criterion(outputs, labels)

        # Backward and optimize
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

    if (epoch + 1) % 100 == 0:
        print(f"Epoch [{epoch+1}/{num_epochs}], Loss: {loss.item():.4f}")


print(f"final loss: {loss.item():.4f}")

# Evaluate accuracy on the training set
model.eval()
with torch.no_grad():
    correct = 0
    total = 0
    for words, labels in train_loader:
        words = torch.as_tensor(words, dtype=torch.float32, device=device)
        labels = torch.as_tensor(labels, dtype=torch.long, device=device)
        outputs = model(words)
        _, predicted = torch.max(outputs, dim=1)
        total += labels.size(0)
        correct += (predicted == labels).sum().item()

    train_acc = 100.0 * correct / total if total > 0 else 0.0
    print(f"Training accuracy: {train_acc:.2f}%")

model.train()

data = {
    "model_state": model.state_dict(),
    "input_size": input_size,
    "hidden_size": hidden_size,
    "output_size": output_size,
    "all_words": all_words,
    "tags": tags,
}

# Ensure data directory exists
DATA_DIR.mkdir(parents=True, exist_ok=True)

torch.save(data, MODEL_OUT)

print(f"training complete. file saved to {MODEL_OUT}")