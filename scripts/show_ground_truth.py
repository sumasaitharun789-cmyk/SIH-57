from pathlib import Path
from PIL import Image
import numpy as np
import matplotlib.pyplot as plt

# Test dataset location
dataset = Path(r"C:\Sai\SIH-57\datasets\raw\AI4Shipwrecks\test")

image_folder = dataset / "images"
label_folder = dataset / "labels"

# Ask user for image name
image_name = input("Enter image name (example: WP_Thew_10.jpg): ").strip()

image_path = image_folder / image_name
label_path = label_folder / (Path(image_name).stem + ".png")

# Check image
if not image_path.exists():
    print("Image not found!")
    print("Expected:", image_path)
    exit()

# Check label
if not label_path.exists():
    print("Original label not found!")
    print("Expected:", label_path)
    exit()

# Open image
image = Image.open(image_path).convert("RGB")

# Open original mask
mask = Image.open(label_path).convert("L")

# Make sizes match if necessary
if image.size != mask.size:
    print("Image and label have different sizes.")
    print("Image:", image.size)
    print("Label:", mask.size)
    print("Resizing label to image size for display...")
    mask = mask.resize(image.size)

image_array = np.array(image)
mask_array = np.array(mask)

# Display
plt.figure(figsize=(10, 8))

plt.imshow(image_array)
plt.imshow(mask_array > 0, alpha=0.45)

plt.title("ORIGINAL GROUND TRUTH")
plt.axis("off")

plt.show()