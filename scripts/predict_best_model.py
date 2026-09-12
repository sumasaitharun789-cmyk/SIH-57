from ultralytics import YOLO
from pathlib import Path
import sys


def main():

    print("=" * 50)
    print("YOLO26 SHIPWRECK PREDICTION")
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
        print("Path:", model_path)
        return

    model = YOLO(str(model_path))

    image_path = Path(
        input(
            "\nEnter image path: "
        ).strip().strip('"')
    )

    if not image_path.exists():

        print("\nERROR: Image not found.")
        print("Path:", image_path)
        return

    output_dir = (
        Path(r"D:\SIH-57")
        / "runs"
        / "segment"
        / "predict"
    )

    output_dir.mkdir(
        parents=True,
        exist_ok=True
    )

    results = model.predict(
        source=str(image_path),
        conf=0.25,
        save=True,
        project=str(output_dir.parent),
        name=output_dir.name,
        exist_ok=True,
        verbose=False
    )

    result = results[0]

    if result.masks is not None:
        detections = len(result.masks)
    else:
        detections = 0

    print("\nPrediction completed!")
    print(
        "Number of detections:",
        detections
    )

    if (
        result.boxes is not None
        and result.boxes.conf is not None
    ):

        for index, confidence in enumerate(
            result.boxes.conf
        ):

            print(
                f"Detection {index + 1}: "
                f"Confidence = "
                f"{float(confidence):.4f}"
            )

    print("\nOutput saved in:")
    print(output_dir)


if __name__ == "__main__":
    main()