from fastapi import FastAPI, UploadFile, File
from fastapi.responses import StreamingResponse
import numpy as np
import cv2
from ultralytics import YOLO
from utils.logic import detect_violations
from fastapi.middleware.cors import CORSMiddleware
import time

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all (for development)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = YOLO("./models/runs/detect/finetune_v2_150epochs/weights/best.pt")
# model = YOLO("./models/runs1/segment/ppe_runs/ppe_v1/weights/best.pt")

latest_status = {
    "total_persons": 0,
    "violations": [],
    "safe": True
}

camera_running = False

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
    global latest_status, camera_running

    cap = cv2.VideoCapture(0)

    while True:

        # 🚨 CAMERA STOPPED STATE
        if not camera_running:
            # Create blank frame
            blank = np.zeros((480, 640, 3), dtype=np.uint8)

            ret, buffer = cv2.imencode('.jpg', blank)
            frame_bytes = buffer.tobytes()

            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

            import time
            time.sleep(0.1)
            continue

        # 🚀 NORMAL CAMERA FLOW
        success, frame = cap.read()
        if not success:
            break

        results = model(frame)

        violations = detect_violations(results, model)
        latest_status = violations

        annotated_frame = results[0].plot()

        # Alert text
        if violations["total_persons"] == 0:
            alert_text = "No Person"
            color = (255, 255, 0)
        elif violations["safe"]:
            alert_text = "ALL SAFE"
            color = (0, 255, 0)
        else:
            msgs = []
            for v in violations["violations"]:
                msgs.append(f"P{v['person_id']}: {', '.join(v['missing'])}")
            alert_text = " | ".join(msgs)
            color = (0, 0, 255)

        # cv2.putText(
        #     annotated_frame,
        #     alert_text,
        #     (30, 50),
        #     cv2.FONT_HERSHEY_SIMPLEX,
        #     1,
        #     color,
        #     2
        # )

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

@app.get("/latest_status")
def get_status():
    return latest_status

@app.post("/toggle_camera")
def toggle_camera():
    global camera_running
    camera_running = not camera_running
    return {"status": "started" if camera_running else "stopped"}