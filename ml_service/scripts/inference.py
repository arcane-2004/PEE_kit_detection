import cv2
from ultralytics import YOLO
import time
from collections import Counter

# Load Model
model = YOLO("../models/runs/detect/finetune_v2_150epochs/weights/best.pt")
# model = YOLO("../models/runs1/segment/ppe_runs/ppe_v1/weights/best.pt")

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
    results = model(frame, conf=0.3)
    
    # Draw results
    annotated_frame = results[0].plot()
    
    # Voilation logic
    human_count = 0
    helmet_count = 0
    jacket_count = 0
    boots_count = 0
    gloves_count = 0
    goggles_count = 0

    
    for box in results[0].boxes:
        
        # Confidence Filtering
        conf = float(box.conf[0])
        if conf < 0.6:
            continue
        
        class_name = model.names[int(box.cls[0])]

        if class_name == "Human":
            human_count += 1
        elif class_name == "Helmet":
            helmet_count += 1
        elif class_name == "Jacket":
            jacket_count += 1
        elif class_name == "Boots":
            boots_count += 1
        elif class_name == "Gloves":
            gloves_count += 1
        elif class_name == "Goggles":
            goggles_count += 1
    
    # ---- MULTI ALERT LOGIC ----
    alerts = []
    if human_count > 0:
        
        if helmet_count < human_count:
            alerts.append("HELMET")
        if jacket_count < human_count:
            alerts.append("JACKET")
        if boots_count < human_count:
            alerts.append("BOOTS")
        if gloves_count < human_count:
            alerts.append("GLOVES")
        if goggles_count < human_count:
            alerts.append("GOGGLES")
            
        if alerts:
            alert_text = "⚠️ MISSING: " + ", ".join(alerts)
            color = (0, 0, 255)

        else:
            alert_text = "✅ ALL SAFE"
            color = (0, 255, 0)
    else:
        alert_text = "No Person"
        color = (255, 255, 0)
    
    # ---- SMOOTHING ----
    alert_history.append((alert_text, color))

    if len(alert_history) > MAX_HISTORY:
        alert_history.pop(0)
  
    alert_text, color = Counter(alert_history).most_common(1)[0][0]
    
    # ---- DISPLAY ----
    cv2.putText(annotated_frame, alert_text, (50, 80), cv2.FONT_HERSHEY_SIMPLEX, 1.2, color, 3)
    
    # FPS calculations
    curr_time = time.time()
    fps = 1/(curr_time - prev_time) if prev_time else 0
    prev_time = curr_time
    
    cv2.putText(annotated_frame, f"FPS: {int(fps)}", (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
    
    # Show output
    cv2.imshow("PPE Detection", annotated_frame)
    
    alert_text = ""

    for box in results[0].boxes:
        cls_id = int(box.cls[0])
        class_name = model.names[cls_id]

        if class_name == "no_helmet":
            alert_text = "NO HELMET!"
        
        if class_name == "no_vest":
            alert_text = "NO VEST!"

    if alert_text:
        cv2.putText(annotated_frame, alert_text, (50, 80),cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 255), 3)
    
    # Exit or ESC
    if cv2.waitKey(1) & 0xFF == 27:
        break
    
cap.release()
cv2.destroyAllWindows()