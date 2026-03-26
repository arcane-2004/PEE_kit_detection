def is_inside(person_box, item_box):
    px1, py1, px2, py2 = person_box
    ix1, iy1, ix2, iy2 = item_box

    cx = (ix1 + ix2) // 2
    cy = (iy1 + iy2) // 2

    return px1 <= cx <= px2 and py1 <= cy <= py2


def detect_violations(results, model):
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