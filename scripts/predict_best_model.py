from ultralytics import YOLO
from pathlib import Path

# Load your trained model
model = YOLO(r"C:\Sai\SIH-57\runs\segment\train-5\weights\best.pt")

# Ask for an image
image_name = input("Enter image name: ").strip()

# Look for the image in the test dataset
image_path = Path(
    r"C:\Sai\SIH-57\datasets\raw\AI4Shipwrecks\test\images"
) / image_name

if not image_path.exists():
    print("Image not found!")
    print("Expected:", image_path)
else:
    print("\nRunning your trained model...")
    
    results = model.predict(
        source=str(image_path),
        conf=0.25,
        save=True
    )
    print("Number of detections:", len(results[0].boxes))
    if len(results[0].boxes) > 0:
        print("Confidence:", float(results[0].boxes.conf[0]))

    print("\nPrediction completed!")
    print("Output saved in:")
    print(r"C:\Sai\SIH-57\runs\segment\predict")