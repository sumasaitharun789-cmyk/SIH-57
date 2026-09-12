from pathlib import Path
import cv2
import numpy as np
import sys


def convert_mask(mask_path, output_path, class_id=0):

    mask = cv2.imread(
        str(mask_path),
        cv2.IMREAD_GRAYSCALE
    )

    if mask is None:
        print("ERROR: Could not read mask:")
        print(mask_path)
        return

    height, width = mask.shape

    binary = (mask > 0).astype(np.uint8) * 255

    contours, _ = cv2.findContours(
        binary,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE
    )

    with open(output_path, "w") as file:

        for contour in contours:

            if cv2.contourArea(contour) < 10:
                continue

            epsilon = 0.002 * cv2.arcLength(
                contour,
                True
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
                str(class_id) + " " +
                " ".join(
                    f"{p:.6f}" for p in points
                ) +
                "\n"
            )

    print("Conversion completed:")
    print(mask_path)
    print("->")
    print(output_path)


if __name__ == "__main__":

    if len(sys.argv) < 3:

        print(
            "Usage:\n"
            "python convert_one_mask.py "
            "input_mask.png output.txt"
        )

        sys.exit(1)

    mask_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])

    convert_mask(
        mask_path,
        output_path
    )