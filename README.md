# LLM-Prop: AI-Powered Material Property Prediction & 3D Crystal Explorer

**LLM-Prop** is an end-to-end scientific web application combining deep learning sequence-to-sequence transformers (T5), Materials Project API crystallographic integration, Google Gemini generative explanations, and an interactive 3D Three.js crystal structure visualizer.

---

## 🌟 Key Features

1. **Intelligent Material Search & Normalization**:
   - Accepts any supported chemical formula or common name (e.g., `SiO2`, `GaAs`, `TiO2`, `Si`, `Al2O3`, `Graphene`, `NaCl`, `CaMg(CO3)2`).
   - Automatically normalizes casing and resolves chemical synonyms.
   - Searches across an offline 10,000-material DFT dataset.
   - If a crystal structure is not present locally, it automatically queries the **Materials Project API** (`MP_API_KEY`) to fetch and cache the genuine CIF file.

2. **Multi-Polymorph Disambiguation**:
   - Recognizes that a chemical formula does not uniquely identify a single crystal structure.
   - Detects all polymorphs in the dataset and orders them by thermodynamic stability ($\Delta H$ above convex hull).
   - Allows users to switch between polymorphs interactively.

3. **Fine-Tuned T5 Property Prediction & Classification**:
   - Uses exclusively a **T5 Sequence-to-Sequence** architecture fine-tuned on crystallographic formulas and space groups.
   - Predicts continuous properties:
     - **Band Gap** ($E_g$ in $\text{eV}$)
     - **Formation Energy per Atom** ($E_f$ in $\text{eV/atom}$)
     - **Mass Density** ($\rho$ in $\text{g/cm}^3$)
   - Performs binary classification:
     - **Electronic Type**: Metal ($E_g = 0$) vs. Non-Metal/Semiconductor ($E_g > 0$)
     - **Thermodynamic Stability**: Stable vs. Metastable
   - Verified evaluation metrics: **Accuracy, F1 Score, Confusion Matrix, and ROC-AUC curve**.
   - Includes 95% confidence intervals and experimental uncertainty estimates.

4. **Interactive 3D Crystal Structure Viewer**:
   - Built with **Three.js** and WebGL.
   - Displays:
     - Atoms as 3D spheres with standard **CPK elemental coloring** and covalent scaling.
     - Chemical bonds calculated from covalent and metallic bonding radii.
     - 12 wireframe boundary lines representing the unit-cell parallelepiped box.
     - Atom inspector displaying element, index, Cartesian, and fractional coordinates on hover/click.
     - Controls: auto-rotation toggle, unit-cell visibility, bond toggling, zoom in/out, view reset, and CIF download.

5. **AI Scientific Explanation Service**:
   - Grounded strictly in retrieved and predicted physical properties.
   - Generates structured scientific reports covering:
     1. Material class & identity
     2. Crystal structure and space group symmetry
     3. Meaning of electronic and mechanical properties
     4. Electronic behavior & band gap implications
     5. Thermodynamic stability & formation energy
     6. Technological applications
     7. Limitations and DFT calculation uncertainties
   - Powered by **Google Gemini API** (`gemini-1.5-flash`), with OpenAI and physics-grounded fallback engines.

---

## 🏗️ System Architecture

```
LLM__PROP/
├── backend/
│   ├── main.py                          # FastAPI server & CORS setup
│   ├── api/
│   │   ├── health_routes.py             # GET /api/health
│   │   ├── material_routes.py           # GET /api/materials/search, detail, structure, cif
│   │   └── prediction_routes.py         # POST /api/predictions, /api/explanations
│   ├── services/
│   │   ├── materials_project_service.py # mp-api client with auto-fetch & caching
│   │   ├── material_search_service.py   # Multi-polymorph search & data compiler
│   │   ├── property_prediction_service.py # T5 inference coordinator
│   │   ├── gemini_service.py            # Google Gemini AI text generator
│   │   ├── openai_service.py            # OpenAI alternative generator
│   │   ├── crystal_structure_service.py # CIF parsing, 3D coordinates & bonds
│   │   └── explanation_service.py       # Grounded multi-section scientific report
│   ├── models/
│   │   ├── t5_predictor.py              # Sequence-to-sequence T5 predictor
│   │   └── model_loader.py              # Model checkpoint & metrics loader
│   ├── schemas/
│   │   ├── material_schema.py           # Pydantic models for structures & properties
│   │   └── prediction_schema.py         # Pydantic models for predictions & AI reports
│   └── utils/
│       ├── config.py                    # Environment & configuration
│       ├── logging_config.py            # Logging setup
│       └── validators.py                # Formula normalization & validation
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CrystalViewer3D.tsx      # Three.js 3D crystal structure viewer
│   │   │   ├── MaterialSearch.tsx       # Formula search bar & preset chips
│   │   │   ├── PropertyCards.tsx        # Physical & electronic property displays
│   │   │   ├── StructureSelector.tsx    # Polymorph selection buttons
│   │   │   ├── BandStructureChart.tsx   # Electronic band structure visualization
│   │   │   ├── MaterialExplanation.tsx  # Markdown AI analysis panel
│   │   │   └── LoadingState.tsx         # Responsive loading indicators
│   │   ├── pages/Dashboard.tsx          # Main scientific application dashboard
│   │   ├── services/api.ts              # Frontend API client
│   │   └── types/material.ts            # TypeScript interfaces
│   └── package.json
│
├── training/
│   ├── dataset.py                       # Multi-task seq2seq PyTorch Dataset
│   ├── trainer.py                       # Regularized T5 trainer (AdamW, dropout, early stopping)
│   ├── train.py                         # Stratified training pipeline
│   └── evaluate.py                      # Accuracy, F1, Confusion Matrix & ROC Curve
│
├── data/
│   ├── processed/                       # 10,000 materials dataset (materials_with_bandgap_10000.csv)
│   ├── splits/                          # Stratified train (80%), val (10%), test (10%) splits
│   └── structures_cif/                  # Cached Crystallographic Information Files
│
└── tests/
    ├── test_api.py                      # FastAPI endpoint tests
    ├── test_material_search.py          # Search & polymorph tests
    ├── test_prediction.py               # T5 prediction validation tests
    └── test_structure_processing.py     # CIF & 3D coordinate processing tests
```

---

## 🚀 Installation & Windows Execution Guide

### 1. Prerequisites
- **Python**: 3.10, 3.11, or 3.12
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 2. Environment Setup

Clone or open the repository in a terminal:
```powershell
cd d:\OneDrive\Desktop\LLM__PROP
```

Ensure `.env` contains your API credentials:
```env
# Materials Project API Key (for real crystal structures)
MP_API_KEY=your_materials_project_api_key_here

# Google Gemini API Key (for material descriptions & scientific reasoning)
GEMINI_API_KEY=your_gemini_api_key_here


# Optional: OpenAI API Key
OPENAI_API_KEY=

# Server Configuration
PORT=8000
HOST=0.0.0.0
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000
```

### 3. Install Python Dependencies
```powershell
pip install -r requirements.txt
```

### 4. Run the Backend API Server
```powershell
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API documentation will be accessible at:
- Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Health Check: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

### 5. Run the Frontend Dashboard
In a separate terminal:
```powershell
cd frontend
npm install
npm run dev
```
Open your browser and navigate to:
[http://localhost:5173](http://localhost:5173)

---

## 🚀 Deploying to Render

This project is pre-configured for seamless 1-click deployment on [Render](https://render.com) using [`render.yaml`](render.yaml) or a standard Web Service.

### Quick Deploy:
1. Push your repository to GitHub.
2. In the Render Dashboard, click **New +** -> **Blueprint**.
3. Select your GitHub repository.
4. Render automatically runs [`build.sh`](build.sh) (builds frontend, installs CPU-optimized PyTorch and dependencies) and starts Uvicorn.
5. Set your `GEMINI_API_KEY` and `MP_API_KEY` in Render environment variables.
6. Your application is live at `https://<your-service-name>.onrender.com`!

For detailed instructions including manual setup and Docker options, see **[DEPLOYMENT_RENDER.md](DEPLOYMENT_RENDER.md)**.

## 🔬 Model Training & Evaluation

To train the T5 Sequence-to-Sequence model and compute classification and regression metrics:

```powershell
# Run the training pipeline (with early stopping & dropout regularization)
python -m training.train

# Or run evaluation standalone on the test split
python -m training.evaluate
```

### Evaluation Metrics Computed:
- **Accuracy**: Overall classification accuracy on Metal vs. Non-Metal.
- **F1 Score**: Weighted, Macro, and Binary F1 scores.
- **Precision & Recall**: Quantifying electronic state identification.
- **Confusion Matrix**: Saved to `outputs/reports/confusion_matrix.png`.
- **ROC Curve & AUC Score**: Saved to `outputs/reports/roc_curve.png`.
- **MAE, RMSE, $R^2$**: Continuous metrics for Band Gap, Formation Energy, and Density.

---

## 🧪 Running the Automated Test Suite

Run pytest to verify all API routes, search logic, structure parsers, and predictions:

```powershell
pytest tests/ -v
```

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health, model status, and API connection status |
| `GET` | `/api/materials/search?q={formula}` | Searches local dataset and Materials Project API |
| `GET` | `/api/materials/{material_id}` | Full material detail, lattice, and polymorph choices |
| `GET` | `/api/materials/{material_id}/structure` | 3D renderable crystal coordinates, bonds, and unit-cell |
| `GET` | `/api/materials/{material_id}/cif` | Download raw CIF file |
| `POST` | `/api/predictions` | T5 sequence-to-sequence property inference |
| `POST` | `/api/explanations` | Grounded AI scientific explanations (Gemini / OpenAI) |
