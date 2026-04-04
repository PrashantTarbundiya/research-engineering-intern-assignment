import json
import networkx as nx
from community import community_louvain
import re
import itertools
from collections import defaultdict


def _extract_mentions(text):
    """Extract @mentions from text."""
    if not text:
        return []
    return re.findall(r'@(\w+)', text)


def _build_subreddit_projection(input_file):
    """Fallback: build subreddit-subreddit projection from author overlap."""
    author_subs = defaultdict(set)

    with open(input_file, 'r', encoding='utf-8') as fin:
        for line in fin:
            if not line.strip():
                continue
            record = json.loads(line)

            author = record.get("author", "unknown")
            sub = record.get("subreddit", "unknown")

            if author == "unknown" or sub == "unknown" or author == "[deleted]" or sub is None:
                continue

            author_subs[author].add(sub)

    G = nx.DiGraph()

    for author, subs in author_subs.items():
        if len(subs) > 1:
            for sub1, sub2 in itertools.combinations(subs, 2):
                if G.has_edge(sub1, sub2):
                    G[sub1][sub2]['weight'] += 1
                else:
                    G.add_edge(sub1, sub2, weight=1)

    return G


def build_author_graph(input_file, output_file):
    """Build a directed graph (nx.DiGraph) representing author mentions/retweets.

    - Pre-compute PageRank and Betweenness centrality using NetworkX.
    - Pre-compute Louvain communities (by converting graph to undirected).
    - Save the graph data to data/graph_metrics.json.
    """
    print("Building directed author mention/retweet graph...")

    G = nx.DiGraph()
    edge_weights = defaultdict(int)

    with open(input_file, 'r', encoding='utf-8') as fin:
        for line in fin:
            if not line.strip():
                continue
            record = json.loads(line)

            author = record.get("author", "unknown")
            text = record.get("text", "")

            if author == "unknown" or author == "[deleted]":
                continue

            # Ensure author node exists
            if author not in G:
                G.add_node(author)

            # Extract @mentions from text
            mentions = _extract_mentions(text)
            for mention in mentions:
                if mention == author or mention == "unknown":
                    continue
                if mention not in G:
                    G.add_node(mention)
                edge_weights[(author, mention)] += 1

    # Add weighted edges
    for (src, tgt), weight in edge_weights.items():
        G.add_edge(src, tgt, weight=weight)

    print(f"Graph created (DiGraph): {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")

    if G.number_of_edges() == 0:
        print("Warning: No mention edges found. Falling back to subreddit projection.")
        G = _build_subreddit_projection(input_file)

    # For Louvain, convert DiGraph to undirected
    G_undirected = G.to_undirected()

    # Simplify graph to only keep strong connections to reduce noise
    EDGE_THRESHOLD = 1
    edges_to_remove = [(u, v) for u, v, w in G_undirected.edges(data='weight') if w < EDGE_THRESHOLD]
    G_undirected.remove_edges_from(edges_to_remove)

    # Remove isolated nodes
    isolated = list(nx.isolates(G_undirected))
    G_undirected.remove_nodes_from(isolated)

    print(f"Simplified Graph (undirected): {G_undirected.number_of_nodes()} nodes, {G_undirected.number_of_edges()} edges")

    if G_undirected.number_of_nodes() == 0:
        print("Warning: Graph is empty after filtering! Adding fallback node.")
        G_undirected.add_node("EmptyGraphNodeFallback", weight=1)

    # Analytics - run on undirected graph
    print("Running PageRank...")
    pagerank = nx.pagerank(G_undirected, weight='weight')
    nx.set_node_attributes(G_undirected, pagerank, 'pagerank')

    print("Running Betweenness Centrality...")
    betweenness = nx.betweenness_centrality(G_undirected, weight='weight')
    nx.set_node_attributes(G_undirected, betweenness, 'betweenness')

    print("Running Louvain Community Detection...")
    partition = community_louvain.best_partition(G_undirected, weight='weight')
    nx.set_node_attributes(G_undirected, partition, 'community')

    # Export for Cytoscape.js
    print(f"Exporting to {output_file}...")

    nodes_json = []
    edges_json = []

    for node, data in G_undirected.nodes(data=True):
        pr_val = data.get('pagerank', 1.0 / max(G_undirected.number_of_nodes(), 1))
        betweenness_val = data.get('betweenness', 0.0)
        size = max(10, pr_val * 5000)

        nodes_json.append({
            "data": {
                "id": node,
                "label": node,
                "community": data.get('community', 0),
                "pagerank": pr_val,
                "betweenness": betweenness_val,
                "size": size
            }
        })

    for source, target, data in G_undirected.edges(data=True):
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
    build_author_graph(input_path, output_path)
