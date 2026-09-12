from pathlib import Path

ROOT = Path(r"C:\Sai\SIH-57\datasets\yolo")

for split in ["train", "val", "test"]:
    image_dir = ROOT / "images" / split
    label_dir = ROOT / "labels" / split

    images = list(image_dir.glob("*"))
    labels = list(label_dir.glob("*.txt"))

    print(f"\n{split.upper()}")
    print("-" * 30)
    print("Images :", len(images))
    print("Labels :", len(labels))

    if image_dir.exists():
        print("Image folder:", image_dir)

    if label_dir.exists():
        print("Label folder:", label_dir)

print("\nDataset check completed.")