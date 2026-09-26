import trimesh
import numpy as np

class SurgicalSimulationEngine:
    def __init__(self, mesh_path: str):
        # Load the 3D reconstructed anatomical organ mesh
        self.mesh = trimesh.load(mesh_path)

    def detect_collision(self, ray_origin, ray_direction):
        """
        Simulates surgical instrument trajectory intersection with the anatomical model.
        Returns intersection points and hit status.
        """
        locations, index_ray, index_tri = self.mesh.ray.intersects_location(
            ray_origins=np.array([ray_origin]),
            ray_directions=np.array([ray_direction])
        )
        return {
            "collision_detected": len(locations) > 0,
            "intersection_points": locations.tolist()
        }

    def simulate_virtual_cut(self, plane_normal, plane_origin):
        """
        Simulates surgical cutting or cross-sectioning of the 3D organ model
        along a specified cutting plane.
        """
        slice_section = trimesh.intersections.slice_mesh_plane(
            self.mesh,
            plane_normal=plane_normal,
            plane_origin=plane_origin
        )
        if slice_section is not None:
            return {
                "status": "success",
                "cut_vertices_count": len(slice_section.vertices)
            }
        return {"status": "failed", "message": "Plane did not intersect mesh."}