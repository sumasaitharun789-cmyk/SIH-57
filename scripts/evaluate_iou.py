from ultralytics import YOLO
from pathlib import Path
from PIL import Image
import numpy as np
import cv2

model = YOLO(r"C:\Sai\SIH-57\runs\segment\train-5\weights\best.pt")

image_folder = Path(r"C:\Sai\SIH-57\datasets\raw\AI4Shipwrecks\test\images")
label_folder = Path(r"C:\Sai\SIH-57\datasets\raw\AI4Shipwrecks\test\labels")

image_files = list(image_folder.glob("*.png"))

ious = []
nonempty_ious = []
missed = 0
detected = 0
empty_total = 0
empty_false_positive = 0

for image_path in image_files:

    label_path = label_folder / (image_path.stem + ".png")

    if not label_path.exists():
        continue

    result = model.predict(
        source=str(image_path),
        conf=0.10,
        verbose=False
    )[0]

    image = np.array(Image.open(image_path))
    h, w = image.shape[:2]

    predicted_mask = np.zeros((h, w), dtype=np.uint8)

    if result.masks is not None:
        for polygon in result.masks.xy:
            polygon = np.array(polygon, dtype=np.int32)
            cv2.fillPoly(predicted_mask, [polygon], 1)

    ground_truth = np.array(
        Image.open(label_path).convert("L")
    ) > 0

    predicted_mask = predicted_mask > 0

    intersection = np.logical_and(
        predicted_mask,
        ground_truth
    ).sum()

    union = np.logical_or(
        predicted_mask,
        ground_truth
    ).sum()

    if union > 0:
        iou = intersection / union
    else:
        iou = 1.0 if not predicted_mask.any() else 0.0

    ious.append(iou)

    if ground_truth.sum() > 0:
        nonempty_ious.append(iou)

        if predicted_mask.any():
            detected += 1
        else:
            missed += 1
    if ground_truth.sum() == 0:
        empty_total += 1

        if predicted_mask.any():
            empty_false_positive += 1
                

print("\nImages evaluated:", len(ious))

if ious:
    print("Mean IoU:", sum(ious) / len(ious))
    print("Mean IoU %:", (sum(ious) / len(ious)) * 100)
if nonempty_ious:
    print("Mean IoU (shipwreck images):", sum(nonempty_ious) / len(nonempty_ious))
    print("Mean IoU % (shipwreck images):", (sum(nonempty_ious) / len(nonempty_ious)) * 100)
print("Detected shipwrecks:", detected)
print("Missed shipwrecks:", missed)
print("Empty images:", empty_total)
print("False positives:", empty_false_positive)