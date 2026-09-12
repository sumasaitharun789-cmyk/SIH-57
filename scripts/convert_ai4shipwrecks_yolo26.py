from pathlib import Path
import cv2
import shutil

RAW = Path(r"D:\AI4Shipwrecks")
OUT = Path(r"D:\SIH-57\datasets\yolo26")

train_images = sorted((RAW / "train" / "images").glob("*.png"))

split_index = int(len(train_images) * 0.8)

splits = {
    "train": train_images[:split_index],
    "val": train_images[split_index:],
    "test": sorted((RAW / "test" / "images").glob("*.png")),
}


def mask_to_yolo(mask_path, label_path):
    mask = cv2.imread(str(mask_path), cv2.IMREAD_GRAYSCALE)

    if mask is None:
        print(f"Could not read mask: {mask_path}")
        return

    binary = (mask > 0).astype("uint8") * 255

    contours, _ = cv2.findContours(
        binary,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE
    )

    h, w = binary.shape

    with open(label_path, "w") as f:
        for contour in contours:

            area = cv2.contourArea(contour)

            if area < 10:
                continue

            epsilon = 0.002 * cv2.arcLength(contour, True)
            polygon = cv2.approxPolyDP(contour, epsilon, True)

            if len(polygon) < 3:
                continue

            points = []

            for point in polygon:
                x, y = point[0]
                points.append(x / w)
                points.append(y / h)

            f.write(
                "0 " +
                " ".join(f"{p:.6f}" for p in points) +
                "\n"
            )


for split, images in splits.items():

    image_out = OUT / "images" / split
    label_out = OUT / "labels" / split

    image_out.mkdir(parents=True, exist_ok=True)
    label_out.mkdir(parents=True, exist_ok=True)

    print(f"\nProcessing {split}: {len(images)} images")

    for image_path in images:

        shutil.copy2(
            image_path,
            image_out / image_path.name
        )

        source_split = "test" if split == "test" else "train"

        mask_path = (
            RAW / source_split / "labels" / image_path.name
        )

        label_path = label_out / (image_path.stem + ".txt")

        if mask_path.exists():
            mask_to_yolo(mask_path, label_path)
        else:
            label_path.write_text("")

    print(f"Finished {split}")

print("\nYOLO26 dataset conversion completed!")