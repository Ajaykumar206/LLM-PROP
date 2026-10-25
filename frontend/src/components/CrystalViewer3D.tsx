import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  RotateCcw,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Box,
  Eye,
  Info,
  Download
} from 'lucide-react';
import { CrystalStructure3D, AtomSite } from '../types/material';
import { getCifDownloadUrl } from '../services/api';

interface CrystalViewer3DProps {
  structure: CrystalStructure3D | null;
  materialId: string;
  formula: string;
  isLoading?: boolean;
}

export const CrystalViewer3D: React.FC<CrystalViewer3DProps> = ({
  structure,
  materialId,
  formula,
  isLoading
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedAtom, setSelectedAtom] = useState<AtomSite | null>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [showUnitCell, setShowUnitCell] = useState(true);
  const [showBonds, setShowBonds] = useState(true);

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const rootGroupRef = useRef<THREE.Group | null>(null);
  const unitCellGroupRef = useRef<THREE.Group | null>(null);
  const bondsGroupRef = useRef<THREE.Group | null>(null);
  const atomMeshesRef = useRef<{ mesh: THREE.Mesh; atom: AtomSite }[]>([]);
  const animFrameIdRef = useRef<number | null>(null);

  // Mouse interaction variables
  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 600;
    const height = containerRef.current.clientHeight || 450;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 30);
    cameraRef.current = camera;

    // 3. Renderer with antialiasing
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = false;
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight1.position.set(20, 30, 25);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xbae6fd, 0.35);
    dirLight2.position.set(-20, -15, -15);
    scene.add(dirLight2);

    // 5. Root group that will rotate
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);
    rootGroupRef.current = rootGroup;

    const unitCellGroup = new THREE.Group();
    rootGroup.add(unitCellGroup);
    unitCellGroupRef.current = unitCellGroup;

    const bondsGroup = new THREE.Group();
    rootGroup.add(bondsGroup);
    bondsGroupRef.current = bondsGroup;

    // 6. Animation loop
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      if (isRotating && rootGroupRef.current && !isDraggingRef.current) {
        rootGroupRef.current.rotation.y += 0.005;
        rootGroupRef.current.rotation.x += 0.001;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      renderer.dispose();
    };
  }, []);

  // Update structure geometry when structure changes
  useEffect(() => {
    if (!rootGroupRef.current || !sceneRef.current || !cameraRef.current) return;

    // Clean previous objects
    const root = rootGroupRef.current;
    while (root.children.length > 0) {
      root.remove(root.children[0]);
    }
    atomMeshesRef.current = [];
    setSelectedAtom(null);

    if (!structure || !structure.sites || structure.sites.length === 0) {
      return;
    }

    const unitCellGroup = new THREE.Group();
    root.add(unitCellGroup);
    unitCellGroupRef.current = unitCellGroup;

    const bondsGroup = new THREE.Group();
    root.add(bondsGroup);
    bondsGroupRef.current = bondsGroup;

    // 1. Calculate center of mass to center the structure in viewport
    let cx = 0, cy = 0, cz = 0;
    structure.sites.forEach(s => {
      cx += s.coords[0];
      cy += s.coords[1];
      cz += s.coords[2];
    });
    cx /= structure.sites.length;
    cy /= structure.sites.length;
    cz /= structure.sites.length;

    // 2. Add Atom Spheres
    const sphereGeo = new THREE.SphereGeometry(1, 32, 24);

    structure.sites.forEach((site) => {
      const col = site.color || '#94a3b8';
      const rad = site.radius || 0.55;
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(col),
        roughness: 0.25,
        metalness: 0.1,
      });

      const mesh = new THREE.Mesh(sphereGeo, mat);
      mesh.scale.set(rad, rad, rad);
      mesh.position.set(site.coords[0] - cx, site.coords[1] - cy, site.coords[2] - cz);

      root.add(mesh);
      atomMeshesRef.current.push({ mesh, atom: site });
    });

    // 3. Add Bonds
    if (structure.bonds && structure.bonds.length > 0) {
      const bondMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.4,
        metalness: 0.1
      });

      structure.bonds.forEach((b) => {
        const s1 = structure.sites[b.site1_idx];
        const s2 = structure.sites[b.site2_idx];
        if (!s1 || !s2) return;

        const p1 = new THREE.Vector3(s1.coords[0] - cx, s1.coords[1] - cy, s1.coords[2] - cz);
        const p2 = new THREE.Vector3(s2.coords[0] - cx, s2.coords[1] - cy, s2.coords[2] - cz);

        const dist = p1.distanceTo(p2);
        const bondGeo = new THREE.CylinderGeometry(0.08, 0.08, dist, 12);
        const cylinder = new THREE.Mesh(bondGeo, bondMat);

        const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
        cylinder.position.copy(mid);

        const orientation = new THREE.Matrix4();
        orientation.lookAt(p1, p2, new THREE.Vector3(0, 1, 0));
        orientation.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
        cylinder.quaternion.setFromRotationMatrix(orientation);

        bondsGroup.add(cylinder);
      });
    }

    // 4. Add Unit Cell Box Lines
    if (structure.unit_cell_box && structure.unit_cell_box.length > 0) {
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        linewidth: 1.5,
        transparent: true,
        opacity: 0.75
      });

      structure.unit_cell_box.forEach((segment) => {
        if (segment.length >= 2) {
          const pt1 = new THREE.Vector3(segment[0][0] - cx, segment[0][1] - cy, segment[0][2] - cz);
          const pt2 = new THREE.Vector3(segment[1][0] - cx, segment[1][1] - cy, segment[1][2] - cz);
          const geo = new THREE.BufferGeometry().setFromPoints([pt1, pt2]);
          const line = new THREE.Line(geo, lineMat);
          unitCellGroup.add(line);
        }
      });
    }

    // Adjust camera distance to encompass structure
    let maxDist = 8;
    structure.sites.forEach(s => {
      const d = Math.hypot(s.coords[0] - cx, s.coords[1] - cy, s.coords[2] - cz);
      if (d > maxDist) maxDist = d;
    });
    cameraRef.current.position.set(0, 0, maxDist * 2.8);
    cameraRef.current.lookAt(0, 0, 0);

  }, [structure]);

  // Handle unit cell visibility toggle
  useEffect(() => {
    if (unitCellGroupRef.current) {
      unitCellGroupRef.current.visible = showUnitCell;
    }
  }, [showUnitCell]);

  // Handle bonds visibility toggle
  useEffect(() => {
    if (bondsGroupRef.current) {
      bondsGroupRef.current.visible = showBonds;
    }
  }, [showBonds]);

  // Mouse drag & raycast interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    prevMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingRef.current && rootGroupRef.current) {
      const deltaX = e.clientX - prevMouseRef.current.x;
      const deltaY = e.clientY - prevMouseRef.current.y;

      rootGroupRef.current.rotation.y += deltaX * 0.008;
      rootGroupRef.current.rotation.x += deltaY * 0.008;

      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!containerRef.current || !cameraRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const meshes = atomMeshesRef.current.map(item => item.mesh);
    const intersects = raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const hit = atomMeshesRef.current.find(item => item.mesh === intersects[0].object);
      if (hit) {
        setSelectedAtom(hit.atom);
      }
    } else {
      setSelectedAtom(null);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!cameraRef.current) return;
    e.preventDefault();
    cameraRef.current.position.z += e.deltaY * 0.02;
    cameraRef.current.position.z = Math.max(5, Math.min(80, cameraRef.current.position.z));
  };

  const resetView = () => {
    if (rootGroupRef.current) {
      rootGroupRef.current.rotation.set(0, 0, 0);
    }
    if (cameraRef.current && structure) {
      cameraRef.current.position.set(0, 0, 30);
    }
    setSelectedAtom(null);
  };

  const zoomIn = () => {
    if (cameraRef.current) {
      cameraRef.current.position.z = Math.max(5, cameraRef.current.position.z - 4);
    }
  };

  const zoomOut = () => {
    if (cameraRef.current) {
      cameraRef.current.position.z = Math.min(80, cameraRef.current.position.z + 4);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-200/80 flex flex-col h-full shadow-sm relative">
      {/* Header with Title and Control Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-800">3D Interactive Crystal Explorer</h3>
            <span className="text-xs font-mono font-medium text-crystal-700 bg-crystal-50 px-2 py-0.5 rounded-md border border-crystal-200">
              {formula} ({materialId})
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real DFT atomic coordinates • Click an atom to inspect site coordinates
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsRotating(!isRotating)}
            className={`p-2 rounded-lg text-xs font-medium border transition ${
              isRotating
                ? 'bg-crystal-50 text-crystal-700 border-crystal-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title={isRotating ? 'Pause auto-rotation' : 'Play auto-rotation'}
          >
            {isRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setShowUnitCell(!showUnitCell)}
            className={`p-2 rounded-lg text-xs font-medium border transition ${
              showUnitCell
                ? 'bg-crystal-50 text-crystal-700 border-crystal-200'
                : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
            }`}
            title="Toggle unit-cell lattice boundaries"
          >
            <Box className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowBonds(!showBonds)}
            className={`p-2 rounded-lg text-xs font-medium border transition ${
              showBonds
                ? 'bg-crystal-50 text-crystal-700 border-crystal-200'
                : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
            }`}
            title="Toggle chemical bonds"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            onClick={zoomIn}
            className="p-2 rounded-lg bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 text-xs font-medium transition"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={zoomOut}
            className="p-2 rounded-lg bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 text-xs font-medium transition"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            onClick={resetView}
            className="p-2 rounded-lg bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 text-xs font-medium transition"
            title="Reset perspective"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <a
            href={getCifDownloadUrl(materialId)}
            download={`${materialId}.cif`}
            className="p-2 rounded-lg bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 text-xs font-medium transition flex items-center gap-1"
            title="Download CIF crystal file"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* 3D Canvas Container */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleCanvasClick}
        onWheel={handleWheel}
        className="crystal-canvas-container flex-1 cursor-grab active:cursor-grabbing border border-slate-200/60"
      >
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-crystal-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold text-slate-600">Loading crystal lattice...</span>
            </div>
          </div>
        )}

        {!structure && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-slate-400">
            <div>
              <Box className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium">3D Crystal Structure Not Available</p>
              <p className="text-xs text-slate-400 mt-1">Select a material with verified CIF data.</p>
            </div>
          </div>
        )}

        {/* Selected Atom Overlay Card */}
        {selectedAtom && (
          <div className="absolute top-4 left-4 glass-panel p-3 rounded-xl border border-crystal-200 shadow-md max-w-xs z-10 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full border border-slate-300 shadow-sm inline-block"
                  style={{ backgroundColor: selectedAtom.color }}
                />
                <span className="text-sm font-bold text-slate-800">
                  {selectedAtom.element} (Site #{selectedAtom.index})
                </span>
              </div>
              <button
                onClick={() => setSelectedAtom(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>
            <div className="text-[11px] font-mono text-slate-600 space-y-0.5">
              <div>x: {selectedAtom.coords[0].toFixed(3)} Å</div>
              <div>y: {selectedAtom.coords[1].toFixed(3)} Å</div>
              <div>z: {selectedAtom.coords[2].toFixed(3)} Å</div>
              <div className="text-[10px] text-slate-400 mt-1">Radius: {selectedAtom.radius.toFixed(2)} Å</div>
            </div>
          </div>
        )}

        {/* Element Legend Footer Overlay */}
        {structure?.elements && structure.elements.length > 0 && (
          <div className="absolute bottom-3 left-3 glass-panel px-3 py-1.5 rounded-lg border border-slate-200/80 flex items-center gap-3 z-10">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Elements:</span>
            <div className="flex items-center gap-2.5">
              {structure.elements.map((el) => {
                const sampleAtom = structure.sites.find(s => s.element === el);
                const col = sampleAtom?.color || '#94a3b8';
                return (
                  <div key={el} className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full border border-slate-300"
                      style={{ backgroundColor: col }}
                    />
                    <span className="text-xs font-bold text-slate-700">{el}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Interaction hints */}
        <div className="absolute bottom-3 right-3 text-[11px] text-slate-400 bg-white/80 px-2 py-1 rounded backdrop-blur-sm border border-slate-200/60 pointer-events-none">
          Left-click + drag to rotate • Scroll to zoom
        </div>
      </div>
    </div>
  );
};
