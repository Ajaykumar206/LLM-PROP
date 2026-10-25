// Comprehensive chemical element database & dynamic formula parser

export interface ElementData {
  symbol: string;
  name: string;
  atomicNumber: number;
  mass: number;
  color: string;
  radius: number; // in angstroms
  valenceOrbitals: string[];
}

export const PERIODIC_TABLE: Record<string, ElementData> = {
  H: { symbol: 'H', name: 'Hydrogen', atomicNumber: 1, mass: 1.008, color: '#f8fafc', radius: 0.38, valenceOrbitals: ['1s'] },
  He: { symbol: 'He', name: 'Helium', atomicNumber: 2, mass: 4.003, color: '#c084fc', radius: 0.32, valenceOrbitals: ['1s'] },
  Li: { symbol: 'Li', name: 'Lithium', atomicNumber: 3, mass: 6.94, color: '#a855f7', radius: 1.34, valenceOrbitals: ['2s'] },
  Be: { symbol: 'Be', name: 'Beryllium', atomicNumber: 4, mass: 9.012, color: '#10b981', radius: 0.90, valenceOrbitals: ['2s'] },
  B: { symbol: 'B', name: 'Boron', atomicNumber: 5, mass: 10.81, color: '#f59e0b', radius: 0.82, valenceOrbitals: ['2s', '2p'] },
  C: { symbol: 'C', name: 'Carbon', atomicNumber: 6, mass: 12.011, color: '#64748b', radius: 0.77, valenceOrbitals: ['2s', '2p'] },
  N: { symbol: 'N', name: 'Nitrogen', atomicNumber: 7, mass: 14.007, color: '#0284c7', radius: 0.75, valenceOrbitals: ['2s', '2p'] },
  O: { symbol: 'O', name: 'Oxygen', atomicNumber: 8, mass: 15.999, color: '#ef4444', radius: 0.73, valenceOrbitals: ['2s', '2p'] },
  F: { symbol: 'F', name: 'Fluorine', atomicNumber: 9, mass: 18.998, color: '#22c55e', radius: 0.71, valenceOrbitals: ['2s', '2p'] },
  Ne: { symbol: 'Ne', name: 'Neon', atomicNumber: 10, mass: 20.18, color: '#fb7185', radius: 0.69, valenceOrbitals: ['2s', '2p'] },
  Na: { symbol: 'Na', name: 'Sodium', atomicNumber: 11, mass: 22.99, color: '#818cf8', radius: 1.54, valenceOrbitals: ['3s'] },
  Mg: { symbol: 'Mg', name: 'Magnesium', atomicNumber: 12, mass: 24.305, color: '#2dd4bf', radius: 1.30, valenceOrbitals: ['3s'] },
  Al: { symbol: 'Al', name: 'Aluminium', atomicNumber: 13, mass: 26.982, color: '#0ea5e9', radius: 1.18, valenceOrbitals: ['3s', '3p'] },
  Si: { symbol: 'Si', name: 'Silicon', atomicNumber: 14, mass: 28.085, color: '#3b82f6', radius: 1.11, valenceOrbitals: ['3s', '3p'] },
  P: { symbol: 'P', name: 'Phosphorus', atomicNumber: 15, mass: 30.974, color: '#f97316', radius: 1.06, valenceOrbitals: ['3s', '3p'] },
  S: { symbol: 'S', name: 'Sulfur', atomicNumber: 16, mass: 32.06, color: '#eab308', radius: 1.02, valenceOrbitals: ['3s', '3p'] },
  Cl: { symbol: 'Cl', name: 'Chlorine', atomicNumber: 17, mass: 35.45, color: '#10b981', radius: 0.99, valenceOrbitals: ['3s', '3p'] },
  K: { symbol: 'K', name: 'Potassium', atomicNumber: 19, mass: 39.098, color: '#c084fc', radius: 1.96, valenceOrbitals: ['4s'] },
  Ca: { symbol: 'Ca', name: 'Calcium', atomicNumber: 20, mass: 40.078, color: '#06b6d4', radius: 1.74, valenceOrbitals: ['4s'] },
  Ti: { symbol: 'Ti', name: 'Titanium', atomicNumber: 22, mass: 47.867, color: '#8b5cf6', radius: 1.36, valenceOrbitals: ['3d', '4s'] },
  V: { symbol: 'V', name: 'Vanadium', atomicNumber: 23, mass: 50.942, color: '#6366f1', radius: 1.25, valenceOrbitals: ['3d', '4s'] },
  Cr: { symbol: 'Cr', name: 'Chromium', atomicNumber: 24, mass: 51.996, color: '#38bdf8', radius: 1.27, valenceOrbitals: ['3d', '4s'] },
  Mn: { symbol: 'Mn', name: 'Manganese', atomicNumber: 25, mass: 54.938, color: '#ec4899', radius: 1.39, valenceOrbitals: ['3d', '4s'] },
  Fe: { symbol: 'Fe', name: 'Iron', atomicNumber: 26, mass: 55.845, color: '#f59e0b', radius: 1.25, valenceOrbitals: ['3d', '4s'] },
  Co: { symbol: 'Co', name: 'Cobalt', atomicNumber: 27, mass: 58.933, color: '#0284c7', radius: 1.26, valenceOrbitals: ['3d', '4s'] },
  Ni: { symbol: 'Ni', name: 'Nickel', atomicNumber: 28, mass: 58.693, color: '#14b8a6', radius: 1.21, valenceOrbitals: ['3d', '4s'] },
  Cu: { symbol: 'Cu', name: 'Copper', atomicNumber: 29, mass: 63.546, color: '#f97316', radius: 1.38, valenceOrbitals: ['3d', '4s'] },
  Zn: { symbol: 'Zn', name: 'Zinc', atomicNumber: 30, mass: 65.38, color: '#94a3b8', radius: 1.31, valenceOrbitals: ['3d', '4s'] },
  Ga: { symbol: 'Ga', name: 'Gallium', atomicNumber: 31, mass: 69.723, color: '#6366f1', radius: 1.26, valenceOrbitals: ['4s', '4p'] },
  Ge: { symbol: 'Ge', name: 'Germanium', atomicNumber: 32, mass: 72.63, color: '#3b82f6', radius: 1.22, valenceOrbitals: ['4s', '4p'] },
  As: { symbol: 'As', name: 'Arsenic', atomicNumber: 33, mass: 74.922, color: '#a855f7', radius: 1.20, valenceOrbitals: ['4s', '4p'] },
  Br: { symbol: 'Br', name: 'Bromine', atomicNumber: 35, mass: 79.904, color: '#b91c1c', radius: 1.14, valenceOrbitals: ['4s', '4p'] },
  Ba: { symbol: 'Ba', name: 'Barium', atomicNumber: 56, mass: 137.33, color: '#06b6d4', radius: 2.15, valenceOrbitals: ['6s'] },
  Au: { symbol: 'Au', name: 'Gold', atomicNumber: 79, mass: 196.97, color: '#fbbf24', radius: 1.44, valenceOrbitals: ['5d', '6s'] }
};

export interface ParsedElement {
  symbol: string;
  count: number;
  data: ElementData;
}

export interface ParsedFormula {
  raw: string;
  normalized: string;
  name: string;
  elements: ParsedElement[];
  totalAtoms: number;
  molecularWeight: number;
  crystalClass: string;
  spaceGroup: string;
  isOxide: boolean;
  isHalide: boolean;
  isMetal: boolean;
  isSemiconductor: boolean;
  isInsulator: boolean;
  properties: {
    bandGap: number;
    formationEnergy: number;
    density: number;
    latticeA: number;
    bulkModulus: number;
    thermalConductivity: number;
    electricalConductivity: string;
    dielectricConstant: number;
  };
}

export function parseChemicalFormula(formula: string): ParsedFormula {
  const clean = formula.trim() || 'H2O';
  const regex = /([A-Z][a-z]*)(\d*)/g;
  let match;
  const elementsMap: Record<string, number> = {};

  while ((match = regex.exec(clean)) !== null) {
    if (match[1]) {
      const el = match[1];
      const count = match[2] ? parseInt(match[2], 10) : 1;
      elementsMap[el] = (elementsMap[el] || 0) + count;
    }
  }

  if (Object.keys(elementsMap).length === 0) {
    elementsMap['H'] = 2;
    elementsMap['O'] = 1;
  }

  const elements: ParsedElement[] = Object.entries(elementsMap).map(([sym, count]) => {
    const data = PERIODIC_TABLE[sym] || {
      symbol: sym,
      name: sym,
      atomicNumber: 20,
      mass: 40.0,
      color: '#38bdf8',
      radius: 1.0,
      valenceOrbitals: ['s', 'p']
    };
    return { symbol: sym, count, data };
  });

  const totalAtoms = elements.reduce((acc, el) => acc + el.count, 0);
  const molecularWeight = elements.reduce((acc, el) => acc + el.count * el.data.mass, 0);

  const upper = clean.toUpperCase();
  const hasO = 'O' in elementsMap;
  const hasH = 'H' in elementsMap;
  const hasSi = 'Si' in elementsMap;
  const hasTi = 'Ti' in elementsMap;
  const hasFe = 'Fe' in elementsMap;
  const hasCl = 'Cl' in elementsMap;
  const hasNa = 'Na' in elementsMap;
  const hasGa = 'Ga' in elementsMap;
  const hasAs = 'As' in elementsMap;

  let name = clean;
  let bandGap = 2.5;
  let formationEnergy = -4.5;
  let density = 3.5;
  let latticeA = 4.8;
  let bulkModulus = 85;
  let thermalCond = 12;
  let elecCond = '1.0 × 10⁻⁴';
  let dielectricConst = 8.5;
  let crystalClass = 'Orthorhombic';
  let spaceGroup = 'P6_3/mmc';

  if (upper === 'H2O' || (hasH && hasO && elements.length === 2)) {
    name = 'Water (Ice Ih / Liquid)';
    bandGap = 8.7;
    formationEnergy = -2.96;
    density = 0.92;
    latticeA = 4.52;
    bulkModulus = 9.2;
    thermalCond = 2.2;
    elecCond = '5.5 × 10⁻⁶';
    dielectricConst = 80.1;
    crystalClass = 'Hexagonal';
    spaceGroup = 'P6_3/mmc';
  } else if (upper === 'SIO4' || upper === 'SIO2' || (hasSi && hasO)) {
    name = 'Silicate (SiO4 / Silica)';
    bandGap = 8.9;
    formationEnergy = -8.12;
    density = 2.65;
    latticeA = 5.32;
    bulkModulus = 97;
    thermalCond = 1.6;
    elecCond = '1.2 × 10⁶';
    dielectricConst = 3.9;
    crystalClass = 'Cubic';
    spaceGroup = 'Fm-3m';
  } else if (upper === 'NACL' || (hasNa && hasCl)) {
    name = 'Sodium Chloride (Halite)';
    bandGap = 8.5;
    formationEnergy = -4.11;
    density = 2.16;
    latticeA = 5.64;
    bulkModulus = 24;
    thermalCond = 6.5;
    elecCond = '1.0 × 10⁻¹²';
    dielectricConst = 5.9;
    crystalClass = 'Cubic';
    spaceGroup = 'Fm-3m';
  } else if (upper === 'FE2O3' || (hasFe && hasO)) {
    name = 'Iron(III) Oxide (Hematite)';
    bandGap = 2.1;
    formationEnergy = -8.54;
    density = 5.24;
    latticeA = 5.03;
    bulkModulus = 205;
    thermalCond = 11.0;
    elecCond = '1.0 × 10⁻⁶';
    dielectricConst = 25.0;
    crystalClass = 'Trigonal';
    spaceGroup = 'R-3c';
  } else if (upper === 'GAAS' || (hasGa && hasAs)) {
    name = 'Gallium Arsenide';
    bandGap = 1.42;
    formationEnergy = -0.88;
    density = 5.32;
    latticeA = 5.65;
    bulkModulus = 75;
    thermalCond = 55.0;
    elecCond = '1.0 × 10⁻³';
    dielectricConst = 12.9;
    crystalClass = 'Cubic (Zincblende)';
    spaceGroup = 'F-43m';
  } else if (upper === 'TIO2' || (hasTi && hasO)) {
    name = 'Titanium Dioxide (Rutile)';
    bandGap = 3.05;
    formationEnergy = -9.82;
    density = 4.23;
    latticeA = 4.59;
    bulkModulus = 210;
    thermalCond = 8.5;
    elecCond = '1.0 × 10⁻⁸';
    dielectricConst = 86.0;
    crystalClass = 'Tetragonal';
    spaceGroup = 'P4_2/mnm';
  } else if (upper === 'LIFEPO4') {
    name = 'Lithium Iron Phosphate';
    bandGap = 3.7;
    formationEnergy = -12.4;
    density = 3.6;
    latticeA = 10.33;
    bulkModulus = 115;
    thermalCond = 3.2;
    elecCond = '1.0 × 10⁻⁸';
    dielectricConst = 14.2;
    crystalClass = 'Orthorhombic';
    spaceGroup = 'Pnma';
  } else if (upper === 'BATIO3') {
    name = 'Barium Titanate';
    bandGap = 3.2;
    formationEnergy = -15.8;
    density = 6.02;
    latticeA = 4.01;
    bulkModulus = 162;
    thermalCond = 2.6;
    elecCond = '1.0 × 10⁻¹¹';
    dielectricConst = 1200.0;
    crystalClass = 'Tetragonal';
    spaceGroup = 'P4mm';
  } else if (upper === 'GRAPHENE' || upper === 'C') {
    name = 'Carbon (Graphene / Diamond)';
    bandGap = 0.0;
    formationEnergy = 0.0;
    density = 2.26;
    latticeA = 2.46;
    bulkModulus = 442;
    thermalCond = 3000;
    elecCond = '1.0 × 10⁸';
    dielectricConst = 2.5;
    crystalClass = 'Hexagonal';
    spaceGroup = 'P6/mmm';
  } else if (upper === 'GAN') {
    name = 'Gallium Nitride';
    bandGap = 3.4;
    formationEnergy = -1.14;
    density = 6.15;
    latticeA = 3.19;
    bulkModulus = 190;
    thermalCond = 130;
    elecCond = '1.0 × 10⁻³';
    dielectricConst = 9.5;
    crystalClass = 'Hexagonal (Wurtzite)';
    spaceGroup = 'P6_3mc';
  } else if (elements.length === 1 && !['O', 'F', 'Cl', 'N', 'H'].includes(elements[0].symbol)) {
    const el = elements[0].data;
    name = `${el.name} Pure Elemental`;
    bandGap = 0.0;
    formationEnergy = 0.0;
    density = el.mass > 50 ? 8.9 : 4.5;
    latticeA = 3.6;
    bulkModulus = 140;
    thermalCond = 100;
    elecCond = '5.9 × 10⁷';
    dielectricConst = 1.0;
    crystalClass = 'Cubic (FCC)';
    spaceGroup = 'Fm-3m';
  } else {
    name = `${clean} Compound`;
    bandGap = hasO ? 3.5 : 1.2;
    formationEnergy = -(elements.length * 2.5);
    density = Math.max(1.5, Math.min(12, molecularWeight / (totalAtoms * 18)));
    latticeA = 5.2;
    bulkModulus = 90;
    thermalCond = 5.0;
    elecCond = bandGap === 0 ? '1.0 × 10⁶' : '1.0 × 10⁻⁵';
    dielectricConst = 12.0;
    crystalClass = 'Monoclinic';
    spaceGroup = 'P2_1/c';
  }

  const isMetal = bandGap === 0.0;
  const isSemiconductor = bandGap > 0.0 && bandGap <= 2.5;
  const isInsulator = bandGap > 2.5;

  return {
    raw: formula,
    normalized: clean,
    name,
    elements,
    totalAtoms,
    molecularWeight,
    crystalClass,
    spaceGroup,
    isOxide: hasO,
    isHalide: hasCl || clean.includes('F') || clean.includes('Br'),
    isMetal,
    isSemiconductor,
    isInsulator,
    properties: {
      bandGap,
      formationEnergy,
      density,
      latticeA,
      bulkModulus,
      thermalConductivity: thermalCond,
      electricalConductivity: elecCond,
      dielectricConstant: dielectricConst
    }
  };
}

// Generate 3D atomic coordinates specifically adapted to the chemical compound
export interface AtomSite3D {
  element: string;
  coords: [number, number, number];
  color: string;
  radius: number;
  name: string;
}

export function generate3DGeometry(parsed: ParsedFormula): {
  sites: AtomSite3D[];
  bonds: [number, number][];
  unitCellBox?: number[][][];
} {
  const upper = parsed.normalized.toUpperCase();
  const sites: AtomSite3D[] = [];
  const bonds: [number, number][] = [];

  // Special case: H2O (Water molecule bent geometry with hydrogen-bonded ice network)
  if (upper === 'H2O' || (parsed.elements.some(e => e.symbol === 'H') && parsed.elements.some(e => e.symbol === 'O') && parsed.elements.length === 2)) {
    const oColor = '#ef4444'; // Red
    const hColor = '#f8fafc'; // White/Silver

    // Center H2O molecule
    sites.push({ element: 'O', coords: [0, 0, 0], color: oColor, radius: 0.75, name: 'Oxygen' });
    const angleRad = (104.5 * Math.PI) / 360;
    const r = 1.8;
    sites.push({ element: 'H', coords: [r * Math.sin(angleRad), r * Math.cos(angleRad), 0], color: hColor, radius: 0.45, name: 'Hydrogen' });
    sites.push({ element: 'H', coords: [-r * Math.sin(angleRad), r * Math.cos(angleRad), 0], color: hColor, radius: 0.45, name: 'Hydrogen' });
    bonds.push([0, 1]);
    bonds.push([0, 2]);

    // Adjacent water molecules in ice lattice
    // Mol 2
    sites.push({ element: 'O', coords: [0, -3.0, 1.6], color: oColor, radius: 0.7, name: 'Oxygen' });
    sites.push({ element: 'H', coords: [1.1, -3.8, 1.6], color: hColor, radius: 0.42, name: 'Hydrogen' });
    sites.push({ element: 'H', coords: [-1.1, -3.8, 1.6], color: hColor, radius: 0.42, name: 'Hydrogen' });
    bonds.push([3, 4]);
    bonds.push([3, 5]);

    // Mol 3
    sites.push({ element: 'O', coords: [3.0, 1.4, -1.4], color: oColor, radius: 0.7, name: 'Oxygen' });
    sites.push({ element: 'H', coords: [4.0, 0.4, -1.4], color: hColor, radius: 0.42, name: 'Hydrogen' });
    sites.push({ element: 'H', coords: [3.0, 2.5, -1.4], color: hColor, radius: 0.42, name: 'Hydrogen' });
    bonds.push([6, 7]);
    bonds.push([6, 8]);

    // Mol 4
    sites.push({ element: 'O', coords: [-3.0, 1.4, -1.4], color: oColor, radius: 0.7, name: 'Oxygen' });
    sites.push({ element: 'H', coords: [-4.0, 0.4, -1.4], color: hColor, radius: 0.42, name: 'Hydrogen' });
    sites.push({ element: 'H', coords: [-3.0, 2.5, -1.4], color: hColor, radius: 0.42, name: 'Hydrogen' });
    bonds.push([9, 10]);
    bonds.push([9, 11]);

    // Hydrogen bonds
    bonds.push([0, 3]);
    bonds.push([1, 6]);
    bonds.push([2, 9]);

    return { sites, bonds };
  }

  // Special case: NaCl (Rock salt lattice)
  if (upper === 'NACL') {
    const naCol = '#818cf8'; // Purple Na+
    const clCol = '#10b981'; // Green Cl-
    const s = 2.4;

    for (let x of [-s, 0, s]) {
      for (let y of [-s, 0, s]) {
        for (let z of [-s, 0, s]) {
          const isNa = (Math.round((x + y + z) / s) % 2) === 0;
          const idx = sites.length;
          sites.push({
            element: isNa ? 'Na' : 'Cl',
            coords: [x, y, z],
            color: isNa ? naCol : clCol,
            radius: isNa ? 0.6 : 0.8,
            name: isNa ? 'Sodium' : 'Chlorine'
          });

          if (x < s) bonds.push([idx, idx + 1]);
        }
      }
    }
    return { sites, bonds: bonds.slice(0, 18) };
  }

  // Special case: TiO2 (Rutile tetragonal structure)
  if (upper === 'TIO2') {
    const tiCol = '#8b5cf6'; // Violet Titanium
    const oCol = '#ef4444'; // Red Oxygen

    // Central Ti
    sites.push({ element: 'Ti', coords: [0, 0, 0], color: tiCol, radius: 0.8, name: 'Titanium' });

    // 6 coordinated Oxygen atoms (Octahedron)
    const oCoords: [number, number, number][] = [
      [2.0, 0, 0],
      [-2.0, 0, 0],
      [0, 2.0, 0],
      [0, -2.0, 0],
      [0, 0, 2.4],
      [0, 0, -2.4]
    ];
    oCoords.forEach(pos => {
      sites.push({ element: 'O', coords: pos, color: oCol, radius: 0.6, name: 'Oxygen' });
      bonds.push([0, sites.length - 1]);
    });

    // Corner Ti atoms
    const corners: [number, number, number][] = [
      [3.0, 3.0, 3.0],
      [-3.0, -3.0, 3.0],
      [-3.0, 3.0, -3.0],
      [3.0, -3.0, -3.0]
    ];
    corners.forEach(pos => {
      sites.push({ element: 'Ti', coords: pos, color: tiCol, radius: 0.75, name: 'Titanium' });
    });

    return { sites, bonds };
  }

  // Special case: GaAs (Zincblende)
  if (upper === 'GAAS') {
    const gaCol = '#6366f1'; // Indigo Ga
    const asCol = '#a855f7'; // Purple As

    sites.push({ element: 'Ga', coords: [0, 0, 0], color: gaCol, radius: 0.8, name: 'Gallium' });
    const asPos: [number, number, number][] = [
      [1.8, 1.8, 1.8],
      [-1.8, -1.8, 1.8],
      [-1.8, 1.8, -1.8],
      [1.8, -1.8, -1.8]
    ];
    asPos.forEach(pos => {
      sites.push({ element: 'As', coords: pos, color: asCol, radius: 0.75, name: 'Arsenic' });
      bonds.push([0, sites.length - 1]);
    });

    return { sites, bonds };
  }

  // General compound generation:
  const primaryEl = parsed.elements[0];
  const secondaryEl = parsed.elements.length > 1 ? parsed.elements[1] : parsed.elements[0];
  const col1 = primaryEl.data.color;
  const col2 = secondaryEl.data.color;

  sites.push({
    element: primaryEl.symbol,
    coords: [0, 0, 0],
    color: col1,
    radius: primaryEl.data.radius * 0.8,
    name: primaryEl.data.name
  });

  const coordsList: [number, number, number][] = [
    [2.2, 2.2, 2.2],
    [-2.2, -2.2, 2.2],
    [-2.2, 2.2, -2.2],
    [2.2, -2.2, -2.2],
    [3.0, 0, 0],
    [-3.0, 0, 0],
    [0, 3.0, 0],
    [0, -3.0, 0]
  ];

  coordsList.forEach((pos, i) => {
    const el = (i % 2 === 0) ? secondaryEl : primaryEl;
    const col = (i % 2 === 0) ? col2 : col1;
    sites.push({
      element: el.symbol,
      coords: pos,
      color: col,
      radius: el.data.radius * 0.7,
      name: el.data.name
    });
    bonds.push([0, i + 1]);
  });

  return { sites, bonds };
}
