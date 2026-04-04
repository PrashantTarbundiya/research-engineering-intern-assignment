import { useState, useEffect, useRef } from 'react'

const tocItems = [
  { id: 'getting-started', label: 'Getting Started', group: '' },
  { id: 'quick-start', label: 'Quick Start', group: '' },
  { id: 'core-features', label: 'Core Features', group: 'Dashboard' },
  { id: 'semantic-search', label: 'Semantic Search', group: 'Dashboard' },
  { id: 'network', label: 'Network Graph', group: 'Dashboard' },
  { id: 'time-series', label: 'Time-Series Chart', group: 'Dashboard' },
  { id: 'topic-clusters', label: 'Topic Scatter', group: 'Dashboard' },
  { id: 'analytics-page', label: 'Analytics Page', group: 'Other Pages' },
  { id: 'map-editor', label: 'Map Editor', group: 'Other Pages' },
  { id: 'chat-assistant', label: 'Narrative AI Chat', group: 'Other Pages' },
  { id: 'api', label: 'API Reference', group: 'Developers' },
  { id: 'api-search', label: 'POST /api/search', group: 'API Endpoints' },
  { id: 'api-timeseries', label: 'POST /api/timeseries', group: 'API Endpoints' },
  { id: 'api-network', label: 'GET /api/network', group: 'API Endpoints' },
  { id: 'api-chat', label: 'POST /api/chat', group: 'API Endpoints' },
  { id: 'api-topics', label: 'GET /api/topics', group: 'API Endpoints' },
  { id: 'ml-stack', label: 'ML / AI Stack', group: 'Technical' },
  { id: 'edge-cases', label: 'Edge Cases', group: 'Technical' },
  { id: 'contributing', label: 'Contributing', group: '' },
]

function CodeBlock({ code, lang }) {
  return (
    <div className="relative group my-4">
      <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-950 border border-white/5 border-b-0 rounded-t-lg">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">{lang || 'bash'}</span>
      </div>
      <pre className="px-4 py-3 bg-zinc-950 border border-white/5 rounded-b-lg overflow-x-auto">
        <code className="text-xs font-mono text-zinc-300 leading-relaxed whitespace-pre">{code}</code>
      </pre>
    </div>
  )
}

function InlineCode({ text }) {
  return <code className="px-1.5 py-0.5 bg-zinc-800/80 border border-white/5 rounded text-[11px] font-mono text-violet-300">{text}</code>
}

function Badge({ text, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  }
  return (
    <span className={`text-[10px] border px-2 py-0.5 rounded font-medium ${colors[color]}`}>{text}</span>
  )
}

function MethodBadge({ method }) {
  const colors = {
    GET: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    POST: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  }
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${colors[method]}`}>{method}</span>
  )
}

/* ─── Sections ─── */
function GettingStarted() {
  return (
    <section id="getting-started" className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Getting Started</h1>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Narra-tionScope is an investigative social media analytics platform designed to trace digital narratives across platforms.
          Built for <span className="text-zinc-200 font-medium">SimPPL</span>, it enables researchers to discover how ideas form, spread, and decay across social media ecosystems.
        </p>
      </div>

      <div className="rounded-xl border border-white/5 bg-zinc-900/40 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white">What this platform does</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            ['Semantic Search', 'Find posts by meaning, not just keywords. Vector embeddings capture the actual intent behind a query.'],
            ['Network Analysis', 'Visualize who talks to whom. PageRank scores surface the most influential accounts in any conversation.'],
            ['Time-Series Tracking', 'Plot the velocity of any narrative over time. An AI summary explains the trend in plain language.'],
            ['RAG Chat Assistant', 'Ask questions about the data. The assistant retrieves relevant posts and answers with source citations.'],
            ['Topic Clustering', 'Discover hidden themes via BERTopic. Tunable K-Means lets you explore at any granularity.'],
            ['Cross-Platform', 'Data from Reddit, Twitter/X, and more — all searchable and analyzable from one dashboard.'],
          ].map(([title, desc]) => (
            <div key={title} className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
              <p className="text-xs font-semibold text-zinc-200 mb-1">{title}</p>
              <p className="text-[11px] text-zinc-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-zinc-900/40 p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Tech Stack</h3>
        <div className="flex flex-wrap gap-2">
          <Badge text="FastAPI" color="green" />
          <Badge text="React 18" color="blue" />
          <Badge text="Vite" color="amber" />
          <Badge text="ChromaDB" color="purple" />
          <Badge text="Cytoscape.js" />
          <Badge text="BERTopic" color="green" />
          <Badge text="NetworkX" color="amber" />
          <Badge text="Groq / Llama 4" color="rose" />
          <Badge text="Sentence-Transformers" />
          <Badge text="UMAP" color="blue" />
          <Badge text="Recharts" color="purple" />
        </div>
      </div>
    </section>
  )
}

function QuickStart() {
  return (
    <section id="quick-start" className="space-y-6 mt-12">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Quick Start</h2>
        <p className="text-sm text-zinc-500 mt-1">Get the platform running in under 5 minutes.</p>
      </div>

      <h3 className="text-sm font-semibold text-zinc-200">1. Backend</h3>
      <CodeBlock lang="bash" code={`cd backend
python -m venv venv
source venv/Scripts/activate   # On Windows
pip install -r requirements.txt

# Set your Groq API key
export GROQ_API_KEY="your_key_here"

# Start the API server
uvicorn app.main:app --reload --port 8000`} />

      <h3 className="text-sm font-semibold text-zinc-200">2. Frontend</h3>
      <CodeBlock lang="bash" code={`cd frontend
npm install
npm run dev

# Open http://localhost:5173`} />

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex gap-3">
        <span className="text-amber-400 text-lg leading-none mt-0.5">⚡</span>
        <div>
          <p className="text-xs font-semibold text-amber-300 mb-1">Environment Variables</p>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            The dashboard requires <InlineCode text="GROQ_API_KEY" /> for AI-powered summaries and the chat assistant.
            Without it, the dashboard still works — search, network, and clustering all function without AI.
          </p>
        </div>
      </div>
    </section>
  )
}

function CoreFeatures() {
  return (
    <section id="core-features" className="space-y-6 mt-12">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Core Features</h2>
        <p className="text-sm text-zinc-500 mt-1">What the dashboard looks like and how to interact with it.</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 w-6 h-6 rounded-full bg-blue-500/15 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-400 text-[10px] font-bold">1</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">Landing Page</h3>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              A visually striking entry screen with a perspective-grid background, gradient typography,
              and a grid of platform capabilities. Click "Enter Dashboard" or jump to any section via the sidebar.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-0.5 w-6 h-6 rounded-full bg-blue-500/15 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-400 text-[10px] font-bold">2</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">Dashboard</h3>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              The main workspace: a search bar with suggested queries, a time-series line chart with
              an AI-generated summary below it, a network graph (Cytoscape.js), and a topic scatter plot.
              Keyboard shortcut <InlineCode text="Ctrl+K" /> jumps to the search bar from any page.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-0.5 w-6 h-6 rounded-full bg-blue-500/15 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-400 text-[10px] font-bold">3</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">Narrative AI Chat</h3>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              A floating chat panel (bottom-right button) powered by RAG. It retrieves relevant posts,
              answers with citations, and suggests follow-up queries. Conversation history persists in localStorage.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function SemanticSearch() {
  return (
    <section id="semantic-search" className="space-y-6 mt-12">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Semantic Search & Chatbot</h2>
        <p className="text-sm text-zinc-500 mt-1">How the system finds posts by meaning, not keywords.</p>
      </div>

      <div className="rounded-xl border border-white/5 bg-zinc-900/40 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white">The Problem with Keyword Search</h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          A query like <InlineCode text="financial downturn" /> would miss a post about
          <InlineCode text="people are terrified of losing their retirement savings" /> —
          yet these express the same underlying narrative. Semantic search solves this by matching vectors, not strings.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-200">How It Works</h3>
        <ol className="space-y-2 text-xs text-zinc-400">
          {[
            ['Query Encoding', 'The user query is embedded into a 384-dimensional vector using all-MiniLM-L6-v2'],
            ['Vector Query', 'This vector is compared against 8,667 pre-computed post embeddings in ChromaDB'],
            ['Top-K Results', 'The 50 most similar posts are returned (cosine distance), even with zero keyword overlap'],
            ['Chatbot RAG', 'The 10 most relevant posts are sent to Groq / Llama 4 Scout as context for answering questions'],
            ['Follow-up Handling', 'If a user message is a short follow-up (≤3 words), the system uses the longest earlier message for search to preserve context'],
          ].map(([step, desc], i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="font-mono text-blue-400 font-bold text-[10px] mt-0.5 w-12 flex-shrink-0">Step {i + 1}</span>
              <span><span className="text-zinc-200 font-medium">{step}</span> — {desc}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex gap-3">
        <span className="text-emerald-400 text-lg leading-none mt-0.5">✓</span>
        <div>
          <p className="text-xs font-semibold text-emerald-300 mb-1">Proven Zero-Overlap Matches</p>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Query: <InlineCode text="financial downturn and losing savings" /> → matched "banks mismanaging funds, people are terrified about retirement"
          </p>
          <p className="text-[11px] text-zinc-400 leading-relaxed mt-1">
            Query: <InlineCode text="corrupt government coverups" /> → matched "the alphabet agencies definitely hid the real reports"
          </p>
        </div>
      </div>
    </section>
  )
}

function Network() {
  return (
    <section id="network" className="space-y-6 mt-12">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Network Graph</h2>
        <p className="text-sm text-zinc-500 mt-1">Interactive Cytoscape.js visualization — influence, communities, and stress testing.</p>
      </div>

      <div className="rounded-xl border border-white/5 bg-zinc-900/40 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white">Graph Data Flow</h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          The graph is precomputed offline by <InlineCode text="scripts/build_graph.py" />. It reads <InlineCode text="cleaned_data.jsonl" />,
          extracts <strong className="text-zinc-200">@mentions</strong> from post text using regex, and builds a directed graph
          (NetworkX DiGraph) where each edge A→B means "user A mentioned user B". Edge weight = mention count.
          If no mentions exist, it falls back to a <strong className="text-zinc-200">subreddit-subreddit projection</strong> based on author overlap.
        </p>
      </div>

      <div className="rounded-xl border border-white/5 bg-zinc-900/40 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white">Algorithms Applied</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { name: 'PageRank', detail: 'alpha=0.85', desc: 'Measures each node influence in the network. Node size on the graph is proportional to PageRank × 5000 (min 10px, max 56px). The most influential accounts appear as the largest nodes.' },
            { name: 'Betweenness', detail: 'weighted', desc: 'Identifies bridge accounts that connect different communities. These account act as narrative transmitters even when they are not the most influential by PageRank.' },
            { name: 'Louvain', detail: 'undirected', desc: 'Partitions nodes into communities (colored differently). Louvain runs on the undirected version of the graph with edge weights as connection strength.' },
          ].map(algo => (
            <div key={algo.name} className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
              <p className="text-xs font-semibold text-zinc-200 mb-0.5">{algo.name}</p>
              <p className="text-[10px] text-zinc-500 font-mono mb-1">{algo.detail}</p>
              <p className="text-[11px] text-zinc-400 leading-relaxed">{algo.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-zinc-900/40 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white">Visual Encoding</h3>
        <ul className="space-y-2 text-xs text-zinc-400">
          <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">●</span><span><strong className="text-zinc-200">Node size</strong> — proportional to PageRank score. Range: 10–56 pixels radius.</span></li>
          <li className="flex items-start gap-2"><span className="text-purple-400 mt-0.5">●</span><span><strong className="text-zinc-200">Node color</strong> — determined by Louvain community assignment. Each community gets a unique color (blue, amber, green, purple, rose).</span></li>
          <li className="flex items-start gap-2"><span className="text-zinc-600 mt-0.5">●</span><span><strong className="text-zinc-200">Edge width</strong> — proportional to edge weight. Range: 0.8px minimum, scales × 0.5 per weight unit.</span></li>
          <li className="flex items-start gap-2"><span className="text-zinc-600 mt-0.5">●</span><span><strong className="text-zinc-200">Edge style</strong> — haystack curves for performance. Opacity 0.5 to avoid visual clutter.</span></li>
          <li className="flex items-start gap-2"><span className="text-zinc-600 mt-0.5">●</span><span><strong className="text-zinc-200">Labels</strong> — node usernames rendered below the node. Font: Inter 10px, white.</span></li>
        </ul>
      </div>

      <div className="rounded-xl border border-white/5 bg-zinc-900/40 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white">Interactivity</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            ['Pan & Zoom', 'Mouse drag to pan, scroll to zoom. Min 0.3×, max 3×.'],
            ['Node Hover Tooltips', 'Hovering a node shows its label, community ID, and PageRank score (4 decimals).'],
            ['Remove Root Node', 'Removes the highest-PageRank node and re-renders. Shows a trail of removed nodes at the bottom.'],
            ['Isolated Node Counter', 'Displays count of disconnected components. Badge pulses amber if any exist.'],
            ['Reset Button', 'Appears after node removal. Restores the full graph to original state.'],
          ].map(([title, desc]) => (
            <div key={title} className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
              <p className="text-xs font-semibold text-zinc-200 mb-0.5">{title}</p>
              <p className="text-[11px] text-zinc-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-zinc-900/40 p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Layout Algorithm</h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Uses Cytoscape's <strong className="text-zinc-200">COSE (Compound Spring Embed)</strong> layout — a force-directed algorithm
          that simulates physical repulsion between nodes and attraction along edges. Animated at 500ms with 32px padding.
          Isolated (zero-degree) nodes are excluded from the graph layout to prevent visual noise.
        </p>
      </div>
    </section>
  )
}

function TimeSeries() {
  return (
    <section id="time-series" className="space-y-6 mt-12">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Time-Series & AI Summary</h2>
        <p className="text-sm text-zinc-500 mt-1">Tracking narrative velocity with automatically generated explanations.</p>
      </div>

      <div className="space-y-3 text-xs text-zinc-400">
        <p className="leading-relaxed">
          When a search returns results, each post's <InlineCode text="created_utc" /> timestamp is bucketed by day.
          A Recharts LineChart plots the volume over time, revealing spikes and troughs in the narrative.
        </p>
        <p className="leading-relaxed">
          The <span className="text-zinc-200 font-medium">AI Summary</span> sends the top 20 posts to Groq / Llama 4
          Scout, which generates a 3-4 line explanation in plain language — accessible to anyone, no data literacy required.
        </p>
      </div>
    </section>
  )
}

function TopicClustering() {
  return (
    <section id="topic-clusters" className="space-y-6 mt-12">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Topic Scatter</h2>
        <p className="text-sm text-zinc-500 mt-1">Interactive 2D topic clustering with tunable K-Means in the browser.</p>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-white/5 bg-zinc-900/40 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">How the Scatter Plot Works</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Each dot represents a social media post positioned on a 2D plane using <strong className="text-zinc-200">UMAP</strong> (Unified
            Manifold Approximation and Projection) — dimensionality reduction that preserves local and global structure of the
            original embedding space. The raw embeddings from <InlineCode text="all-MiniLM-L6-v2" /> (384 dimensions) are compressed to 2D
            coordinates <InlineCode text="(x, y)" /> and stored in <InlineCode text="topic_assignments.json" />.
          </p>
          <p className="text-xs text-zinc-400 leading-relaxed">
            The scatter plot is built with pure React DOM — no heavy charting library. Each dot is positioned via CSS using
            percentage-based coordinates mapped to the container. Hovering any dot reveals the post text, subreddit, and cluster ID
            in a floating tooltip. Clicking a cluster dims unrelated points to near-zero opacity.
          </p>
          <p className="text-xs text-zinc-400 leading-relaxed">
            <strong className="text-zinc-200">Tunable K-Means slider</strong> (range 2–200) re-clusters the 2D points in real-time using
            a lightweight JavaScript K-Means implementation (max 15 iterations, sampled to 3,000 points for UI performance). The
            colors change dynamically — a "View Distribution Chart" button toggles a Recharts bar chart showing the top 10 cluster sizes.
            At extremes: n=2 creates 2 massive clusters; n=200 creates dozens of tiny clusters — the UI never breaks.
          </p>
          <p className="text-xs text-zinc-400 leading-relaxed">
            On the dashboard, the scatter appears as a compact preview. Clicking "Open Map Editor" or the navbar link opens fullscreen mode
            with a full sidebar: cluster list (sorted by size), the tunable slider at the top, and a zoomable Datamapplot view switchable via header button.
          </p>
        </div>
      </div>
    </section>
  )
}

function AnalyticsPage() {
  return (
    <section id="analytics-page" className="space-y-6 mt-12">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Analytics Page</h2>
        <p className="text-sm text-zinc-500 mt-1">A dedicated view for deeper insights — network data and topic overview without search context.</p>
      </div>

      <div className="rounded-xl border border-white/5 bg-zinc-900/40 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white">What You'll Find</h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          The Analytics page (<InlineCode text="/analytics" />) provides a standalone view of the platform's core visualizations without requiring
          an active search query. It displays:
        </p>
        <ul className="space-y-2 text-xs text-zinc-400">
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-0.5">•</span>
            <span><strong className="text-zinc-200">Network Graph</strong> — The full Cytoscape graph with the interactive "Remove Root Node" button, isolated node counter, and page-level Louvain community coloring. This is identical to the dashboard graph but persists across navigation.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-0.5">•</span>
            <span><strong className="text-zinc-200">Topic Scatter Preview</strong> — A compact version of the topic map showing the BERTopic-discovered clusters. Click "Open Map Editor" to enter fullscreen for the tunable K-Means interface.</span>
          </li>
        </ul>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Use the Analytics page as an at-a-glance overview of the dataset's network structure and topic distribution before diving into
          specific narrative queries from the Dashboard.
        </p>
      </div>
    </section>
  )
}

function MapEditor() {
  return (
    <section id="map-editor" className="space-y-6 mt-12">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Map Editor</h2>
        <p className="text-sm text-zinc-500 mt-1">Fullscreen topic analysis with dual visualization modes.</p>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-white/5 bg-zinc-900/40 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">K-Means Mode (Default)</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            The Map Editor opens in K-Means mode — a full-screen two-panel layout:
          </p>
          <ul className="space-y-2 text-xs text-zinc-400 mt-3">
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-0.5 font-bold">L</span>
              <span><strong className="text-zinc-200">Left Panel</strong> — Contains the tunable cluster slider (2–200), a scrollable sorted list of all clusters (each showing count), a "View/Hide Bar Chart" toggle for a Recharts distribution chart, and stats badges (total posts, active clusters).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-0.5 font-bold">R</span>
              <span><strong className="text-zinc-200">Right Panel</strong> — The full-width 2D scatter plot. Hovering any point shows a tooltip with the post text, subreddit, and cluster number. Clicking a cluster in the left list highlights it while dimming others.</span>
            </li>
          </ul>
          <p className="text-xs text-zinc-400 leading-relaxed">
            <strong className="text-zinc-200">Debouncing:</strong> The slider input is debounced by 300ms — the K-Means computation only triggers after you stop dragging. This prevents UI freezing during fast scrub animation.
          </p>
        </div>

        <div className="rounded-xl border border-white/5 bg-zinc-900/40 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Datamapplot Mode</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Click "View Datamapplot" in the header to switch to the Datamapplot view — an embedded <InlineCode text="<iframe>" />
            loading <InlineCode text="interactive_map.html" />. This provides:
          </p>
          <ul className="space-y-2 text-xs text-zinc-400 mt-3">
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-0.5">•</span>
              <span>Zoom in/out buttons and reset-zoom in the header toolbar</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-0.5">•</span>
              <span>Panning via mouse drag</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-0.5">•</span>
              <span>Label annotations and density visualization from the Datamapplot library</span>
            </li>
          </ul>
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 mt-3">
            <p className="text-[11px] text-amber-300">The Datamapplot iframe communicates with the parent via <InlineCode text="postMessage" /> for zoom controls (ZOOM_IN, ZOOM_OUT, RESET_ZOOM).</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function ChatAssistant() {
  return (
    <section id="chat-assistant" className="space-y-6 mt-12">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Narrative AI Chat</h2>
        <p className="text-sm text-zinc-500 mt-1">A RAG-powered conversational assistant with source citations and follow-up suggestions.</p>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-white/5 bg-zinc-900/40 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">How to Use</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Click the floating <strong className="text-zinc-200">"Narrative AI" button</strong> (bottom-right corner) to open the chat panel.
            Type any question about the social media data, and the assistant will:
          </p>
          <ol className="space-y-2 text-xs text-zinc-400 mt-3">
            <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">1.</span><span>Take your message and search ChromaDB for the 10 most relevant posts.</span></li>
            <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">2.</span><span>If your message is a short follow-up (≤3 words), it searches using the longest earlier user message instead — preserving the original context.</span></li>
            <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">3.</span><span>Send the retrieved posts + your full conversation history to Groq / Llama 4 Scout.</span></li>
            <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">4.</span><span>Display the response with <span className="text-zinc-200">source citations</span> (author @ + subreddit) below the message.</span></li>
            <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">5.</span><span>Generate 2–3 <span className="text-zinc-200">suggested follow-up queries</span> as clickable pill buttons under the reply.</span></li>
          </ol>
        </div>

        <div className="rounded-xl border border-white/5 bg-zinc-900/40 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Chat Panel Features</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              ['Fullscreen toggle', 'Expand the panel to fill the entire viewport'],
              ['Clear history', 'Wipe all messages and localStorage cache'],
              ['Markdown rendering', 'Lightweight parser handles bold, italic, code blocks, lists'],
              ['Source citations', 'Each AI reply shows @author and r/subreddit badges'],
              ['Follow-up queries', '3 clickable suggestion pills auto-generated by the LLM'],
              ['History persistence', 'Messages saved to localStorage, restored on reload'],
            ].map(([title, desc]) => (
              <div key={title} className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <p className="text-xs font-semibold text-zinc-200 mb-0.5">{title}</p>
                <p className="text-[11px] text-zinc-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex gap-3">
          <span className="text-emerald-400 text-lg leading-none mt-0.5">✓</span>
          <div>
            <p className="text-xs font-semibold text-emerald-300 mb-1">Conversation Context Preserved</p>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Previously, a follow-up like "yes do it" would lose context because ChromaDB searched for those exact words.
              Now the system detects short follow-ups and searches using the original query instead, so the LLM receives
              relevant posts and understands what "yes do it" refers to.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function APIReference() {
  return (
    <section id="api" className="space-y-8">
      <div>
        <h2 id="api-reference-heading" className="text-xl font-bold text-white tracking-tight">API Reference</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Full endpoint documentation for the NarrativeScope backend (FastAPI / Uvicorn).
        </p>
      </div>

      <div className="space-y-6">
        {/* POST /api/search */}
        <div className="rounded-xl border border-white/5 bg-zinc-900/40 p-5 space-y-4" id="api-search">
          <div className="flex items-center gap-3">
            <MethodBadge method="POST" />
            <code className="text-sm font-mono text-white">/api/search</code>
          </div>
          <p className="text-xs text-zinc-400">Semantic search across social media posts. Uses Sentence-BERT embeddings via ChromaDB. Detects non-English queries and warns when results may be limited.</p>
          <CodeBlock lang="json" code={`{\n  "query": "financial downturn and losing savings",\n  "limit": 50,\n  "filters": { "subreddit": "worldnews" }\n}`} />
          <p className="text-[11px] font-semibold text-zinc-300">Response</p>
          <CodeBlock lang="json" code={`{\n  "results": [\n    {\n      "id": "doc_001",\n      "text": "The banks are completely mismanaging the funds…",\n      "metadata": { "subreddit": "worldnews", "author": "user123" },\n      "distance": 0.42\n    }\n  ],\n  "detected_lang": "en",\n  "lang_warning": null\n}`} />
        </div>

        {/* POST /api/timeseries */}
        <div className="rounded-xl border border-white/5 bg-zinc-900/40 p-5 space-y-4" id="api-timeseries">
          <div className="flex items-center gap-3">
            <MethodBadge method="POST" />
            <code className="text-sm font-mono text-white">/api/timeseries</code>
          </div>
          <p className="text-xs text-zinc-400">Time-series velocity analysis. Retrieves posts matching query, buckets them by day, and generates an AI summary via Groq (Llama-4 Scout).</p>
          <CodeBlock lang="json" code={`{\n  "query": "government surveillance",\n  "limit": 500,\n  "filters": null\n}`} />
          <p className="text-[11px] font-semibold text-zinc-300">Response</p>
          <CodeBlock lang="json" code={`{\n  "data": [\n    { "date": "2024-01-15", "count": 12 },\n    { "date": "2024-01-16", "count": 34 }\n  ],\n  "summary": "This topic centers on concerns about…"\n}`} />
        </div>

        {/* GET /api/network */}
        <div className="rounded-xl border border-white/5 bg-zinc-900/40 p-5 space-y-4" id="api-network">
          <div className="flex items-center gap-3">
            <MethodBadge method="GET" />
            <code className="text-sm font-mono text-white">/api/network</code>
          </div>
          <p className="text-xs text-zinc-400">Returns the precomputed social network graph (nodes + edges) for Cytoscape.js visualization. Includes PageRank centrality and Louvain community labels from <code className="px-1 font-mono text-violet-300 bg-zinc-800/80 rounded">graph_metrics.json</code>.</p>
          <CodeBlock lang="json" code={`{\n  "elements": {\n    "nodes": [\n      { "data": { "id": "u_001", "label": "user123", "pagerank": 0.032, "community": 0 } }\n    ],\n    "edges": [\n      { "data": { "source": "u_001", "target": "u_002", "weight": 3 } }\n    ]\n  }\n}`} />
        </div>

        {/* POST /api/chat */}
        <div className="rounded-xl border border-white/5 bg-zinc-900/40 p-5 space-y-4" id="api-chat">
          <div className="flex items-center gap-3">
            <MethodBadge method="POST" />
            <code className="text-sm font-mono text-white">/api/chat</code>
          </div>
          <p className="text-xs text-zinc-400">RAG-powered chat. Retrieves contextual posts from ChromaDB, sends them to Groq (Llama-4 Scout) with conversation history, returns the reply, cited sources, and 3 suggested follow-up queries.</p>
          <CodeBlock lang="json" code={`{\n  "message": "Who is driving this narrative the most?",\n  "history": [\n    { "role": "user", "content": "government surveillance" }\n  ]\n}`} />
          <p className="text-[11px] font-semibold text-zinc-300">Response</p>
          <CodeBlock lang="json" code={`{\n  "reply": "Based on the context, the most influential voices…",\n  "sources": [\n    { "id": "doc_001", "author": "user123", "subreddit": "worldnews" }\n  ],\n  "suggested_queries": ["What subreddits dominate?", "Show top influencers"]\n}`} />
        </div>

        {/* GET /api/topics */}
        <div className="rounded-xl border border-white/5 bg-zinc-900/40 p-5 space-y-4" id="api-topics">
          <div className="flex items-center gap-3">
            <MethodBadge method="GET" />
            <code className="text-sm font-mono text-white">/api/topics</code>
          </div>
          <p className="text-xs text-zinc-400">Returns pre-computed BERTopic clustering results with UMAP 2D coordinates, filtered by minimum cluster size. Used for the Topic Scatter visualization.</p>
          <CodeBlock lang="bash" code={`curl http://localhost:8000/api/topics?min_size=15`} />
          <p className="text-[11px] font-semibold text-zinc-300">Response</p>
          <CodeBlock lang="json" code={`{\n  "topics": { "0": "Economic Policy", "1": "Institutional Trust" },\n  "points": [\n    { "id": "doc_001", "topic": 0, "x": 0.12, "y": -0.34 }\n  ],\n  "cluster_sizes": { "0": 142, "1": 98 }\n}`} />
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-violet-500/5 p-5 space-y-3">
        <h3 className="text-sm font-semibold text-white">Additional Endpoints</h3>
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <MethodBadge method="GET" />
            <div>
              <code className="text-xs font-mono text-zinc-200">/</code>
              <p className="text-[11px] text-zinc-500 mt-0.5">Health check / welcome message.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MethodBadge method="GET" />
            <div>
              <code className="text-xs font-mono text-zinc-200">/docs</code>
              <p className="text-[11px] text-zinc-500 mt-0.5">Auto-generated Swagger UI (FastAPI built-in).</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function MLStack() {
  return (
    <section id="ml-stack" className="space-y-6 mt-12">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">ML / AI Stack</h2>
        <p className="text-sm text-zinc-500 mt-1">Every model, algorithm, library, and parameter used in the project.</p>
      </div>

      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/10">
            <th className="pb-2 pr-4 text-left text-zinc-500 font-medium">Component</th>
            <th className="pb-2 pr-4 text-left text-zinc-500 font-medium">Model</th>
            <th className="pb-2 text-left text-zinc-500 font-medium">Library / Parameters</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {[
            ['Embeddings', 'all-MiniLM-L6-v2', 'sentence-transformers · dim=384 · cosine'],
            ['Semantic Search', 'Vector Query', 'ChromaDB · n_results=50'],
            ['Topic Clusters', 'BERTopic + K-Means', 'bertopic · client-side K-Means maxIter=15, range 2-200'],
            ['Dimensionality Reduction', 'UMAP', 'umap-learn · 2D coordinates'],
            ['Network Centrality', 'PageRank', 'networkx.pagerank · alpha=0.85'],
            ['Community Detection', 'Louvain', 'networkx.community.louvain_communities'],
            ['LLM Summaries', 'Llama 4 Scout', 'groq · meta-llama/llama-4-scout-17b-16e-instruct'],
            ['RAG Chat', 'Llama 4 Scout', 'groq · 10 context docs + source citations'],
          ].map(([comp, model, params]) => (
            <tr key={comp} className="hover:bg-white/[0.02] transition">
              <td className="py-2.5 pr-4 font-medium text-zinc-200">{comp}</td>
              <td className="py-2.5 pr-4 text-zinc-400 font-mono text-[11px]">{model}</td>
              <td className="py-2.5 text-zinc-500">{params}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function EdgeCases() {
  return (
    <section id="edge-cases" className="space-y-6 mt-12">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Edge Cases & Robustness</h2>
        <p className="text-sm text-zinc-500 mt-1">How the system handles failure modes and extreme inputs.</p>
      </div>

      <div className="space-y-2">
        {[
          ['Empty results', 'Friendly "No results found" with suggested fallback queries ("echo chambers", "misinformation")'],
          ['Very short queries', 'Client blocks queries under 2 characters with inline validation error'],
          ['Non-English input', 'langdetect identifies language; amber warning badge + cross-lingual embeddings still attempt matching'],
          ['Disconnected nodes', 'Graph removes isolated nodes cleanly, displays count badge'],
          ['Root node removal', 'Interactive stress test — graph re-renders without crashing'],
          ['K-Means extremes', 'Slider allows n=2 (2 massive clusters) and n=200 (very granular) — UI never breaks'],
          ['Missing GROQ_API_KEY', 'Fallback text "Analysis unavailable" — no crash'],
          ['Follow-up chat messages', 'System uses longest prior user message for ChromaDB search, preserving conversational intent'],
        ].map(([caseName, handling]) => (
          <div key={caseName} className="flex items-start gap-3 p-3 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition">
            <span className="text-emerald-400/60 text-sm mt-0.5 flex-shrink-0">✓</span>
            <div>
              <p className="text-xs font-medium text-zinc-200">{caseName}</p>
              <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{handling}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function Contributing() {
  return (
    <section id="contributing" className="space-y-6 mt-12">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Contributing</h2>
        <p className="text-sm text-zinc-500 mt-1">Project structure and how to extend the platform.</p>
      </div>

      <div className="rounded-xl border border-white/5 bg-zinc-900/40 p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Project Structure</h3>
        <CodeBlock lang="text" code={`├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── routers/
│   │   │   ├── search.py         # POST /api/search
│   │   │   ├── analytics.py      # POST /api/timeseries
│   │   │   ├── network.py        # GET /api/network
│   │   │   ├── chat.py           # POST /api/chat (RAG)
│   │   └── services/
│   │       └── db.py             # ChromaDB + embedding
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Router + layout
│   │   ├── api.js                # Axios API client
│   │   └── components/
│   │       ├── NetworkGraph.jsx  # Cytoscape graph
│   │       ├── TopicScatter.jsx  # K-Means scatter
│   │       ├── ChatPanel.jsx     # RAG chat UI
│   │       └── AnalyticsPage.jsx # Full analytics
│   └── vercel.json               # SPA routing
├── scripts/
│   ├── preprocess.py             # Data cleaning pipeline
│   └── build_graph.py            # Network + PageRank
├── data/
│   ├── chroma_db/                # Vector database
│   ├── graph_metrics.json        # Pre-computed graph
│   └── topic_assignments.json    # BERTopic clusters
└── data.jsonl                    # Raw input data`} />
      </div>
    </section>
  )
}

/* ─── Main ─── */
export default function DocumentationPage() {
  const [activeToc, setActiveToc] = useState('getting-started')
  const contentRef = useRef(null)

  // Scroll to section when TOC clicked
  const scrollTo = (id) => {
    setActiveToc(id)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Track visible section on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return
      const ids = tocItems.map(t => t.id)
      for (let i = ids.length - 1; i >= 0; i--) {
        const el = document.getElementById(ids[i])
        if (el && el.getBoundingClientRect().top <= 80) {
          setActiveToc(ids[i])
          return
        }
      }
    }

    const container = contentRef.current
    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Group TOC items
  let currentGroup = ''
  const groupedToc = []
  tocItems.forEach(item => {
    if (item.group !== currentGroup) {
      currentGroup = item.group
      if (currentGroup) groupedToc.push({ group: currentGroup })
    }
    groupedToc.push(item)
  })

  return (
    <div className="flex h-screen bg-[#0a0a0f]">
      {/* ─── Left TOC Sidebar ─── */}
      <div className="w-60 flex-shrink-0 border-r border-white/5 overflow-y-auto py-6 px-4">
        {/* Breadcrumb */}
        <div className="mb-4 px-1">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">Documentation</p>
          <h2 className="text-sm font-bold text-white mt-1">Narra-tionScope</h2>
          <p className="text-[10px] text-zinc-600 mt-0.5">v1.0.0</p>
        </div>

        {/* TOC */}
        <nav className="space-y-1">
          {groupedToc.map((item, i) => {
            // Group header separators — only inserted items without an id
            if (!item.id) {
              return (
                <div key={`g-${i}`} className="mt-4 mb-1 px-1">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-600 font-semibold">{item.group}</p>
                </div>
              )
            }
            const isActive = activeToc === item.id
            return (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`w-full text-left text-xs py-1.5 px-2 rounded transition ${
                  isActive
                    ? 'text-blue-400 bg-blue-500/10 font-medium'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* ─── Main Content ─── */}
      <div ref={contentRef} className="flex-1 overflow-y-auto">
        <div className="max-w-[720px] mx-auto py-10 px-8">
          <GettingStarted />
          <QuickStart />
          <CoreFeatures />
          <SemanticSearch />
          <Network />
          <TimeSeries />
          <TopicClustering />
          <AnalyticsPage />
          <MapEditor />
          <ChatAssistant />
          <APIReference />
          <MLStack />
          <EdgeCases />
          <Contributing />

          <div className="mt-16 pt-8 border-t border-white/5 text-center">
            <p className="text-[11px] text-zinc-600">Narra-tionScope · Built for SimPPL Research Engineering Intern Assignment</p>
          </div>
        </div>
      </div>
    </div>
  )
}
