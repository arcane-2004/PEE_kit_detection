def is_inside(person_box, item_box):
    px1, py1, px2, py2 = person_box
    ix1, iy1, ix2, iy2 = item_box

    # Intersection
    inter_x1 = max(px1, ix1)
    inter_y1 = max(py1, iy1)
    inter_x2 = min(px2, ix2)
    inter_y2 = min(py2, iy2)

    if inter_x2 <= inter_x1 or inter_y2 <= inter_y1:
        return False

    inter_area = (inter_x2 - inter_x1) * (inter_y2 - inter_y1)
    item_area = (ix2 - ix1) * (iy2 - iy1)

    # If 30% of item inside person → valid
    return (inter_area / item_area) > 0.3


def detect_violations(human_results, ppe_results, ppe_model):
    humans = []
    ppe_items = []

    # Extract humans
    for box in human_results[0].boxes:
        conf = float(box.conf[0])
        if conf < 0.5:
            continue

        x1, y1, x2, y2 = map(int, box.xyxy[0])
        humans.append((x1, y1, x2, y2))

    # Extract PPE
    for box in ppe_results[0].boxes:
        conf = float(box.conf[0])
        if conf < 0.4:
            continue

        class_name = ppe_model.names[int(box.cls[0])].lower()
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        ppe_items.append((class_name, x1, y1, x2, y2))

    alerts = []

    for i, person in enumerate(humans):
        has = {
            "helmet": False,
            "jacket": False,
            "boots": False,
            "gloves": False,
            "goggles": False
        }

        for item in ppe_items:
            cname, x1, y1, x2, y2 = item

            if is_inside(person, (x1, y1, x2, y2)):
                if cname in has:
                    has[cname] = True

        missing = [k.upper() for k, v in has.items() if not v]

        if missing:
            alerts.append({
                "person_id": i + 1,
                "missing": missing
            })

    return {
        "total_persons": len(humans),
        "violations": alerts,
        "safe": len(alerts) == 0
    }