"""
Zerve block: figures
Type: Python
Depends on: backtest
Required packages (Environment > Requirements > Python): matplotlib
Outputs:
    confusion_fig_path  : str path to the confusion-matrix PNG
    signature_fig_path  : str path to the signature-trend timeline PNG

These two figures are the visual headline for the demo and the Devpost
write-up: confusion matrix on mainstream vs fizzled, and a single
signature trend showing TPS rising weeks before its Google Trends peak.
"""
import os

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from zerve import variable

backtest_results = variable("backtest", "backtest_results")
backtest_outcome_metrics = variable("backtest", "backtest_outcome_metrics")
backtest_accuracy = variable("backtest", "backtest_accuracy")
signature_timeline = variable("backtest", "signature_timeline")

OUT_DIR = "/tmp/trendseismograph_figs"
os.makedirs(OUT_DIR, exist_ok=True)

# --- Figure 1: confusion matrix --------------------------------------------
cm = backtest_outcome_metrics["confusion_matrix"]
matrix = np.array([
    [cm["true_negative"], cm["false_positive"]],
    [cm["false_negative"], cm["true_positive"]],
])
labels = ["fizzled", "mainstream"]

fig, ax = plt.subplots(figsize=(5.2, 4.6))
im = ax.imshow(matrix, cmap="Blues")
ax.set_xticks([0, 1], labels=[f"pred\n{l}" for l in labels])
ax.set_yticks([0, 1], labels=[f"actual\n{l}" for l in labels])
for i in range(2):
    for j in range(2):
        ax.text(j, i, str(matrix[i, j]), ha="center", va="center",
                color="white" if matrix[i, j] > matrix.max() / 2 else "black", fontsize=14)
acc = backtest_accuracy["overall_accuracy"]
ci = backtest_accuracy["ci95"]
om = backtest_outcome_metrics
ax.set_title(
    f"Confusion matrix — accuracy {acc:.0%}\n"
    f"95% CI [{ci['lower']:.2f}, {ci['upper']:.2f}] · F1 {om['f1']:.2f}",
    fontsize=11,
)
plt.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
plt.tight_layout()
confusion_fig_path = os.path.join(OUT_DIR, "confusion_matrix.png")
fig.savefig(confusion_fig_path, dpi=150)
plt.close(fig)
print(f"Saved {confusion_fig_path}")

# --- Figure 2: signature trend timeline ------------------------------------
if signature_timeline.empty:
    print("signature_timeline is empty; skipping signature figure")
    signature_fig_path = ""
else:
    sig = signature_timeline.sort_values("snapshot_date").copy()
    slug = sig["slug"].iloc[0]
    name_row = backtest_results[backtest_results["slug"] == slug]
    title_name = name_row["name"].iloc[0] if not name_row.empty else slug
    weeks_before = name_row["weeks_before_peak"].iloc[0] if not name_row.empty else None

    fig, ax1 = plt.subplots(figsize=(8.5, 4.6))
    ax1.plot(sig["snapshot_date"], sig["tps"], color="#1f77b4", marker="o", label="TPS")
    ax1.axhline(7.0, color="#1f77b4", linestyle="--", alpha=0.4, label="TPS=7 threshold")
    ax1.set_ylabel("Tipping Point Score (0–10)", color="#1f77b4")
    ax1.set_ylim(0, 10)
    ax1.tick_params(axis="y", labelcolor="#1f77b4")

    ax2 = ax1.twinx()
    ax2.plot(sig["snapshot_date"], sig["google_interest"], color="#d62728",
             marker="x", label="Google Trends interest (7d mean)")
    ax2.set_ylabel("Google Trends interest (0–100)", color="#d62728")
    ax2.tick_params(axis="y", labelcolor="#d62728")

    peak_idx = sig["weeks_from_peak"].abs().idxmin()
    peak_date = sig.loc[peak_idx, "snapshot_date"]
    ax1.axvline(peak_date, color="black", linestyle=":", alpha=0.6, label="Google peak")

    subtitle = f"TPS crossed 7 ≈ {weeks_before} weeks before peak" if weeks_before else "Lead time not measurable"
    ax1.set_title(f"{title_name} — {subtitle}")
    ax1.set_xlabel("Snapshot date")
    fig.autofmt_xdate()

    h1, l1 = ax1.get_legend_handles_labels()
    h2, l2 = ax2.get_legend_handles_labels()
    ax1.legend(h1 + h2, l1 + l2, loc="upper left", fontsize=9)
    plt.tight_layout()
    signature_fig_path = os.path.join(OUT_DIR, f"signature_{slug}.png")
    fig.savefig(signature_fig_path, dpi=150)
    plt.close(fig)
    print(f"Saved {signature_fig_path}")
