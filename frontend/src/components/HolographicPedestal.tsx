import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  RotateCcw,
  Play,
  Pause,
  Box,
  Maximize2,
  Star
} from 'lucide-react';
import { MaterialDetail, CrystalStructure3D } from '../types/material';
import { parseChemicalFormula, generate3DGeometry, ParsedFormula, PERIODIC_TABLE } from '../services/formulaParser';

interface HolographicPedestalProps {
  material: MaterialDetail | null;
  structure: CrystalStructure3D | null;
  formula: string;
  onOpenFullscreen?: () => void;
  isSaved?: boolean;
  onToggleSave?: () => void;
}

export const HolographicPedestal: React.FC<HolographicPedestalProps> = ({
  material,
  structure,
  formula,
  onOpenFullscreen,
  isSaved = false,
  onToggleSave
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [isAnimating, setIsAnimating] = useState(true);
  const [activeView, setActiveView] = useState<'3d' | 'poly'>('3d');

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const crystalGroupRef = useRef<THREE.Group | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Mouse interaction
  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });

  // Parse formula dynamically
  const parsed: ParsedFormula = parseChemicalFormula(formula);
  const fallbackGeom = generate3DGeometry(parsed);

  const name = material?.composition || parsed.name;
  const badges = [
    parsed.isOxide ? 'Oxide' : parsed.isHalide ? 'Halide' : parsed.crystalClass,
    parsed.isMetal ? 'Metal' : parsed.isSemiconductor ? 'Semiconductor' : 'Insulator',
    parsed.properties.formationEnergy < 0 ? 'Stable' : 'Metastable'
  ];

  const description =
    parsed.normalized.toUpperCase() === 'H2O'
      ? 'H2O (water) is a polar inorganic compound with a bent molecular geometry and a dynamic 3D hydrogen-bonding network. It exhibits an unusually wide electronic band gap (~8.7 eV) in ice Ih and critical biochemical/industrial relevance.'
      : parsed.normalized.toUpperCase() === 'SIO4' || parsed.normalized.toUpperCase() === 'SIO2'
      ? 'SiO4 is a fundamental silicate unit in many inorganic materials. It has important applications in ceramics, glasses, and semiconductor materials.'
      : `${parsed.name} (${parsed.normalized}) crystallizes in the ${parsed.crystalClass} system (${parsed.spaceGroup}). It features a predicted band gap of ${parsed.properties.bandGap.toFixed(2)} eV and formation energy of ${parsed.properties.formationEnergy.toFixed(2)} eV/atom.`;

  useEffect(() => {
    if (!mountRef.current) return;
    const width = mountRef.current.clientWidth || 380;
    const height = mountRef.current.clientHeight || 300;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 3.5, 18);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const blueLight = new THREE.PointLight(0x00f2fe, 3, 50);
    blueLight.position.set(0, -5, 5);
    scene.add(blueLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(10, 15, 10);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1);
    rimLight.position.set(-10, -5, -10);
    scene.add(rimLight);

    // 5. Crystal Mesh Group
    const crystalGroup = new THREE.Group();
    scene.add(crystalGroup);
    crystalGroupRef.current = crystalGroup;

    // Prioritize real crystallographic structure sites from backend
    if (structure && structure.sites && structure.sites.length > 0) {
      let cx = 0, cy = 0, cz = 0;
      structure.sites.forEach(s => {
        cx += s.coords[0];
        cy += s.coords[1];
        cz += s.coords[2];
      });
      cx /= structure.sites.length;
      cy /= structure.sites.length;
      cz /= structure.sites.length;

      structure.sites.forEach((site) => {
        const col = site.color || PERIODIC_TABLE[site.element]?.color || '#38bdf8';
        const baseRadius = site.radius || 0.6;
        const geo = new THREE.SphereGeometry(baseRadius * 1.3, 32, 32);
        const mat = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(col),
          roughness: 0.15,
          metalness: 0.25,
          clearcoat: 0.8,
          clearcoatRoughness: 0.1,
          emissive: new THREE.Color(col),
          emissiveIntensity: 0.25
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(site.coords[0] - cx, site.coords[1] - cy, site.coords[2] - cz);
        crystalGroup.add(mesh);
      });

      // Bonds
      if (structure.bonds && structure.bonds.length > 0) {
        structure.bonds.forEach((b) => {
          const s1 = structure.sites[b.site1_idx];
          const s2 = structure.sites[b.site2_idx];
          if (!s1 || !s2) return;

          const p1 = new THREE.Vector3(s1.coords[0] - cx, s1.coords[1] - cy, s1.coords[2] - cz);
          const p2 = new THREE.Vector3(s2.coords[0] - cx, s2.coords[1] - cy, s2.coords[2] - cz);
          const dist = p1.distanceTo(p2);
          if (dist > 8.0) return;

          const cylGeo = new THREE.CylinderGeometry(0.12, 0.12, dist, 14);
          const cylMat = new THREE.MeshStandardMaterial({
            color: 0x93c5fd,
            metalness: 0.5,
            roughness: 0.3,
            emissive: 0x0284c7,
            emissiveIntensity: 0.3
          });
          const cyl = new THREE.Mesh(cylGeo, cylMat);
          cyl.position.copy(p1).add(p2).multiplyScalar(0.5);
          cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p2.clone().sub(p1).normalize());
          crystalGroup.add(cyl);
        });
      }

      // Dynamic Camera position
      let maxDist = 4;
      structure.sites.forEach(s => {
        const d = Math.hypot(s.coords[0] - cx, s.coords[1] - cy, s.coords[2] - cz);
        if (d > maxDist) maxDist = d;
      });
      camera.position.set(0, 3, Math.max(14, maxDist * 3.2));
      camera.lookAt(0, 0, 0);

    } else {
      // Fallback compound geometry
      const geom = fallbackGeom;
      geom.sites.forEach((atom) => {
        const col = atom.color;
        const geo = new THREE.SphereGeometry(atom.radius * 1.15, 32, 32);
        const mat = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(col),
          roughness: 0.15,
          metalness: 0.3,
          clearcoat: 0.8,
          clearcoatRoughness: 0.1,
          emissive: new THREE.Color(col),
          emissiveIntensity: 0.25
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(atom.coords[0], atom.coords[1], atom.coords[2]);
        crystalGroup.add(mesh);
      });

      geom.bonds.forEach(([i1, i2]) => {
        const a1 = geom.sites[i1];
        const a2 = geom.sites[i2];
        if (!a1 || !a2) return;

        const p1 = new THREE.Vector3(...a1.coords);
        const p2 = new THREE.Vector3(...a2.coords);
        const dist = p1.distanceTo(p2);
        const cylGeo = new THREE.CylinderGeometry(0.12, 0.12, dist, 16);
        const cylMat = new THREE.MeshStandardMaterial({
          color: 0x93c5fd,
          metalness: 0.5,
          roughness: 0.3,
          emissive: 0x0284c7,
          emissiveIntensity: 0.3
        });
        const cyl = new THREE.Mesh(cylGeo, cylMat);
        cyl.position.copy(p1).add(p2).multiplyScalar(0.5);
        cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p2.clone().sub(p1).normalize());
        crystalGroup.add(cyl);
      });

      camera.position.set(0, 3.5, 16);
      camera.lookAt(0, 0, 0);
    }

    // 6. Animation loop
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      if (crystalGroupRef.current) {
        if (isRotating && !isDraggingRef.current) {
          crystalGroupRef.current.rotation.y += 0.01;
        }
        if (isAnimating) {
          crystalGroupRef.current.position.y = Math.sin(elapsedTime * 1.5) * 0.35;
          crystalGroupRef.current.rotation.x = Math.sin(elapsedTime * 0.8) * 0.06;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Mouse drag handlers
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !crystalGroupRef.current) return;
      const deltaX = e.clientX - prevMouseRef.current.x;
      const deltaY = e.clientY - prevMouseRef.current.y;
      crystalGroupRef.current.rotation.y += deltaX * 0.01;
      crystalGroupRef.current.rotation.x += deltaY * 0.01;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      dom.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      renderer.dispose();
    };
  }, [structure, isRotating, isAnimating, formula]);

  return (
    <div className="glass-panel-dark spotlight-card rounded-2xl p-6 relative overflow-hidden flex flex-col lg:flex-row items-center gap-6">
      {/* Left/Center: Holographic Pedestal & 3D Crystal */}
      <div className="relative w-full lg:w-5/12 h-[280px] flex items-center justify-center">
        {/* Hologram Rings at Bottom */}
        <div className="absolute bottom-2 w-56 h-20 pointer-events-none flex items-center justify-center">
          <div className="absolute w-52 h-16 rounded-full border border-cyan-400/50 shadow-[0_0_25px_rgba(6,182,212,0.6)] animate-pulse-rings" />
          <div className="absolute w-40 h-12 rounded-full border border-blue-500/60 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
          <div
            className="absolute bottom-6 w-36 h-48 pointer-events-none opacity-40"
            style={{
              background: 'radial-gradient(ellipse at bottom, rgba(6, 182, 212, 0.4) 0%, rgba(59, 130, 246, 0.1) 50%, transparent 80%)'
            }}
          />
        </div>

        {/* 3D Three.js Canvas Container */}
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing z-10" />
      </div>

      {/* Right: Info, Badges, Description, and Action Buttons */}
      <div className="w-full lg:w-7/12 flex flex-col justify-center space-y-4 z-10">
        {/* Title & Star Favorite */}
        <div className="flex items-center gap-3">
          <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            {name} <span className="text-slate-300">({formula})</span>
          </h2>
          <button
            onClick={onToggleSave}
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 transition hover:bg-slate-800/60"
            title={isSaved ? 'Remove from Saved' : 'Save Material'}
          >
            <Star
              className={`w-5 h-5 ${isSaved ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`}
            />
          </button>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {badges.map((badge, idx) => (
            <span
              key={idx}
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                badge === 'Stable'
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : badge === 'Insulator' || badge === 'Semiconductor'
                  ? 'bg-blue-950/60 text-cyan-300 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : 'bg-slate-800/80 text-slate-200 border-slate-700'
              }`}
            >
              {badge}
            </span>
          ))}
        </div>

        {/* Description */}
        <p className="text-slate-300 text-sm leading-relaxed max-w-xl">
          {description}
        </p>

        {/* Controls Bar */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => setActiveView('3d')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shadow-sm ${
              activeView === '3d'
                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
            }`}
          >
            <Box className="w-3.5 h-3.5 text-cyan-300" />
            3D View
          </button>

          <button
            onClick={() => setIsRotating(!isRotating)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition border ${
              isRotating
                ? 'bg-slate-800/80 text-cyan-300 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                : 'bg-slate-800/50 text-slate-400 border-slate-700'
            }`}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} />
            Rotate
          </button>

          <button
            onClick={() => setIsAnimating(!isAnimating)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition border ${
              isAnimating
                ? 'bg-slate-800/80 text-cyan-300 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                : 'bg-slate-800/50 text-slate-400 border-slate-700'
            }`}
          >
            {isAnimating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            Animate
          </button>

          {onOpenFullscreen && (
            <button
              onClick={onOpenFullscreen}
              className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 border border-slate-700 transition"
              title="Fullscreen View"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
