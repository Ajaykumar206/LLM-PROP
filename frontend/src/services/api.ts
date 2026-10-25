import {
  SearchResponse,
  MaterialDetail,
  CrystalStructure3D,
  PredictionResponse,
  ExplanationResponse,
  HealthStatus
} from '../types/material';

const API_BASE = (import.meta.env.VITE_API_URL as string) || '/api';

export async function checkHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) {
    throw new Error(`Health check failed with status ${res.status}`);
  }
  return res.json();
}

export async function searchMaterials(query: string): Promise<SearchResponse> {
  const enc = encodeURIComponent(query.trim());
  const res = await fetch(`${API_BASE}/materials/search?q=${enc}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Search failed with status ${res.status}`);
  }
  return res.json();
}

export async function getMaterialDetail(materialId: string): Promise<MaterialDetail> {
  const res = await fetch(`${API_BASE}/materials/${encodeURIComponent(materialId)}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch material ${materialId}`);
  }
  return res.json();
}

export async function getCrystalStructure(materialId: string): Promise<CrystalStructure3D> {
  const res = await fetch(`${API_BASE}/materials/${encodeURIComponent(materialId)}/structure`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch 3D crystal structure for ${materialId}`);
  }
  return res.json();
}

export async function predictProperties(
  formula: string,
  crystalSystem?: string,
  spaceGroup?: string
): Promise<PredictionResponse> {
  const res = await fetch(`${API_BASE}/predictions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      formula,
      crystal_system: crystalSystem,
      space_group: spaceGroup
    })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Prediction failed with status ${res.status}`);
  }
  return res.json();
}

export async function generateExplanation(
  materialDetail: MaterialDetail,
  predictedProps?: Record<string, any>,
  robocrysText?: string
): Promise<ExplanationResponse> {
  const res = await fetch(`${API_BASE}/explanations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      material_id: materialDetail.material_id,
      formula: materialDetail.formula,
      crystal_system: materialDetail.crystal_system,
      space_group: materialDetail.space_group,
      properties: materialDetail.properties,
      predicted_properties: predictedProps || {},
      robocrys_text: robocrysText || ''
    })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Explanation failed with status ${res.status}`);
  }
  return res.json();
}

export function getCifDownloadUrl(materialId: string): string {
  return `${API_BASE}/materials/${encodeURIComponent(materialId)}/cif`;
}
