from pathlib import Path
from PIL import Image
import cv2
import numpy as np


# Dataset paths
dataset_path = Path(r"C:\Sai\SIH-57\datasets\raw\AI4Shipwrecks")

image_folder = dataset_path / "train" / "images"
mask_folder = dataset_path / "train" / "labels"

output_folder = Path(r"C:\Sai\SIH-57\datasets\yolo\labels\train")
output_folder.mkdir(parents=True, exist_ok=True)


# Process every training image
for image_path in image_folder.glob("*.png"):

    mask_path = mask_folder / image_path.name
    output_path = output_folder / f"{image_path.stem}.txt"

    # Check whether mask exists
    if not mask_path.exists():
        print(f"Mask missing: {image_path.name}")
        continue

    # Read image and mask
    image = Image.open(image_path)
    mask = Image.open(mask_path).convert("L")

    # Make sure image and mask have the same size
    if image.size != mask.size:
        print(f"Size mismatch: {image_path.name}")
        continue

    mask_array = np.array(mask)

    # Find object contours
    contours, _ = cv2.findContours(
        mask_array,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE
    )

    width, height = image.size

    # Create YOLO label file
    with open(output_path, "w") as file:

        for contour in contours:

            # Ignore very tiny regions
            if cv2.contourArea(contour) < 10:
                continue

            points = contour.reshape(-1, 2)

            # YOLO class ID
            line = "0"

            # Convert coordinates to 0-1
            for x, y in points:
                x_normalized = x / width
                y_normalized = y / height

                line += f" {x_normalized:.6f} {y_normalized:.6f}"

            # Save polygon
            if len(points) >= 3:
                file.write(line + "\n")

    print(f"Converted: {image_path.name}")


print("\nAll training masks processed!")