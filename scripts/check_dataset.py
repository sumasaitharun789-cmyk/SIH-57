from pathlib import Path
from PIL import Image

dataset_path = Path(r"C:\Projects\MarineAI\datasets\raw\AI4Shipwrecks")

for split in ["train", "test"]:
    image_folder = dataset_path / split / "images"
    label_folder = dataset_path / split / "labels"

    total = 0
    annotated = 0
    empty = 0

    for image_path in image_folder.glob("*.png"):
        total += 1

        label_path = label_folder / image_path.name
        mask = Image.open(label_path)

        if mask.getextrema() == (0, 0):
            empty += 1
        else:
            annotated += 1

    print(f"\n{split.upper()}")
    print("Total images:", total)
    print("Images with annotations:", annotated)
    print("Empty masks:", empty)