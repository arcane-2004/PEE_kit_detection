import cv2
from ultralytics import YOLO
import time

# Load Model
model = YOLO("../models/runs/detect/finetune_v2_150epochs/weights/best.pt")
# model = YOLO("../models/runs1/segment/ppe_runs/ppe_v1/weights/best.pt")

#Open Webcam
cap = cv2.VideoCapture(0)

prev_time = 0

while True:
    ret, frame = cap.read()
    if not ret:
        break
    
    #Run Inference
    results = model(frame, conf=0.5)
    
    # Draw results
    annotated_frame = results[0].plot()
    
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