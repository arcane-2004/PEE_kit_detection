import cv2
from ultralytics import YOLO
import time
from collections import Counter

# Load Model
# model = YOLO("../models/runs/detect/finetune_v2_150epochs/weights/best.pt")
# model = YOLO("../models/runs1/segment/ppe_runs/ppe_v1/weights/best.pt")
model = YOLO("../models/runs2/detect/train/weights/best.pt")

#Open Webcam
cap = cv2.VideoCapture(0)

prev_time = 0

alert_history = []
MAX_HISTORY = 10

while True:
    ret, frame = cap.read()
    if not ret:
        break
    
    #Run Inference
    results = model.track(frame, conf=0.3,  persist=True)
    
    # Draw results
    annotated_frame = results[0].plot()
    
    # Voilation logic
   # ---------------- DETECTION SPLIT ---------------- #
    humans = []
    ppe_items = []

    for box in results[0].boxes:
        
        conf = float(box.conf[0])
        if conf < 0.5:
            continue
        
        class_name = model.names[int(box.cls[0])].lower()
        x1, y1, x2, y2 = map(int, box.xyxy[0])

        if class_name == "human":
            humans.append((x1, y1, x2, y2))
        else:
            ppe_items.append((class_name, x1, y1, x2, y2))


    # ---------------- HELPER FUNCTION ---------------- #
    def is_inside(person_box, item_box):
        px1, py1, px2, py2 = person_box
        ix1, iy1, ix2, iy2 = item_box

        # center point of PPE
        cx = (ix1 + ix2) // 2
        cy = (iy1 + iy2) // 2

        return px1 <= cx <= px2 and py1 <= cy <= py2


    # ---------------- PPE MATCHING ---------------- #
    alerts = []

    for i, person in enumerate(humans):
        
        has_helmet = False
        has_jacket = False
        has_boots = False
        has_gloves = False
        has_goggles = False

        for item in ppe_items:
            class_name, x1, y1, x2, y2 = item

            if is_inside(person, (x1, y1, x2, y2)):
                
                if class_name == "helmet":
                    has_helmet = True
                elif class_name == "jacket":
                    has_jacket = True
                elif class_name == "boots":
                    has_boots = True
                elif class_name == "gloves":
                    has_gloves = True
                elif class_name == "goggles":
                    has_goggles = True

        missing = []

        if not has_helmet:
            missing.append("HELMET")
        if not has_jacket:
            missing.append("JACKET")
        if not has_boots:
            missing.append("BOOTS")
        if not has_gloves:
            missing.append("GLOVES")
        if not has_goggles:
            missing.append("GOGGLES")

        if missing:
            alerts.append(f"Person {i+1}: " + ", ".join(missing))


    # ---------------- FINAL ALERT ---------------- #
    if humans:
        if alerts:
            alert_text = "⚠️ " + " | ".join(alerts)
            color = (0, 0, 255)
        else:
            alert_text = "✅ ALL SAFE"
            color = (0, 255, 0)
    else:
        alert_text = "No Person"
        color = (255, 255, 0)


    # ---------------- SMOOTHING ---------------- #
    alert_history.append((alert_text, color))

    if len(alert_history) > MAX_HISTORY:
        alert_history.pop(0)

    alert_text, color = Counter(alert_history).most_common(1)[0][0]


    # ---------------- DISPLAY ---------------- #
    cv2.putText(
        annotated_frame,
        alert_text,
        (50, 80),
        cv2.FONT_HERSHEY_SIMPLEX,
        1.2,
        color,
        3
    )


    # ---------------- OPTIONAL: DRAW HUMAN BOXES ---------------- #
    for (x1, y1, x2, y2) in humans:
        cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (255, 0, 0), 2)
    
    # FPS calculations
    curr_time = time.time()
    fps = 1/(curr_time - prev_time) if prev_time else 0
    prev_time = curr_time
    
    cv2.putText(annotated_frame, f"FPS: {int(fps)}", (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
    
    # Show output
    cv2.imshow("PPE Detection", annotated_frame)
    
    # Exit or ESC
    if cv2.waitKey(1) & 0xFF == 27:
        break
    
cap.release()
cv2.destroyAllWindows()