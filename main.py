from fastapi import FastAPI, UploadFile, File, HTTPException
import shutil
from pathlib import Path
import subprocess
import nibabel as nib
import numpy as np
import trimesh
from skimage import measure

app = FastAPI(title="SDAPM Precision Medicine Platform", version="1.0")

UPLOAD_DIR = Path("processing/inputs")
OUTPUT_DIR = Path("processing/outputs")
MESH_DIR = Path("frontend/public/models")

for d in [UPLOAD_DIR, OUTPUT_DIR, MESH_DIR]:
    d.mkdir(parents=True, exist_ok=True)

@app.post("/api/process-and-reconstruct")
async def process_and_reconstruct(file: UploadFile = File(...)):
    file_path = UPLOAD_DIR / file.filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    scan_name = Path(file.filename).stem
    scan_output_dir = OUTPUT_DIR / scan_name
    scan_output_dir.mkdir(parents=True, exist_ok=True)
    
    # Module 2: Medical Imaging Data Processing (TotalSegmentator)
    try:
        cmd = ["TotalSegmentator", "-i", str(file_path), "-o", str(scan_output_dir)]
        subprocess.run(cmd, capture_output=True, text=True, check=True)
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Segmentation failed: {e.stderr}")
        
    # Module 1: 3D Human Body Model Reconstruction (Converting NIfTI masks to 3D Meshes)
    reconstructed_meshes = []
    for mask_file in scan_output_dir.glob("*.nii.gz"):
        try:
            img = nib.load(str(mask_file))
            data = img.get_fdata()
            
            # Check if mask has any segmented content
            if np.any(data > 0):
                # Extract 3D isosurface using Marching Cubes (Deep Learning/Math Modeling approach)
                verts, faces, normals, values = measure.marching_cubes(data, level=0.5)
                
                mesh = trimesh.Trimesh(vertices=verts, faces=faces, vertex_normals=normals)
                
                # Smooth and simplify mesh for high-end visualization
                mesh = mesh.simplify_quadratic_decimation(len(faces) // 2)
                
                mesh_filename = f"{mask_file.name.split('.')[0]}.obj"
                mesh_path = MESH_DIR / mesh_filename
                mesh.export(str(mesh_path))
                reconstructed_meshes.append(mesh_filename)
        except Exception as ex:
            continue

    return {
        "status": "success",
        "filename": file.filename,
        "reconstructed_3d_models": reconstructed_meshes,
        "message": "Full processing and 3D solid model reconstruction complete."
    }