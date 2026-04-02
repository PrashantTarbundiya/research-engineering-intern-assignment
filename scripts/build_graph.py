import json
import networkx as nx
from community import community_louvain
import itertools
from collections import defaultdict

def build_bipartite_graph(input_file, output_file):
    print("Building Author-Subreddit bipartite structure...")
    
    author_subs = defaultdict(set)
    
    with open(input_file, 'r', encoding='utf-8') as fin:
        for line in fin:
            if not line.strip(): continue
            record = json.loads(line)
            
            author = record.get("author", "unknown")
            sub = record.get("subreddit", "unknown")
            
            if author == "unknown" or sub == "unknown" or author == "[deleted]" or sub is None:
                continue
                
            author_subs[author].add(sub)
            
    print(f"Tracking {len(author_subs)} unique authors.")
    
    print("Projecting to Subreddit-Subreddit network...")
    # Create undirected graph of Subreddits
    G = nx.Graph()
    
    # Add edges between subreddits if the same author posts in both
    for author, subs in author_subs.items():
        if len(subs) > 1:
            for sub1, sub2 in itertools.combinations(subs, 2):
                if G.has_edge(sub1, sub2):
                    G[sub1][sub2]['weight'] += 1
                else:
                    G.add_edge(sub1, sub2, weight=1)
                    
    print(f"Graph created: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")
    
    # Simplify graph to only keep strong connections to reduce noise
    EDGE_THRESHOLD = 2
    edges_to_remove = [(u, v) for u, v, w in G.edges(data='weight') if w < EDGE_THRESHOLD]
    G.remove_edges_from(edges_to_remove)
    
    # Remove isolated nodes (subreddits with no connections left)
    isolated = list(nx.isolates(G))
    G.remove_nodes_from(isolated)
    
    print(f"Simplified Graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")

    if G.number_of_nodes() == 0:
        print("Warning: Graph is empty after filtering! Falling back to adding disconnected nodes so the UI doesn't break.")
        G.add_node("EmptyGraphNodeFallback", size=1, community=0)

    # Analytics
    print("Running PageRank...")
    pagerank = nx.pagerank(G, weight='weight')
    nx.set_node_attributes(G, pagerank, 'pagerank')
    
    print("Running Louvain Community Detection...")
    # Louvain returns dict of node -> community_id
    if G.number_of_nodes() > 0:
        partition = community_louvain.best_partition(G, weight='weight')
        nx.set_node_attributes(G, partition, 'community')
    
    # Export for Cytoscape.js
    print(f"Exporting to {output_file}...")
    
    nodes_json = []
    edges_json = []
    
    for node, data in G.nodes(data=True):
        # Scale pagerank for visualization
        pr_val = data.get('pagerank', 1.0)
        size = max(10, pr_val * 5000) 
        
        nodes_json.append({
            "data": {
                "id": node, 
                "label": node, 
                "community": data.get('community', 0),
                "pagerank": pr_val,
                "size": size
            }
        })
        
    for source, target, data in G.edges(data=True):
        edges_json.append({
            "data": {
                "source": source,
                "target": target,
                "weight": data.get('weight', 1)
            }
        })
        
    output_data = {
        "nodes": nodes_json,
        "edges": edges_json
    }
    
    with open(output_file, 'w', encoding='utf-8') as fout:
        json.dump(output_data, fout, indent=2)
        
    print("Graph generation complete!")

if __name__ == "__main__":
    import os
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    input_path = os.path.join(base_dir, "data", "cleaned_data.jsonl")
    output_path = os.path.join(base_dir, "data", "graph_metrics.json")
    build_bipartite_graph(input_path, output_path)
