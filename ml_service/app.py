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

human_model = YOLO("./models/yolov8s.pt")
ppe_model = YOLO("./models/ppe_model.pt")

latest_status = {
    "total_persons": 0,
    "violations": [],
    "safe": True
}

camera_running = False

@app.get("/")
def home():
    return {"message": "API Running"}


@app.post("/detect_image")
async def detect_image(file: UploadFile = File(...)):
    
    contents = await file.read()
    np_arr = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    human_results = human_model(frame, conf=0.5)
    ppe_results = ppe_model(frame, conf=0.4)

    detections = []

    # Humans
    for box in human_results[0].boxes:
        detections.append({
            "class": "human",
            "confidence": float(box.conf[0])
        })

    # PPE
    for box in ppe_results[0].boxes:
        detections.append({
            "class": ppe_model.names[int(box.cls[0])],
            "confidence": float(box.conf[0])
        })

    violations = detect_violations(
    human_results,
    ppe_results,
    ppe_model
    )

    return {
        "detections": detections,
        "analysis": violations
    }
    
def generate_frames():
    global latest_status, camera_running

    cap = cv2.VideoCapture(0)

    while True:
        try:
            if not camera_running:
                blank = np.zeros((480, 640, 3), dtype=np.uint8)
                cv2.putText(blank, "CAMERA STOPPED", (100, 240),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 3)

                ret, buffer = cv2.imencode('.jpg', blank)
                if not ret:
                    continue

                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' +
                       buffer.tobytes() + b'\r\n')
                continue

            success, frame = cap.read()
            if not success:
                continue

            # ---------------- HUMAN DETECTION ----------------
            human_results = human_model(frame)

            person_data = []

            for box in human_results[0].boxes:
                cls = int(box.cls[0])

                if human_model.names[cls] != "person":
                    continue

                x1, y1, x2, y2 = map(int, box.xyxy[0])

                # 🔥 SAFE CLAMP
                x1 = max(0, x1)
                y1 = max(0, y1)
                x2 = min(frame.shape[1], x2)
                y2 = min(frame.shape[0], y2)

                if x2 - x1 < 20 or y2 - y1 < 20:
                    continue

                crop = frame[y1:y2, x1:x2]

                person_data.append({
                    "bbox": (x1, y1, x2, y2),
                    "crop": crop
                })

            # ---------------- PPE DETECTION ----------------
            violations = []

            for idx, person in enumerate(person_data):

                crop = person["crop"]
                x1_p, y1_p, x2_p, y2_p = person["bbox"]

                if crop.size == 0:
                    continue

                ppe_results = ppe_model(crop)

                detected = []

                for b in ppe_results[0].boxes:
                    cls_id = int(b.cls[0])
                    class_name = ppe_model.names[cls_id]
                    detected.append(class_name)

                    # 🔥 GET LOCAL BOX
                    cx1, cy1, cx2, cy2 = map(int, b.xyxy[0])

                    # 🔥 MAP TO ORIGINAL FRAME
                    gx1 = x1_p + cx1
                    gy1 = y1_p + cy1
                    gx2 = x1_p + cx2
                    gy2 = y1_p + cy2

                    # 🔥 DRAW PPE BOX
                    cv2.rectangle(frame, (gx1, gy1), (gx2, gy2), (255, 0, 0), 2)

                    cv2.putText(
                        frame,
                        class_name,
                        (gx1, gy1 - 5),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.5,
                        (255, 0, 0),
                        2
                    )

                detected = [d.lower() for d in detected]

                missing = []

                if "helmet" not in detected:
                    missing.append("helmet")
                if "jacket" not in detected:
                    missing.append("jacket")
                if "gloves" not in detected:
                    missing.append("gloves")
                if "boots" not in detected:
                    missing.append("boots")
                if "goggles" not in detected:
                    missing.append("goggles")

                if missing:
                    violations.append({
                        "person_id": idx,
                        "missing": missing
                    })

            latest_status = {
                "total_persons": len(person_data),
                "violations": violations,
                "safe": len(violations) == 0
            }

            # ---------------- DRAW ----------------
            for i, person in enumerate(person_data):
                x1, y1, x2, y2 = person["bbox"]

                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)

            # ---------------- ENCODE ----------------
            ret, buffer = cv2.imencode('.jpg', frame)
            if not ret:
                continue

            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' +
                   buffer.tobytes() + b'\r\n')

        except Exception as e:
            print("ERROR:", e)
            continue
        
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