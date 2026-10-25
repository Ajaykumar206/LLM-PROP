import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Maximize2, Minimize2 } from 'lucide-react';
import { CrystalStructure3D } from '../types/material';
import { parseChemicalFormula, generate3DGeometry, PERIODIC_TABLE } from '../services/formulaParser';

interface CrystalStructureCardProps {
  structure: CrystalStructure3D | null;
  formula: string;
}

type RenderMode = 'ball-and-stick' | 'space-filling' | 'polyhedral';

export const CrystalStructureCard: React.FC<CrystalStructureCardProps> = ({
  structure,
  formula
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [renderMode, setRenderMode] = useState<RenderMode>('ball-and-stick');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });

  // Determine active elements for legend
  const parsed = parseChemicalFormula(formula);
  const fallbackGeom = generate3DGeometry(parsed);

  const legendElements: { symbol: string; name: string; color: string }[] = React.useMemo(() => {
    if (structure && structure.sites && structure.sites.length > 0) {
      const uniqueSymbols = Array.from(new Set(structure.sites.map(s => s.element)));
      return uniqueSymbols.map(sym => {
        const data = PERIODIC_TABLE[sym];
        const site = structure.sites.find(s => s.element === sym);
        return {
          symbol: sym,
          name: data?.name || sym,
          color: site?.color || data?.color || '#38bdf8'
        };
      });
    }
    return parsed.elements.map(e => ({
      symbol: e.symbol,
      name: e.data.name,
      color: e.data.color
    }));
  }, [structure, formula]);

  useEffect(() => {
    if (!mountRef.current) return;
    const width = mountRef.current.clientWidth || 320;
    const height = mountRef.current.clientHeight || 220;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 16);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight1.position.set(15, 25, 20);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight2.position.set(-15, -10, -15);
    scene.add(dirLight2);

    // 5. Main Model Group
    const group = new THREE.Group();
    scene.add(group);
    groupRef.current = group;

    const scaleFactor = renderMode === 'space-filling' ? 2.2 : 1.0;

    // Check if real crystallographic structure exists
    if (structure && structure.sites && structure.sites.length > 0) {
      // Real structure rendering
      let cx = 0, cy = 0, cz = 0;
      structure.sites.forEach(s => {
        cx += s.coords[0];
        cy += s.coords[1];
        cz += s.coords[2];
      });
      cx /= structure.sites.length;
      cy /= structure.sites.length;
      cz /= structure.sites.length;

      // Add Atom Spheres
      structure.sites.forEach((site) => {
        const col = site.color || PERIODIC_TABLE[site.element]?.color || '#38bdf8';
        const baseRadius = site.radius || 0.55;
        const geo = new THREE.SphereGeometry(baseRadius * scaleFactor, 32, 32);
        const mat = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(col),
          roughness: 0.2,
          metalness: 0.25,
          clearcoat: 0.7,
          emissive: new THREE.Color(col),
          emissiveIntensity: 0.15
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(site.coords[0] - cx, site.coords[1] - cy, site.coords[2] - cz);
        group.add(mesh);
      });

      // Add Bonds (in Ball & Stick and Polyhedral modes)
      if (renderMode !== 'space-filling' && structure.bonds && structure.bonds.length > 0) {
        const bondMat = new THREE.MeshStandardMaterial({
          color: 0x94a3b8,
          metalness: 0.4,
          roughness: 0.3
        });

        structure.bonds.forEach((b) => {
          const s1 = structure.sites[b.site1_idx];
          const s2 = structure.sites[b.site2_idx];
          if (!s1 || !s2) return;

          const p1 = new THREE.Vector3(s1.coords[0] - cx, s1.coords[1] - cy, s1.coords[2] - cz);
          const p2 = new THREE.Vector3(s2.coords[0] - cx, s2.coords[1] - cy, s2.coords[2] - cz);
          const dist = p1.distanceTo(p2);
          if (dist > 8.0) return; // Skip periodic boundary jumps

          const bondGeo = new THREE.CylinderGeometry(0.1, 0.1, dist, 12);
          const cyl = new THREE.Mesh(bondGeo, bondMat);
          cyl.position.copy(p1).add(p2).multiplyScalar(0.5);
          cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p2.clone().sub(p1).normalize());
          group.add(cyl);
        });
      }

      // Add Real Unit Cell Box Lines
      if (structure.unit_cell_box && structure.unit_cell_box.length > 0) {
        const lineMat = new THREE.LineBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.45,
          linewidth: 1.5
        });

        structure.unit_cell_box.forEach((segment) => {
          if (segment.length >= 2) {
            const pt1 = new THREE.Vector3(segment[0][0] - cx, segment[0][1] - cy, segment[0][2] - cz);
            const pt2 = new THREE.Vector3(segment[1][0] - cx, segment[1][1] - cy, segment[1][2] - cz);
            const lineGeo = new THREE.BufferGeometry().setFromPoints([pt1, pt2]);
            const line = new THREE.Line(lineGeo, lineMat);
            group.add(line);
          }
        });
      }

      // Dynamic Camera Framing
      let maxDist = 4;
      structure.sites.forEach(s => {
        const d = Math.hypot(s.coords[0] - cx, s.coords[1] - cy, s.coords[2] - cz);
        if (d > maxDist) maxDist = d;
      });
      camera.position.set(0, 0, Math.max(12, maxDist * 2.8));
      camera.lookAt(0, 0, 0);

    } else {
      // Fallback custom molecular/crystal geometry generator
      const geom = fallbackGeom;
      geom.sites.forEach((atom) => {
        const col = atom.color;
        const geo = new THREE.SphereGeometry(atom.radius * scaleFactor, 32, 32);
        const mat = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(col),
          roughness: 0.2,
          metalness: 0.25,
          clearcoat: 0.7,
          emissive: new THREE.Color(col),
          emissiveIntensity: 0.2
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(atom.coords[0], atom.coords[1], atom.coords[2]);
        group.add(mesh);
      });

      if (renderMode !== 'space-filling') {
        geom.bonds.forEach(([i1, i2]) => {
          const a1 = geom.sites[i1];
          const a2 = geom.sites[i2];
          if (!a1 || !a2) return;

          const p1 = new THREE.Vector3(...a1.coords);
          const p2 = new THREE.Vector3(...a2.coords);
          const dist = p1.distanceTo(p2);
          const cylGeo = new THREE.CylinderGeometry(0.12, 0.12, dist, 14);
          const cylMat = new THREE.MeshStandardMaterial({
            color: 0x94a3b8,
            metalness: 0.5,
            roughness: 0.3
          });
          const cyl = new THREE.Mesh(cylGeo, cylMat);
          cyl.position.copy(p1).add(p2).multiplyScalar(0.5);
          cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p2.clone().sub(p1).normalize());
          group.add(cyl);
        });
      }

      // Unit cell box wireframe
      const boxSize = 7.0;
      const boxGeo = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
      const boxWire = new THREE.WireframeGeometry(boxGeo);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.35
      });
      const boxLine = new THREE.LineSegments(boxWire, lineMat);
      group.add(boxLine);

      camera.position.set(0, 0, 15);
      camera.lookAt(0, 0, 0);
    }

    // Polyhedral envelope in polyhedral mode
    if (renderMode === 'polyhedral') {
      const polyGeo = new THREE.TetrahedronGeometry(4.2, 0);
      const polyMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.3,
        transmission: 0.8,
        roughness: 0.2
      });
      const poly = new THREE.Mesh(polyGeo, polyMat);
      group.add(poly);
    }

    // Animation loop
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      if (groupRef.current && !isDraggingRef.current) {
        groupRef.current.rotation.y += 0.008;
      }
      renderer.render(scene, camera);
    };
    animate();

    // Mouse handlers for dragging/orbiting
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !groupRef.current) return;
      const dx = e.clientX - prevMouseRef.current.x;
      const dy = e.clientY - prevMouseRef.current.y;
      groupRef.current.rotation.y += dx * 0.01;
      groupRef.current.rotation.x += dy * 0.01;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.dispose();
    };
  }, [structure, renderMode, isFullscreen, formula]);

  return (
    <div
      className={`glass-panel-dark spotlight-card rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 ${
        isFullscreen ? 'fixed inset-4 z-50 p-6' : 'h-[320px]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between z-10 mb-2">
        <h4 className="text-xs font-bold text-slate-200 tracking-wide flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
          Crystal Structure (3D View): <strong className="text-cyan-300">{formula}</strong>
        </h4>
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 3D Viewport with Dynamic Legend Overlay */}
      <div className="relative flex-1 w-full min-h-[160px] flex items-center justify-center">
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Dynamic Legend based on actual active structure elements */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5 bg-slate-900/85 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-800/80 text-[11px] max-h-28 overflow-y-auto z-20">
          {legendElements.map(el => (
            <div key={el.symbol} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full shadow-sm"
                style={{
                  backgroundColor: el.color,
                  boxShadow: `0 0 6px ${el.color}`
                }}
              />
              <span className="text-slate-200 font-medium">
                {el.symbol} ({el.name})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Mode Switches */}
      <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-800/60 z-10">
        <button
          onClick={() => setRenderMode('ball-and-stick')}
          className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition ${
            renderMode === 'ball-and-stick'
              ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.6)]'
              : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
          }`}
        >
          Ball & Stick
        </button>
        <button
          onClick={() => setRenderMode('space-filling')}
          className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition ${
            renderMode === 'space-filling'
              ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.6)]'
              : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
          }`}
        >
          Space-filling
        </button>
        <button
          onClick={() => setRenderMode('polyhedral')}
          className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition ${
            renderMode === 'polyhedral'
              ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.6)]'
              : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
          }`}
        >
          Polyhedral
        </button>
      </div>
    </div>
  );
};
