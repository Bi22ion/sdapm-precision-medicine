'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import { useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import type { Group, Mesh } from 'three'
import { Activity, ArrowDown, ArrowUp, Box, Check, ChevronDown, CircleDot, Eye, FileUp, Gauge, Layers3, Maximize2, Pause, Play, RotateCcw, ScanLine, Settings2, ShieldCheck, Upload, Workflow, ZoomIn, ZoomOut } from 'lucide-react'

const modelOptions = [
  { label: 'Upper limb', path: '/models/upper-limb/upper-limb.glb' },
  { label: 'Hand', path: '/models/hand/hand.glb' },
  { label: 'Lower limb', path: '/models/lower-limb/lower-limb.glb' },
  { label: 'Skeleton', path: '/models/overview-skeleton/overview-skeleton.glb' },
  { label: 'Vertebrae', path: '/models/vertebrae/vertebrae.glb' },
  { label: 'Skull base', path: '/models/colored-skull-base/colored-skull-base.glb' },
  { label: 'Exploded skull', path: '/models/exploded-skull/exploded-skull.glb' },
  { label: 'Colored skull', path: '/models/overview-colored-skull/overview-colored-skull.glb' },
]

function AnatomyScene({ opacity, isolate, modelPath, rotating, zoom, verticalOffset, onSelect }: { opacity: number; isolate: boolean; modelPath: string; rotating: boolean; zoom: number; verticalOffset: number; onSelect: (name: string) => void }) {
  const { scene } = useGLTF(modelPath)
  const model = scene.clone(true) as Group
  model.traverse((object) => {
    const mesh = object as Mesh
    if (!mesh.isMesh || !mesh.material) return
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    materials.forEach((material) => {
      material.transparent = opacity < 1
      material.opacity = opacity
      material.depthWrite = opacity > 0.7
    })
  })
  return <>
    <ambientLight intensity={1.8} />
    <directionalLight position={[4, 5, 4]} intensity={3} color="#d8fbff" />
    <pointLight position={[-3, 1, 2]} intensity={2.2} color="#42d4e6" />
    <primitive object={model} scale={(isolate ? 1.18 : 1) * zoom} position-y={verticalOffset} onClick={(event: { stopPropagation: () => void; object: { name?: string } }) => { event.stopPropagation(); onSelect(event.object.name || 'Selected structure') }} />
  </>
}

modelOptions.forEach(({ path }) => useGLTF.preload(path))
const nav = [{ label: 'Case overview', icon: CircleDot }, { label: 'Imaging pipeline', icon: ScanLine }, { label: 'Anatomy models', icon: Box }, { label: 'Surgical simulation', icon: Workflow }]
const stages = ['DICOM normalization', 'Organ segmentation', 'Mesh optimization']

export default function Page() {
  const [activeNav, setActiveNav] = useState('Case overview')
  const [opacity, setOpacity] = useState(78)
  const [depth, setDepth] = useState(42)
  const [rotating, setRotating] = useState(true)
  const [isolated, setIsolated] = useState(false)
  const [simulated, setSimulated] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [modelPath, setModelPath] = useState(modelOptions[0].path)
  const [selectedStructure, setSelectedStructure] = useState('No structure selected')
  const [zoom, setZoom] = useState(1)
  const [verticalOffset, setVerticalOffset] = useState(0)
  const [uploadedFile, setUploadedFile] = useState('No scan selected')
  const [notice, setNotice] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  const notify = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 2600) }
  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (file) { setUploadedFile(file.name); notify(`${file.name} queued for processing`) } }
  const reprocess = () => { setProcessing(true); setSimulated(false); window.setTimeout(() => { setProcessing(false); notify('Imaging pipeline completed successfully') }, 1800) }
  const runSimulation = () => { setSimulated(false); window.setTimeout(() => setSimulated(true), 450) }
  const changeModel = (path: string) => { setModelPath(path); setSelectedStructure('No structure selected'); setZoom(1); setVerticalOffset(0) }

  return <div className="clinical-shell min-h-screen">
    <header className="topbar"><div className="brand"><div className="brand-mark">S</div><div><div className="brand-name">SDAPM</div><div className="eyebrow">Precision medicine OS</div></div></div><button className="case-selector" onClick={() => notify('Case selector is locked to the active review')}><span className="eyebrow">Active case</span><strong>ONC-24018</strong><ChevronDown /></button><div className="top-status"><span className="status-dot" /> Systems nominal <span className="user-chip">DR</span></div></header>
    <div className="app-frame">
      <aside className="control-deck"><div className="deck-heading">Workspace</div><nav className="nav-list" aria-label="Workspace navigation">{nav.map(({ label, icon: Icon }) => <button key={label} onClick={() => { setActiveNav(label); notify(`${label} workspace selected`) }} className={`nav-item ${activeNav === label ? 'active' : ''}`}><Icon /> <span>{label}</span>{activeNav === label && <span className="nav-pip" />}</button>)}</nav><div className="deck-section"><div className="section-label">Case overview</div><div className="case-card"><div className="patient-row"><div className="patient-avatar">JM</div><div><strong>J. Morgan</strong><small>58 yrs · Male</small></div><ShieldCheck className="verified" /></div><div className="case-meta"><span>Indication</span><b>Renal mass</b><span>Study date</span><b>18 Sep 2024</b></div></div></div><div className="deck-section"><div className="section-label flex-between"><span>Upload imaging</span><span className="file-type">DICOM · NIfTI</span></div><div className="dropzone" onClick={() => fileInput.current?.click()} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') fileInput.current?.click() }}><Upload /><strong>Drop scan files here</strong><small>{uploadedFile}</small><input ref={fileInput} type="file" accept=".dcm,.nii,.nii.gz,application/octet-stream" onChange={handleUpload} hidden /><button className="browse-btn" onClick={(event) => { event.stopPropagation(); fileInput.current?.click() }}><FileUp /> Browse files</button></div></div><div className="compute-card"><div className="flex-between"><span>Compute pool</span><b>82%</b></div><div className="progress-track"><div className="progress-fill" style={{ width: '82%' }} /></div><small className="mono">GPU-A100 / 04 online</small></div></aside>
      <main className="workspace"><div className="workspace-head"><div><div className="eyebrow accent">CASE / ONC-24018 / ACTIVE REVIEW</div><h1>Patient-specific anatomy workspace</h1><p>Review reconstructed structures and test surgical approach hypotheses.</p></div><button className="secondary-btn" onClick={() => notify('Workspace settings are ready for configuration')}><Settings2 /> Workspace settings</button></div>
        <div className="metric-grid"><Metric label="Processing status" value={processing ? 'Processing' : 'Ready'} tone={processing ? 'amber' : 'green'} detail={uploadedFile === 'No scan selected' ? 'Last run 04:18 ago' : `Queued · ${uploadedFile}`} /><Metric label="Structures reconstructed" value="12" detail="3 target regions" /><Metric label="Model confidence" value="96.8%" detail="Validated segmentation" /><Metric label="Simulation margin" value="4.2 mm" detail="Within safety threshold" /></div>
        <div className="content-grid"><section className="viewport-card"><div className="card-header"><div><h2>3D anatomy model</h2><p>Reconstruction / organ segmentation / v2.4</p></div><div className="view-badges"><span className="live-badge"><span className="status-dot" /> Live model</span><button className="icon-btn" aria-label="Fullscreen" onClick={() => document.documentElement.requestFullscreen?.()}><Maximize2 /></button></div></div><div className="model-tabs" role="tablist" aria-label="Anatomy model selection">{modelOptions.map((model) => <button key={model.path} className={model.path === modelPath ? 'model-tab active' : 'model-tab'} onClick={() => changeModel(model.path)} role="tab" aria-selected={model.path === modelPath}>{model.label}</button>)}</div><div className="viewport"><Canvas dpr={[1, 2]} camera={{ position: [2.9, 1.5, 4.4], fov: 32 }}><AnatomyScene opacity={opacity / 100} isolate={isolated} modelPath={modelPath} rotating={rotating} zoom={zoom} verticalOffset={verticalOffset} onSelect={setSelectedStructure} /><OrbitControls autoRotate={rotating} autoRotateSpeed={0.65} enableDamping /></Canvas><div className="viewport-label">ANTERIOR <span>/</span> AXIAL REFERENCE</div><div className="selection-pill">Selected: <strong>{selectedStructure}</strong></div><div className="viewport-legend"><span><i className="legend-cyan" /> Segmented anatomy</span><span><i className="legend-rose" /> Lesion region</span></div><div className="floating-tools"><button onClick={() => setRotating((value) => !value)} title={rotating ? 'Pause automatic rotation' : 'Resume automatic rotation'} aria-label={rotating ? 'Pause automatic rotation' : 'Resume automatic rotation'} aria-pressed={rotating}>{rotating ? <Pause /> : <RotateCcw />}</button><button onClick={() => notify('Use drag to pan the model')} title="Pan"><Layers3 /></button><button onClick={() => setZoom((value) => Math.min(1.8, +(value + 0.15).toFixed(2)))} title="Zoom in"><ZoomIn /></button><button onClick={() => setZoom((value) => Math.max(0.6, +(value - 0.15).toFixed(2)))} title="Zoom out"><ZoomOut /></button><span className="tool-divider" aria-hidden="true" /><button onClick={() => setVerticalOffset((value) => Math.min(1.2, +(value + 0.15).toFixed(2)))} title="Move model up" aria-label="Move model up"><ArrowUp /></button><button onClick={() => setVerticalOffset((value) => Math.max(-1.2, +(value - 0.15).toFixed(2)))} title="Move model down" aria-label="Move model down"><ArrowDown /></button><button onClick={() => setVerticalOffset(0)} title="Center model" aria-label="Center model"><CircleDot /></button><button onClick={() => setIsolated(!isolated)} title="Isolate target"><Eye /></button></div></div><div className="viewport-footer"><span className="mono">MESH · 842K FACES · 0.42 MM VOXEL</span><button onClick={() => setIsolated(!isolated)}>{isolated ? 'Show all structures' : 'Isolate target'} →</button></div></section>
          <div className="right-rail"><Panel title="Processing pipeline" subtitle={uploadedFile === 'No scan selected' ? 'CT_Abdomen_01.nii.gz' : uploadedFile} badge="READY"><div className="stage-list">{stages.map((stage, i) => <div className="stage" key={stage}><span className="check"><Check /></span><div><strong>{stage}</strong><small>Completed · {['00:42', '02:51', '00:45'][i]}</small></div></div>)}</div><button onClick={reprocess} className="outline-btn">{processing ? 'Processing scan…' : 'Reprocess scan'}</button></Panel><Panel title="Surgical simulation" subtitle="Live parameters"><div className="control-group"><label>Cutting plane depth <b>{depth} mm</b></label><input value={depth} onChange={(e) => { setDepth(+e.target.value); setSimulated(false) }} type="range" min="10" max="80" /></div><div className="control-group"><label>Tissue opacity <b>{opacity}%</b></label><input value={opacity} onChange={(e) => setOpacity(+e.target.value)} type="range" min="20" max="100" /></div><button onClick={runSimulation} className="primary-btn"><Play /> Run cut simulation</button>{simulated && <div className="result-callout"><Check /><span><strong>Safe plane identified</strong><small>Estimated resection: {(8 + depth * 0.105).toFixed(1)} cm³</small></span></div>}</Panel></div></div>
        <div className="bottom-note"><Activity /> <span><strong>Clinical review mode</strong> · All outputs are decision-support only and require clinician validation.</span><Gauge /><span>Session autosaved</span></div>
      </main>
    </div>{notice && <div className="toast" role="status">{notice}</div>}
  </div>
}

function Metric({ label, value, detail, tone }: { label: string; value: string; detail: string; tone?: string }) { return <div className="metric-card"><span>{label}</span><strong className={tone}>{value}</strong><small>{detail}</small></div> }
function Panel({ title, subtitle, badge, children }: { title: string; subtitle: string; badge?: string; children: ReactNode }) { return <section className="panel"><div className="card-header"><div><h2>{title}</h2><p>{subtitle}</p></div>{badge && <span className="ready-badge">{badge}</span>}</div>{children}</section> }
