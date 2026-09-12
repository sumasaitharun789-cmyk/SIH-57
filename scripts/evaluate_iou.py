from ultralytics import YOLO
from pathlib import Path
from PIL import Image
import numpy as np
import cv2
import sys


ROOT = Path(r"D:\SIH-57")

IMAGE_FOLDER = (
    ROOT
    / "datasets"
    / "raw"
    / "AI4Shipwrecks"
    / "test"
    / "images"
)

LABEL_FOLDER = (
    ROOT
    / "datasets"
    / "raw"
    / "AI4Shipwrecks"
    / "test"
    / "labels"
)


def main():

    print("=" * 50)
    print("YOLO26 IoU EVALUATION")
    print("=" * 50)

    if len(sys.argv) >= 2:

        model_path = Path(sys.argv[1])

    else:

        model_path = Path(
            input(
                "\nEnter YOLO26 best.pt path: "
            ).strip().strip('"')
        )

    if not model_path.exists():

        print("\nERROR: Model not found.")
        print(model_path)
        return

    model = YOLO(str(model_path))

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
            IMAGE_FOLDER.glob(extension)
        )

    ious = []
    nonempty_ious = []

    detected = 0
    missed = 0

    for image_path in image_files:

        label_path = (
            LABEL_FOLDER
            / (image_path.stem + ".png")
        )

        if not label_path.exists():
            continue

        result = model.predict(
            source=str(image_path),
            conf=0.25,
            verbose=False
        )[0]

        image = np.array(
            Image.open(image_path)
        )

        height, width = image.shape[:2]

        predicted_mask = np.zeros(
            (height, width),
            dtype=np.uint8
        )

        if result.masks is not None:

            for polygon in result.masks.xy:

                polygon = np.array(
                    polygon,
                    dtype=np.int32
                )

                cv2.fillPoly(
                    predicted_mask,
                    [polygon],
                    1
                )

        ground_truth = (
            np.array(
                Image.open(label_path)
                .convert("L")
            ) > 0
        )

        predicted_mask = (
            predicted_mask > 0
        )

        intersection = np.logical_and(
            predicted_mask,
            ground_truth
        ).sum()

        union = np.logical_or(
            predicted_mask,
            ground_truth
        ).sum()

        if union > 0:

            iou = (
                intersection / union
            )

        else:

            iou = (
                1.0
                if not predicted_mask.any()
                else 0.0
            )

        ious.append(iou)

        if ground_truth.any():

            nonempty_ious.append(iou)

            if predicted_mask.any():
                detected += 1
            else:
                missed += 1

    print(
        "\nImages evaluated:",
        len(ious)
    )

    if ious:

        mean_iou = (
            sum(ious) / len(ious)
        )

        print(
            "Mean IoU:",
            mean_iou
        )

        print(
            "Mean IoU %:",
            mean_iou * 100
        )

    if nonempty_ious:

        shipwreck_iou = (
            sum(nonempty_ious)
            / len(nonempty_ious)
        )

        print(
            "Mean IoU (shipwreck images):",
            shipwreck_iou
        )

        print(
            "Mean IoU % (shipwreck images):",
            shipwreck_iou * 100
        )

        print(
            "Detected shipwrecks:",
            detected
        )

        print(
            "Missed shipwrecks:",
            missed
        )


if __name__ == "__main__":
    main()