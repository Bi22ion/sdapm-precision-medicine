from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
import shutil
from pathlib import Path
import subprocess
import uuid
import nibabel as nib
import numpy as np
import trimesh
from skimage import measure

app = FastAPI(title="SDAPM Precision Medicine Platform", version="1.0")
PROJECT_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = PROJECT_DIR / "processing/inputs"
OUTPUT_DIR = PROJECT_DIR / "processing/outputs"
MESH_DIR = PROJECT_DIR / "frontend/public/models"
for directory in (UPLOAD_DIR, OUTPUT_DIR, MESH_DIR):
    directory.mkdir(parents=True, exist_ok=True)

jobs: dict[str, dict] = {}

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "sdapm-processing", "active_jobs": len(jobs)}

@app.get("/api/jobs/{job_id}")
async def get_job(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Processing job not found")
    return jobs[job_id]

@app.post("/api/process-and-reconstruct")
async def process_and_reconstruct(file: UploadFile = File(...)):
    allowed = (".nii", ".nii.gz", ".dcm", ".zip")
    if not file.filename or not file.filename.lower().endswith(allowed):
        raise HTTPException(status_code=415, detail="Upload a NIfTI or DICOM file")
    job_id = uuid.uuid4().hex[:12]
    safe_name = Path(file.filename).name
    file_path = UPLOAD_DIR / f"{job_id}_{safe_name}"
    jobs[job_id] = {"id": job_id, "filename": safe_name, "status": "processing", "models": [], "errors": []}
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    scan_output_dir = OUTPUT_DIR / job_id
    scan_output_dir.mkdir(parents=True, exist_ok=True)
    try:
        command = ["TotalSegmentator", "-i", str(file_path), "-o", str(scan_output_dir)]
        result = subprocess.run(command, capture_output=True, text=True, check=True, timeout=1800)
        jobs[job_id]["log"] = result.stdout[-2000:]
        for mask_file in scan_output_dir.glob("*.nii.gz"):
            img = nib.load(str(mask_file))
            data = img.get_fdata()
            if not np.any(data > 0):
                continue
            verts, faces, normals, _ = measure.marching_cubes(data, level=0.5)
            mesh = trimesh.Trimesh(vertices=verts, faces=faces, vertex_normals=normals, process=True)
            mesh.remove_degenerate_faces()
            mesh.remove_unreferenced_vertices()
            mesh_name = f"{job_id}_{mask_file.name.replace('.nii.gz', '')}.obj"
            mesh.export(str(MESH_DIR / mesh_name))
            jobs[job_id]["models"].append(mesh_name)
        jobs[job_id]["status"] = "completed"
    except FileNotFoundError:
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["errors"].append(
            "TotalSegmentator is not installed in the serverless runtime. "
            "Run segmentation in a dedicated worker and submit the result here."
        )
    except subprocess.TimeoutExpired:
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["errors"].append("Segmentation exceeded the 30 minute processing limit")
    except Exception as error:
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["errors"].append(str(error))
        raise HTTPException(status_code=500, detail=jobs[job_id])
    return jobs[job_id]

app.mount("/models", StaticFiles(directory=MESH_DIR), name="models")
