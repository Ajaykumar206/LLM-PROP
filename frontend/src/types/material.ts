export interface LatticeInfo {
  a: number;
  b: number;
  c: number;
  alpha: number;
  beta: number;
  gamma: number;
  volume: number;
  matrix?: number[][];
}

export interface AtomSite {
  element: string;
  coords: [number, number, number];
  color: string;
  radius: number;
  index: number;
  label?: string;
  fractional_coords?: [number, number, number];
}

export interface BondInfo {
  site1_idx: number;
  site2_idx: number;
  length_angstrom: number;
  color?: string;
}

export interface CrystalStructure3D {
  material_id: string;
  formula: string;
  lattice: LatticeInfo;
  sites: AtomSite[];
  bonds: BondInfo[];
  elements: string[];
  unit_cell_box: number[][][];
}

export interface PropertyValue {
  name: string;
  value?: number | null;
  formatted_value: string;
  unit: string;
  source: string;
  is_predicted: boolean;
  uncertainty?: string | null;
  description?: string | null;
}

export interface PolymorphOption {
  material_id: string;
  formula: string;
  crystal_system: string;
  space_group: string;
  space_group_number: number;
  energy_above_hull_eV_atom: number;
  is_stable: boolean;
  band_gap_eV: number;
  density_g_cm3: number;
  volume_A3: number;
}

export interface MaterialDetail {
  material_id: string;
  formula: string;
  composition: string;
  elements: string[];
  chemical_system: string;
  crystal_system: string;
  space_group: string;
  space_group_number: number;
  properties: Record<string, PropertyValue>;
  lattice: LatticeInfo;
  structure_3d?: CrystalStructure3D | null;
  polymorphs_count: number;
  other_polymorphs: PolymorphOption[];
  source: string;
}

export interface MaterialSummary {
  material_id: string;
  formula: string;
  crystal_system: string;
  space_group: string;
  space_group_number: number;
  energy_above_hull_eV_atom: number;
  is_stable: boolean;
  band_gap_eV: number;
  density_g_cm3: number;
}

export interface SearchResponse {
  query: string;
  normalized_formula?: string | null;
  count: number;
  matches: MaterialSummary[];
  selected_material?: MaterialDetail | null;
  requires_polymorph_selection: boolean;
  source: string;
  message?: string | null;
}

export interface SinglePropertyPrediction {
  property_name: string;
  target_key: string;
  predicted_value: number;
  formatted_value: string;
  unit: string;
  model_name: string;
  model_type: string;
  is_trained: boolean;
  train_mae?: number | null;
  train_r2?: number | null;
  test_mae?: number | null;
  test_r2?: number | null;
  uncertainty_95ci?: string | null;
  features_used: string[];
}

export interface PredictionResponse {
  formula: string;
  normalized_formula: string;
  predictions: Record<string, SinglePropertyPrediction>;
  crystal_description?: string | null;
  status: string;
  warnings: string[];
}

export interface ExplanationResponse {
  formula: string;
  material_id?: string | null;
  summary: string;
  crystal_structure_analysis: string;
  physical_and_electronic_properties: string;
  stability_and_thermodynamics: string;
  potential_applications: string[];
  limitations_and_uncertainties: string;
  raw_markdown: string;
  model_used: string;
  tokens_used?: number | null;
}

export interface HealthStatus {
  status: string;
  version: string;
  database: {
    loaded: boolean;
    total_materials: number;
    robocrys_descriptions_loaded: number;
  };
  services: {
    materials_project_api: {
      configured: boolean;
      status: string;
    };
    openai_api: {
      configured: boolean;
      model: string;
      status: string;
    };
  };
  models: {
    t5_materials_predictor?: {
      loaded: boolean;
      model_type: string;
      checkpoint_available: boolean;
      metrics?: Record<string, any>;
    };
  };
}
