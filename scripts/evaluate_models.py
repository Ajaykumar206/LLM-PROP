import sys
from pathlib import Path

# Add project root to path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from training.evaluate import evaluate_t5_model

def main():
    print("=" * 65)
    print("LLM-Prop: Model Evaluation CLI Entrypoint")
    print("=" * 65)
    results = evaluate_t5_model(test_sample_limit=150)
    print("\nEvaluation successfully completed.")

if __name__ == "__main__":
    main()
