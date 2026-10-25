#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "=========================================================="
echo " Starting LLM-Prop Production Build on Render"
echo "=========================================================="

echo "--> [1/3] Building React Frontend SPA..."
cd frontend
npm install --no-audit --no-fund
npm run build
cd ..

echo "--> [2/3] Installing Python Dependencies..."
python -m pip install --upgrade pip
# Install CPU-only torch first to save download time and disk space on Render
python -m pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu
python -m pip install --no-cache-dir -r requirements.txt

# Optional: Download external model weights if MODEL_WEIGHTS_URL is specified
if [ -n "$MODEL_WEIGHTS_URL" ]; then
    echo "--> [3/3] Downloading T5 model weights from external URL..."
    mkdir -p models/t5_finetuned
    curl -L -o models/t5_finetuned/model.safetensors "$MODEL_WEIGHTS_URL"
else
    echo "--> [3/3] Skipping external weights download (using physics-grounded fallback/baseline or local weights)."
fi

echo "=========================================================="
echo " Build Completed Successfully! Ready for uvicorn."
echo "=========================================================="
