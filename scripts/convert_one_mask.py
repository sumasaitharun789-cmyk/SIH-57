from pathlib import Path
from PIL import Image
import cv2


# Dataset paths
image_path = Path(
    r"C:\Sai\SIH-57\datasets\raw\AI4Shipwrecks\train\images\DM_Wilson_08.png"
)

mask_path = Path(
    r"C:\Sai\SIH-57\datasets\raw\AI4Shipwrecks\train\labels\DM_Wilson_08.png"
)

# Output label path
output_path = Path(
    r"C:\Sai\SIH-57\datasets\yolo\labels\train\DM_Wilson_08.txt"
)

# Read mask
mask = Image.open(mask_path).convert("L")

# Convert PIL image to OpenCV format
mask_array = __import__("numpy").array(mask)

# Find object contours
contours, _ = cv2.findContours(
    mask_array,
    cv2.RETR_EXTERNAL,
    cv2.CHAIN_APPROX_SIMPLE
)

# Image dimensions
width, height = mask.size

# Create output folder
output_path.parent.mkdir(parents=True, exist_ok=True)

# Write YOLO segmentation label
with open(output_path, "w") as file:

    for contour in contours:

        # Ignore extremely tiny regions
        if cv2.contourArea(contour) < 10:
            continue

        points = contour.reshape(-1, 2)

        # Start with class ID 0
        line = "0"

        # Convert pixel coordinates to 0-1
        for x, y in points:
            x_normalized = x / width
            y_normalized = y / height

            line += f" {x_normalized:.6f} {y_normalized:.6f}"

        file.write(line + "\n")


print("Conversion completed!")
print("YOLO label saved to:", output_path)