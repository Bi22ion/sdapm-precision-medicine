'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useRef, useState, type ReactNode } from 'react'
import type { Mesh } from 'three'
import { Activity, Box, Check, ChevronDown, CircleDot, Eye, FileUp, Gauge, Layers3, Maximize2, Pause, Play, RotateCcw, ScanLine, Settings2, ShieldCheck, Upload, Workflow, ZoomIn, ZoomOut } from 'lucide-react'

function AnatomyScene({ opacity, isolate }: { opacity: number; isolate: boolean }) {
  const target = useRef<Mesh>(null)
  useFrame((_, delta) => { if (target.current) target.current.rotation.y += delta * 0.18 })
  return <>
    <ambientLight intensity={1.8} /><directionalLight position={[4, 5, 4]} intensity={3} color="#d8fbff" /><pointLight position={[-3, 1, 2]} intensity={2.2} color="#42d4e6" />
    <group rotation={[0.05, -0.18, 0]}>
      {!isolate && <mesh scale={[0.82, 1.48, 0.52]}><capsuleGeometry args={[0.68, 1.25, 16, 32]} /><meshPhysicalMaterial color="#4caebe" transparent opacity={opacity} roughness={0.3} transmission={0.2} /></mesh>}
      {!isolate && <mesh position={[-0.18, 0, -0.24]}><cylinderGeometry args={[0.11, 0.15, 2.8, 20]} /><meshPhysicalMaterial color="#d8f7f8" transparent opacity={0.7} /></mesh>}
      <mesh ref={target} position={[0.24, 0.34, 0.42]} scale={[1.3, 0.84, 0.8]}><sphereGeometry args={[0.42, 32, 24]} /><meshPhysicalMaterial color="#f29caf" emissive="#421923" emissiveIntensity={0.35} roughness={0.27} /></mesh>
      {[-0.7, -0.38, -0.06, 0.26, 0.58, 0.9].map((y) => <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.58, 1]}><torusGeometry args={[0.5, 0.022, 8, 32, Math.PI]} /><meshBasicMaterial color="#9be9ef" transparent opacity={0.5} /></mesh>)}
    </group>
  </>
}

const nav = [{ label: 'Case overview', icon: CircleDot }, { label: 'Imaging pipeline', icon: ScanLine }, { label: 'Anatomy models', icon: Box }, { label: 'Surgical simulation', icon: Workflow }]
const stages = ['DICOM normalization', 'Organ segmentation', 'Mesh optimization']

export default function Page() {
  const [opacity, setOpacity] = useState(78), [depth, setDepth] = useState(42), [rotating, setRotating] = useState(true), [isolated, setIsolated] = useState(false), [simulated, setSimulated] = useState(false), [processing, setProcessing] = useState(false)
  return <div className="clinical-shell min-h-screen">
    <header className="topbar"><div className="brand"><div className="brand-mark">S</div><div><div className="brand-name">SDAPM</div><div className="eyebrow">Precision medicine OS</div></div></div><div className="case-selector"><span className="eyebrow">Active case</span><strong>ONC-24018</strong><ChevronDown /></div><div className="top-status"><span className="status-dot" /> Systems nominal <span className="user-chip">DR</span></div></header>
    <div className="app-frame">
      <aside className="control-deck"><div className="deck-heading">Workspace</div><nav className="nav-list">{nav.map(({ label, icon: Icon }, index) => <button key={label} className={`nav-item ${index === 0 ? 'active' : ''}`}><Icon /> <span>{label}</span>{index === 0 && <span className="nav-pip" />}</button>)}</nav><div className="deck-section"><div className="section-label">Case overview</div><div className="case-card"><div className="patient-row"><div className="patient-avatar">JM</div><div><strong>J. Morgan</strong><small>58 yrs · Male</small></div><ShieldCheck className="verified" /></div><div className="case-meta"><span>Indication</span><b>Renal mass</b><span>Study date</span><b>18 Sep 2024</b></div></div></div><div className="deck-section"><div className="section-label flex-between"><span>Upload imaging</span><span className="file-type">DICOM · NIfTI</span></div><div className="dropzone"><Upload /><strong>Drop scan files here</strong><small>or browse from your device</small><button className="browse-btn"><FileUp /> Browse files</button></div></div><div className="compute-card"><div className="flex-between"><span>Compute pool</span><b>82%</b></div><div className="progress-track"><div className="progress-fill" style={{ width: '82%' }} /></div><small className="mono">GPU-A100 / 04 online</small></div></aside>
      <main className="workspace"><div className="workspace-head"><div><div className="eyebrow accent">CASE / ONC-24018 / ACTIVE REVIEW</div><h1>Patient-specific anatomy workspace</h1><p>Review reconstructed structures and test surgical approach hypotheses.</p></div><button className="secondary-btn"><Settings2 /> Workspace settings</button></div>
        <div className="metric-grid"><Metric label="Processing status" value={processing ? 'Processing' : 'Ready'} tone={processing ? 'amber' : 'green'} detail="Last run 04:18 ago" /><Metric label="Structures reconstructed" value="12" detail="3 target regions" /><Metric label="Model confidence" value="96.8%" detail="Validated segmentation" /><Metric label="Simulation margin" value="4.2 mm" detail="Within safety threshold" /></div>
        <div className="content-grid"><section className="viewport-card"><div className="card-header"><div><h2>3D anatomy model</h2><p>Reconstruction / organ segmentation / v2.4</p></div><div className="view-badges"><span className="live-badge"><span className="status-dot" /> Live model</span><button className="icon-btn" aria-label="Fullscreen"><Maximize2 /></button></div></div><div className="viewport"><Canvas dpr={[1, 2]} camera={{ position: [2.9, 1.5, 4.4], fov: 32 }}><AnatomyScene opacity={opacity / 100} isolate={isolated} /><OrbitControls autoRotate={rotating} autoRotateSpeed={0.65} enableDamping /></Canvas><div className="viewport-label">ANTERIOR <span>/</span> AXIAL REFERENCE</div><div className="viewport-legend"><span><i className="legend-cyan" /> Segmented anatomy</span><span><i className="legend-rose" /> Lesion region</span></div><div className="floating-tools"><button onClick={() => setRotating(!rotating)} title="Rotate">{rotating ? <Pause /> : <RotateCcw />}</button><button title="Pan"><Layers3 /></button><button title="Zoom in"><ZoomIn /></button><button title="Zoom out"><ZoomOut /></button><button onClick={() => setIsolated(!isolated)} title="Isolate target"><Eye /></button></div></div><div className="viewport-footer"><span className="mono">MESH · 842K FACES · 0.42 MM VOXEL</span><button onClick={() => setIsolated(!isolated)}>{isolated ? 'Show all structures' : 'Isolate target'} →</button></div></section>
          <div className="right-rail"><Panel title="Processing pipeline" subtitle="CT_Abdomen_01.nii.gz" badge="READY"><div className="stage-list">{stages.map((stage, i) => <div className="stage" key={stage}><span className="check"><Check /></span><div><strong>{stage}</strong><small>Completed · {['00:42', '02:51', '00:45'][i]}</small></div></div>)}</div><button onClick={() => { setProcessing(true); setTimeout(() => setProcessing(false), 1800) }} className="outline-btn">{processing ? 'Processing scan…' : 'Reprocess scan'}</button></Panel><Panel title="Surgical simulation" subtitle="Live parameters"><div className="control-group"><label>Cutting plane depth <b>{depth} mm</b></label><input value={depth} onChange={(e) => setDepth(+e.target.value)} type="range" min="10" max="80" /></div><div className="control-group"><label>Tissue opacity <b>{opacity}%</b></label><input value={opacity} onChange={(e) => setOpacity(+e.target.value)} type="range" min="20" max="100" /></div><button onClick={() => setSimulated(true)} className="primary-btn"><Play /> Run cut simulation</button>{simulated && <div className="result-callout"><Check /><span><strong>Safe plane identified</strong><small>Estimated resection: 12.4 cm³</small></span></div>}</Panel></div></div>
        <div className="bottom-note"><Activity /> <span><strong>Clinical review mode</strong> · All outputs are decision-support only and require clinician validation.</span><Gauge /><span>Session autosaved</span></div>
      </main>
    </div>
  </div>
}

function Metric({ label, value, detail, tone }: { label: string; value: string; detail: string; tone?: string }) { return <div className="metric-card"><span>{label}</span><strong className={tone}>{value}</strong><small>{detail}</small></div> }
function Panel({ title, subtitle, badge, children }: { title: string; subtitle: string; badge?: string; children: ReactNode }) { return <section className="panel"><div className="card-header"><div><h2>{title}</h2><p>{subtitle}</p></div>{badge && <span className="ready-badge">{badge}</span>}</div>{children}</section> }
