from pathlib import Path
from PIL import Image


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


image_name = input(
    "Enter image name "
    "(example: WP_Thew_10.jpg): "
).strip()


image_path = IMAGE_FOLDER / image_name


if not image_path.exists():

    print("\nImage unavailable.")

    print(
        "Expected:"
    )

    print(image_path)

    exit()


label_path = (
    LABEL_FOLDER
    / (Path(image_name).stem + ".png")
)


if not label_path.exists():

    print(
        "\nGround-truth mask unavailable."
    )

    print(
        "Expected:"
    )

    print(label_path)

    exit()


print("\nOriginal image:")
print(image_path)

print("\nGround-truth mask:")
print(label_path)


Image.open(image_path).show()
Image.open(label_path).show()