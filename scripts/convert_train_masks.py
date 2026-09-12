from pathlib import Path
import cv2
import numpy as np


ROOT = Path(r"D:\SIH-57")

SOURCE = (
    ROOT
    / "datasets"
    / "raw"
    / "AI4Shipwrecks"
)

IMAGE_DIR = SOURCE / "train" / "images"
MASK_DIR = SOURCE / "train" / "labels"

OUTPUT_IMAGE_DIR = (
    ROOT
    / "datasets"
    / "yolo"
    / "images"
    / "train"
)

OUTPUT_LABEL_DIR = (
    ROOT
    / "datasets"
    / "yolo"
    / "labels"
    / "train"
)


OUTPUT_IMAGE_DIR.mkdir(
    parents=True,
    exist_ok=True
)

OUTPUT_LABEL_DIR.mkdir(
    parents=True,
    exist_ok=True
)


def convert_mask(mask_path, label_path):

    mask = cv2.imread(
        str(mask_path),
        cv2.IMREAD_GRAYSCALE
    )

    if mask is None:
        print("Could not read:", mask_path)
        return

    height, width = mask.shape

    binary = (
        (mask > 0)
        .astype(np.uint8)
        * 255
    )

    contours, _ = cv2.findContours(
        binary,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE
    )

    with open(label_path, "w") as file:

        for contour in contours:

            if cv2.contourArea(contour) < 10:
                continue

            epsilon = (
                0.002
                * cv2.arcLength(contour, True)
            )

            polygon = cv2.approxPolyDP(
                contour,
                epsilon,
                True
            )

            if len(polygon) < 3:
                continue

            points = []

            for point in polygon:

                x, y = point[0]

                points.append(x / width)
                points.append(y / height)

            file.write(
                "0 "
                + " ".join(
                    f"{p:.6f}"
                    for p in points
                )
                + "\n"
            )


image_files = []

for extension in [
    "*.jpg",
    "*.jpeg",
    "*.png",
    "*.JPG",
    "*.JPEG",
    "*.PNG"
]:

    image_files.extend(
        IMAGE_DIR.glob(extension)
    )


print(
    "Training images found:",
    len(image_files)
)

converted = 0

for image_path in image_files:

    mask_path = (
        MASK_DIR
        / (image_path.stem + ".png")
    )

    if not mask_path.exists():

        print(
            "Mask missing:",
            image_path.name
        )

        continue

    output_image = (
        OUTPUT_IMAGE_DIR
        / image_path.name
    )

    output_label = (
        OUTPUT_LABEL_DIR
        / (image_path.stem + ".txt")
    )

    output_image.write_bytes(
        image_path.read_bytes()
    )

    convert_mask(
        mask_path,
        output_label
    )

    converted += 1


print("\nTraining conversion completed.")
print("Images converted:", converted)