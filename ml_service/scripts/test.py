from ultralytics import YOLO
import matplotlib.pyplot as plt
import pandas as pd

print("Starting test..............")

#-----------------------------
# LOAD MODEL
#-----------------------------
# model = YOLO("runs/detect/finetune_v2_150epochs/weights/best.pt")
# model = YOLO('../models/runs2/detect/train/weights/best.pt')
model = YOLO("../models/runs2/detect/improve_multiclass/exp1/weights/best.pt")

#-------------------------
# EVLUATE
#-------------------------
metrics = model.val(
    data = "../dataset/PPE_kit_dataset/data.yaml",
    split = "test",
    conf = 0.25,
    plots=True
)

names = model.names

#-------------------------
# OVERALL METRICS
#-------------------------
precision = round(metrics.box.mp * 100, 2)
recall = round(metrics.box.mr * 100, 2)
map50 = round(metrics.box.map50 * 100, 2)
map5095 = round(metrics.box.map * 100, 2)
f1 = round((2 * precision * recall) / (precision + recall + 1e-9), 2)

overall_labels = ["Precision", "Recall", "mAP50", "mAP50-95", "F1"]
overall_values = [precision, recall, map50, map5095, f1]

#------------------------
# PRE CLASS TABLE
#------------------------
data = []

for i, name in names.items():
    p, r, ap50, ap = metrics.box.class_result(i)
    f1_c = (2 * p * r) / (p + r + 1e-9)
    
    data.append([
        name,
        p*100,
        r*100,
        ap50*100,
        ap*100,
        f1_c*100
    ])

df = pd.DataFrame(
    data,
    columns=["Class","Precision","Recall","mAP50","mAP50-95","F1"]
)

#-------------------------
# CREATE FIGURE
#-------------------------
fig = plt.figure(figsize=(12,6))

#----- SMALL OVERALL BAR CHART ------------
ax1 = fig.add_axes([0.65, 0.55, 0.3, 0.35])
ax1.bar(overall_labels, overall_values)
ax1.set_title("Overall Metrics")
ax1.tick_params(axis='x', rotation=30)


# ---------------------------
# SMALL CONFUSION MATRIX
# ---------------------------
cm = metrics.confusion_matrix.matrix
class_names = list(model.names.values())

ax3 = fig.add_axes([0.05, 0.55, 0.25, 0.3])  # small position

im = ax3.imshow(cm)

ax3.set_title("Confusion Matrix", fontsize=10)

# ticks
ax3.set_xticks(range(len(class_names)))
ax3.set_yticks(range(len(class_names)))

# labels (small font)
ax3.set_xticklabels(class_names, rotation=45, fontsize=8)
ax3.set_yticklabels(class_names, fontsize=8)

# axis labels
ax3.set_xlabel("Predicted", fontsize=8)
ax3.set_ylabel("Actual", fontsize=8)

# optional: numbers inside cells (only if small classes)
for i in range(len(cm)):
    for j in range(len(cm[i])):
        if cm[i][j] > 0:  # avoid clutter
            ax3.text(j, i, int(cm[i][j]),
                     ha='center', va='center',
                     fontsize=5)

# small colorbar
cbar = fig.colorbar(im, ax=ax3, fraction=0.046, pad=0.04)
cbar.ax.tick_params(labelsize=6)



#----- CLASS TABLE -------------
ax2 = fig.add_axes([0.05, 0.05, 0.9, 0.45])
ax2.axis("off")

# Add "Overall" row properly
overall_row = ["Overall"] + overall_values  

# Convert dataframe to list
table_data = df.round(2).values.tolist()

# Add overall row at end
table_data.append(overall_row)

table = ax2.table(
    cellText = table_data,
    colLabels = df.columns,
    loc = 'center'
)

table.auto_set_font_size(False)
table.set_fontsize(10)
table.scale(1, 1.5)

#--------------------
# save
#-------------------
plt.savefig('final_summary.png', bbox_inches='tight')
plt.close()

print("saved: final_summary.png")

print("Ending test.......")
