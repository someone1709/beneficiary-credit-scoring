"""
Standalone training script.
Run as:  python train_model.py
This ensures CreditRiskPipeline is pickled under its correct module path
(app.pipelines.credit_risk) rather than __main__, so joblib.load() succeeds
when called from the FastAPI lifespan context.
"""
import logging
import sys
from pathlib import Path

# Ensure ml-service root is on sys.path so 'app' package is importable
sys.path.insert(0, str(Path(__file__).parent))

from app.pipelines.credit_risk import _generate_synthetic_data, _build_and_train, CreditRiskPipeline, FEATURES, MODEL_PATH

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    logger.info("Generating synthetic data (500 records, seed=42)...")
    df = _generate_synthetic_data(n=500, seed=42)
    logger.info("Training calibrated LogisticRegression pipeline...")
    pipeline, _, _ = _build_and_train(df)
    wrapper = CreditRiskPipeline(pipeline, FEATURES)
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    wrapper.save(MODEL_PATH)
    logger.info("Done. Model saved to: %s", MODEL_PATH)
