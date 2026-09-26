import numpy as np
import trimesh


class SurgicalSimulationEngine:
    """Geometric simulation helpers for instrument paths and virtual resections."""

    def __init__(self, mesh_path: str):
        self.mesh = trimesh.load(mesh_path, force="mesh")
        if not isinstance(self.mesh, trimesh.Trimesh):
            raise ValueError("The selected model does not contain a triangular mesh")

    def detect_collision(self, ray_origin, ray_direction, max_distance=None):
        origin = np.asarray(ray_origin, dtype=float).reshape(3)
        direction = np.asarray(ray_direction, dtype=float).reshape(3)
        norm = np.linalg.norm(direction)
        if norm == 0:
            raise ValueError("ray_direction must be non-zero")
        direction /= norm
        locations, _, index_tri = self.mesh.ray.intersects_location(
            ray_origins=np.array([origin]), ray_directions=np.array([direction])
        )
        if max_distance is not None:
            distances = np.linalg.norm(locations - origin, axis=1)
            keep = distances <= max_distance
            locations, index_tri = locations[keep], index_tri[keep]
        distances = np.linalg.norm(locations - origin, axis=1)
        order = np.argsort(distances)
        locations, distances, index_tri = locations[order], distances[order], index_tri[order]
        return {
            "collision_detected": bool(len(locations)),
            "intersection_points": locations.tolist(),
            "distances": distances.round(4).tolist(),
            "triangle_indices": index_tri.tolist(),
        }

    def simulate_virtual_cut(self, plane_normal, plane_origin):
        normal = np.asarray(plane_normal, dtype=float).reshape(3)
        origin = np.asarray(plane_origin, dtype=float).reshape(3)
        if np.linalg.norm(normal) == 0:
            raise ValueError("plane_normal must be non-zero")
        normal /= np.linalg.norm(normal)
        signed_distance = (self.mesh.vertices - origin) @ normal
        positive = int(np.count_nonzero(signed_distance >= 0))
        negative = int(np.count_nonzero(signed_distance < 0))
        section = trimesh.intersections.slice_mesh_plane(self.mesh, normal, origin)
        if section is None or len(section.vertices) == 0:
            return {"status": "failed", "message": "Plane did not intersect mesh."}
        return {
            "status": "success",
            "cut_vertices_count": len(section.vertices),
            "cut_faces_count": len(section.faces),
            "estimated_resection_volume": round(float(section.volume), 3),
            "vertices_on_positive_side": positive,
            "vertices_on_negative_side": negative,
        }
