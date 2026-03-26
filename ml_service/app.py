from fastapi import FastAPI, UploadFile, File
from fastapi.responses import StreamingResponse
import numpy as np
import cv2
from ultralytics import YOLO
from utils.logic import detect_violations

app = FastAPI()

model = YOLO("./models/runs/detect/finetune_v2_150epochs/weights/best.pt")
# model = YOLO("./models/runs1/segment/ppe_runs/ppe_v1/weights/best.pt")


@app.get("/")
def home():
    return {"message": "API Running"}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    
    contents = await file.read()
    np_arr = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    results = model(frame)

    detections = []
    for box in results[0].boxes:
        detections.append({
            "class": model.names[int(box.cls[0])],
            "confidence": float(box.conf[0])
        })

    violations = detect_violations(results, model)

    return {
        "detections": detections,
        "analysis": violations
    }
    
def generate_frames():
    cap = cv2.VideoCapture(0)

    while True:
        success, frame = cap.read()
        if not success:
            break

        # Run model
        results = model(frame)

        # Apply your violation logic
        violations = detect_violations(results, model)

        # Draw detections
        annotated_frame = results[0].plot()

        # ---------------- ALERT TEXT ---------------- #
        if violations["total_persons"] == 0:
            alert_text = "No Person"
            color = (255, 255, 0)

        elif violations["safe"]:
            alert_text = "ALL SAFE"
            color = (0, 255, 0)

        else:
            msgs = []
            for v in violations["violations"]:
                msgs.append(
                    f"P{v['person_id']}: {', '.join(v['missing'])}"
                )

            alert_text = " | ".join(msgs)
            color = (0, 0, 255)

        # Put text on frame
        cv2.putText(
            annotated_frame,
            alert_text,
            (30, 50),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            color,
            2
        )

        # Encode frame
        ret, buffer = cv2.imencode('.jpg', annotated_frame)
        frame_bytes = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

    cap.release()
        
@app.get("/video_feed")
def video_feed():
    return StreamingResponse(
        generate_frames(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )