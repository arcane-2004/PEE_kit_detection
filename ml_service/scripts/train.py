import os
import gc
import time
import subprocess
import torch
from ultralytics import YOLO

# ── Environment ───────────────────────────────────────────────────────────────
os.environ["PYTORCH_MPS_HIGH_WATERMARK_RATIO"] = "0.65"
os.environ["PYTORCH_MPS_LOW_WATERMARK_RATIO"]  = "0.45"

# ── Config ────────────────────────────────────────────────────────────────────
SYNC_EVERY     = 100

# VALIDATE_EVERY = 5
SWAP_DRAIN_WAIT = 15  # seconds to wait for swap to drain after purge


# ── Callbacks ─────────────────────────────────────────────────────────────────
def on_batch_end(trainer):
    on_batch_end._count = getattr(on_batch_end, '_count', 0) + 1
    if on_batch_end._count % SYNC_EVERY == 0:
        torch.mps.synchronize()

def on_epoch_end(trainer):
    on_batch_end._count = 0
    epoch = trainer.epoch


    # Always runs — MPS release every epoch
    torch.mps.synchronize()
    torch.mps.empty_cache()
    gc.collect()
    print(f"\n[Epoch {epoch}] MPS cleared | "
          f"allocated: {torch.mps.current_allocated_memory()/1e9:.2f} GB | "
          f"driver: {torch.mps.driver_allocated_memory()/1e9:.2f} GB")

    # Only runs every PURGE_EVERY epochs — swap drain cycle

    result = subprocess.run(['sudo', '-n', 'purge'], capture_output=True, text=True)
    if result.returncode == 0:
        print(f"[Epoch {epoch}] first purge done ✓")

        print(f"[Epoch {epoch}] waiting {SWAP_DRAIN_WAIT}s for swap to drain...")
        time.sleep(SWAP_DRAIN_WAIT)

        subprocess.run(['sudo', '-n', 'purge'], capture_output=True, text=True)
        print(f"[Epoch {epoch}] second purge done ✓ | "
                f"allocated: {torch.mps.current_allocated_memory()/1e9:.2f} GB | "
                f"driver: {torch.mps.driver_allocated_memory()/1e9:.2f} GB")
    else:
        print(f"[Epoch {epoch}] purge failed: {result.stderr.strip()}")

# def on_val_start(trainer):
    # if trainer.epoch % VALIDATE_EVERY != 0:
    #     trainer.validator = None

# ── Model ─────────────────────────────────────────────────────────────────────
model = YOLO("runs/detect/finetune_v2_150epochs/weights/last.pt")
model.add_callback("on_train_batch_end", on_batch_end)
model.add_callback("on_train_epoch_end", on_epoch_end)
# model.add_callback("on_val_start",       on_val_start)

# ── Training ──────────────────────────────────────────────────────────────────
# model.train(
#     data    = "../dataset/PPE_kit_dataset/data.yaml",
#     epochs  = 80,
#     imgsz   = 512,
#     batch   = 6,
#     device  = "mps",
#     workers = 2,
#     cache   = False,
#     amp     = False,
#     val     = True,
#     conf    = 0.3,
#     iou     = 0.6,
#     max_det = 100,
#     cos_lr  = True,
#     lrf     = 0.001,
#     warmup_epochs = 0,
#     patience = 20,
#     plots   = False,
#     resume  = True,
# )

model.train(
    data          = "../dataset/PPE_kit_dataset/data.yaml",
    epochs        = 50,             # additional 50 epochs on top of 100

    # ── Image size — bigger helps gloves + small objects ──
    imgsz         = 512,            # up from 512

    # ── Batch — reduced to compensate for larger imgsz ──
    batch         = 4,              # 512→640 needs more memory per image

    device        = "mps",
    workers       = 2,
    cache         = False,
    amp           = False,
    exist_ok      = False,

    # ── Learning rate — fine-tuning range, not full training ──
    optimizer     = "AdamW",
    lr0           = 0.0001,         # 10x lower than default — fine-tuning
    lrf           = 0.01,
    cos_lr        = True,
    warmup_epochs = 2,              # short warmup since weights are already good

    # ── Augmentation — heavier augmentation for weak classes ──
    hsv_h         = 0.015,
    hsv_s         = 0.7,
    hsv_v         = 0.4,
    fliplr        = 0.5,
    mosaic        = 1.0,
    mixup         = 0.1,            # mix images — helps generalization
    copy_paste    = 0.1,            # copy-paste augmentation for small objects
    erasing       = 0.4,

    # ── Detection ──
    conf          = 0.3,
    iou           = 0.6,
    max_det       = 100,

    # ── Early stopping ──
    patience      = 15,             # stop if no improvement for 15 epochs

    val           = True,
    plots         = True,           # enable — useful to see improvement curves
    name          = "finetune_v2_150epochs",  # ← separate folder
    resume=True
)
# ```

## What each change targets
# ```
#     imgsz=640          → gloves are small — bigger resolution = more detail
#     lr0=0.0001         → fine-tuning rate, not relearning from scratch
#     mixup=0.1          → blends images, improves generalization on Human class
#     copy_paste=0.1     → copies small objects into scenes, directly helps Gloves
#     warmup_epochs=2    → short warmup since weights are already trained
#     plots=True         → you want to see the improvement curves this time
#     best.pt            → start from best checkpoint, not last
# ```

## Expected improvement
# ```
# Current → Target (after 50 more epochs)
# ────────────────────────────────────────
# Gloves:  0.541 → 0.62+   (copy_paste helps most here)
# Human:   0.558 → 0.63+   (mixup helps most here)
# Overall: 0.674 → 0.72+