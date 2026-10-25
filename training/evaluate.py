import sys
import os
import json
import time
from pathlib import Path
from typing import Dict, Any, List

# Ensure repository root is on sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg") # Non-interactive headless backend
import matplotlib.pyplot as plt

from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    confusion_matrix,
    roc_curve,
    roc_auc_score,
    mean_absolute_error,
    mean_squared_error,
    r2_score
)

from backend.utils.config import settings
from backend.utils.logging_config import logger
from backend.models.t5_predictor import T5PropertyPredictor

def evaluate_t5_model(test_sample_limit: int = 150) -> Dict[str, Any]:
    """
    Evaluates fine-tuned T5 model on held-out test data.
    Computes classification metrics (Accuracy, F1, Confusion Matrix, ROC-AUC)
    and continuous property metrics (MAE, RMSE, R²), then plots and saves results.
    """
    print("=" * 70)
    print("LLM-Prop: Comprehensive T5 Evaluation (Classification & Regression)")
    print("=" * 70)

    test_file = settings.SPLITS_DIR / "test.csv"
    if not test_file.exists():
        test_file = settings.PROCESSED_DATA_PATH

    if not test_file.exists():
        logger.error(f"Test dataset not found at {test_file}")
        return {}

    df = pd.read_csv(test_file)
    if len(df) > test_sample_limit:
        # Sample with balanced metal/non-metal representation
        metals = df[df["band_gap_eV"] == 0.0]
        non_metals = df[df["band_gap_eV"] > 0.0]
        n_metals = min(len(metals), test_sample_limit // 2)
        n_non_metals = min(len(non_metals), test_sample_limit - n_metals)
        df = pd.concat([
            metals.sample(n=n_metals, random_state=42),
            non_metals.sample(n=n_non_metals, random_state=42)
        ]).sample(frac=1.0, random_state=42).reset_index(drop=True)

    print(f"Evaluating model on {len(df)} independent test materials...")

    predictor = T5PropertyPredictor()
    is_loaded = predictor.load()

    y_true_metal: List[int] = []
    y_pred_metal: List[int] = []
    y_score_metal: List[float] = []

    y_true_bg, y_pred_bg = [], []
    y_true_fe, y_pred_fe = [], []
    y_true_dens, y_pred_dens = [], []

    for _, row in df.iterrows():
        formula = str(row.get("formula", "")).strip()
        cs = str(row.get("crystal_system", "")).strip()
        spg = str(row.get("space_group", "")).strip()

        actual_bg = float(row.get("band_gap_eV", 0.0) or 0.0)
        actual_fe = float(row.get("formation_energy_eV_atom", 0.0) or 0.0)
        actual_dens = float(row.get("density_g_cm3", 1.0) or 1.0)

        actual_metal = 1 if actual_bg == 0.0 else 0
        y_true_metal.append(actual_metal)
        y_true_bg.append(actual_bg)
        y_true_fe.append(actual_fe)
        y_true_dens.append(actual_dens)

        # Predict with T5
        preds = predictor.predict_properties(formula, cs, spg)
        p_bg = preds["band_gap"].predicted_value
        p_fe = preds["formation_energy"].predicted_value
        p_dens = preds["density"].predicted_value

        y_pred_bg.append(p_bg)
        y_pred_fe.append(p_fe)
        y_pred_dens.append(p_dens)

        # Classification decision & continuous score
        pred_metal = 1 if p_bg < 0.1 else 0
        y_pred_metal.append(pred_metal)

        # Sigmoid probability score based on predicted bandgap (p_bg near 0 -> high probability of metal)
        metal_prob = 1.0 / (1.0 + np.exp(p_bg * 2.0))
        y_score_metal.append(float(metal_prob))

    # Classification Metrics
    acc = float(accuracy_score(y_true_metal, y_pred_metal))
    f1_weighted = float(f1_score(y_true_metal, y_pred_metal, average="weighted", zero_division=0))
    f1_macro = float(f1_score(y_true_metal, y_pred_metal, average="macro", zero_division=0))
    f1_binary = float(f1_score(y_true_metal, y_pred_metal, average="binary", zero_division=0))
    prec = float(precision_score(y_true_metal, y_pred_metal, zero_division=0))
    rec = float(recall_score(y_true_metal, y_pred_metal, zero_division=0))

    cm = confusion_matrix(y_true_metal, y_pred_metal)
    cm_list = cm.tolist()

    # ROC Curve & AUC
    try:
        fpr, tpr, thresholds = roc_curve(y_true_metal, y_score_metal)
        roc_auc = float(roc_auc_score(y_true_metal, y_score_metal))
        roc_data = {
            "fpr": [round(float(x), 4) for x in fpr],
            "tpr": [round(float(x), 4) for x in tpr],
            "thresholds": [round(float(x), 4) for x in thresholds],
            "roc_auc": round(roc_auc, 4)
        }
    except Exception as e:
        logger.warning(f"ROC calculation exception: {e}")
        roc_auc = 0.5
        roc_data = {"fpr": [0.0, 1.0], "tpr": [0.0, 1.0], "roc_auc": 0.5}

    # Continuous Regression Metrics
    bg_mae = float(mean_absolute_error(y_true_bg, y_pred_bg))
    bg_rmse = float(np.sqrt(mean_squared_error(y_true_bg, y_pred_bg)))
    bg_r2 = float(r2_score(y_true_bg, y_pred_bg))

    fe_mae = float(mean_absolute_error(y_true_fe, y_pred_fe))
    fe_rmse = float(np.sqrt(mean_squared_error(y_true_fe, y_pred_fe)))
    fe_r2 = float(r2_score(y_true_fe, y_pred_fe))

    dens_mae = float(mean_absolute_error(y_true_dens, y_pred_dens))
    dens_rmse = float(np.sqrt(mean_squared_error(y_true_dens, y_pred_dens)))
    dens_r2 = float(r2_score(y_true_dens, y_pred_dens))

    results = {
        "evaluation_timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "model_name": "T5-Materials-Seq2Seq",
        "sample_count": len(df),
        "is_loaded": is_loaded,
        "classification_metrics": {
            "task": "Electronic Type Classification (Metal vs Non-Metal)",
            "accuracy": round(acc, 4),
            "f1_score_weighted": round(f1_weighted, 4),
            "f1_score_macro": round(f1_macro, 4),
            "f1_score_binary": round(f1_binary, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "confusion_matrix": cm_list,
            "roc_auc": round(roc_auc, 4),
            "roc_curve": roc_data
        },
        "metrics": {
            "band_gap_eV": {
                "property": "Band Gap",
                "unit": "eV",
                "mae": round(bg_mae, 3),
                "rmse": round(bg_rmse, 3),
                "r2": round(bg_r2, 3)
            },
            "formation_energy_eV_atom": {
                "property": "Formation Energy per Atom",
                "unit": "eV/atom",
                "mae": round(fe_mae, 3),
                "rmse": round(fe_rmse, 3),
                "r2": round(fe_r2, 3)
            },
            "density_g_cm3": {
                "property": "Density",
                "unit": "g/cm³",
                "mae": round(dens_mae, 3),
                "rmse": round(dens_rmse, 3),
                "r2": round(dens_r2, 3)
            }
        }
    }

    print("\n--- Model Evaluation Results ---")
    print(f"Classification Task: Electronic Type (Metal vs Non-Metal)")
    print(f"  Accuracy:  {acc * 100:.2f}%")
    print(f"  F1 Score:  {f1_weighted:.4f} (Weighted), {f1_macro:.4f} (Macro)")
    print(f"  Precision: {prec:.4f} | Recall: {rec:.4f}")
    print(f"  ROC-AUC:   {roc_auc:.4f}")
    print(f"  Confusion Matrix: {cm_list}")
    print("\nContinuous Regression Properties:")
    print(f"  Band Gap (eV):        MAE = {bg_mae:.3f} | RMSE = {bg_rmse:.3f} | R² = {bg_r2:.3f}")
    print(f"  Formation Energy:     MAE = {fe_mae:.3f} | RMSE = {fe_rmse:.3f} | R² = {fe_r2:.3f}")
    print(f"  Density (g/cm³):      MAE = {dens_mae:.3f} | RMSE = {dens_rmse:.3f} | R² = {dens_r2:.3f}")

    # Generate and save plots
    reports_dir = settings.OUTPUTS_DIR / "reports"
    reports_dir.mkdir(parents=True, exist_ok=True)
    _plot_confusion_matrix(cm, reports_dir / "confusion_matrix.png")
    _plot_roc_curve(roc_data["fpr"], roc_data["tpr"], roc_auc, reports_dir / "roc_curve.png")

    # Save JSON reports
    report_file = reports_dir / "t5_evaluation_report.json"
    with open(report_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    meta_file = settings.METADATA_DIR / "t5_evaluation_metrics.json"
    settings.METADATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(meta_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    chk_meta = settings.T5_MODEL_DIR / "metrics.json"
    settings.T5_MODEL_DIR.mkdir(parents=True, exist_ok=True)
    with open(chk_meta, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    print(f"\n[SAVED] Evaluation reports and plots saved to {reports_dir}")
    return results

def _plot_confusion_matrix(cm: np.ndarray, save_path: Path):
    try:
        fig, ax = plt.subplots(figsize=(6, 5))
        cax = ax.matshow(cm, cmap="Blues", alpha=0.85)
        for i in range(cm.shape[0]):
            for j in range(cm.shape[1]):
                ax.text(x=j, y=i, s=str(cm[i, j]), va="center", ha="center", fontsize=14, weight="bold")
        fig.colorbar(cax)
        ax.set_xticks([0, 1])
        ax.set_yticks([0, 1])
        ax.set_xticklabels(["Non-Metal", "Metal"])
        ax.set_yticklabels(["Non-Metal", "Metal"])
        ax.set_xlabel("Predicted Label", fontsize=11, labelpad=10)
        ax.set_ylabel("True Ground Truth Label", fontsize=11)
        ax.set_title("T5 Material Classification: Confusion Matrix", fontsize=12, pad=15, weight="bold")
        plt.tight_layout()
        plt.savefig(save_path, dpi=200)
        plt.close()
    except Exception as e:
        logger.warning(f"Could not save confusion matrix plot: {e}")

def _plot_roc_curve(fpr: List[float], tpr: List[float], roc_auc: float, save_path: Path):
    try:
        fig, ax = plt.subplots(figsize=(6, 5))
        ax.plot(fpr, tpr, color="#2563eb", lw=2.5, label=f"T5 Model (AUC = {roc_auc:.3f})")
        ax.plot([0, 1], [0, 1], color="#94a3b8", lw=1.5, linestyle="--", label="Random Classifier (AUC = 0.500)")
        ax.set_xlim([0.0, 1.0])
        ax.set_ylim([0.0, 1.05])
        ax.set_xlabel("False Positive Rate (FPR)", fontsize=11)
        ax.set_ylabel("True Positive Rate (TPR)", fontsize=11)
        ax.set_title("T5 Material Classification: ROC Curve", fontsize=12, pad=12, weight="bold")
        ax.legend(loc="lower right", frameon=True)
        ax.grid(True, linestyle=":", alpha=0.6)
        plt.tight_layout()
        plt.savefig(save_path, dpi=200)
        plt.close()
    except Exception as e:
        logger.warning(f"Could not save ROC curve plot: {e}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Evaluate fine-tuned T5 model on materials properties")
    parser.add_argument("--samples", type=int, default=150, help="Number of test samples to evaluate (default: 150)")
    args = parser.parse_args()

    evaluate_t5_model(test_sample_limit=args.samples)

