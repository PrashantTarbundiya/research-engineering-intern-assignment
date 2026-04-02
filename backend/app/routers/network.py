from fastapi import APIRouter
import json
import os

router = APIRouter()

@router.get("/network")
def get_network():
    # Returns the nodes/edges for Cytoscape.js format, precomputed
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    graph_path = os.path.join(base_dir, "data", "graph_metrics.json")
    
    try:
        with open(graph_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return {"elements": data}
    except FileNotFoundError:
        return {"elements": {"nodes": [], "edges": []}}
