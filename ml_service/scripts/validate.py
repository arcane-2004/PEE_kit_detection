from ultralytics import YOLO

# Load trained model
model = YOLO("runs/detect/train/weights/best.pt")

# Run validation
metrics = model.val(
    data="../dataset/PPE_kit_dataset/data.yaml",
    imgsz=512,
    batch=8,
    device="mps"
)

print(metrics)