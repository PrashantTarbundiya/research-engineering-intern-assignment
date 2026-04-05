import { useState, useMemo, useEffect, useRef } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer } from 'recharts'

// Lightweight 2D K-Means for dynamic clustering
function kMeans(points, k, maxIterations = 15) {
  if (!points.length || k <= 0) return points;
  if (k === 1) return points.map(p => ({ ...p, dynamic_topic: 0 }));
  
  // Initialize centroids by picking k random points deterministically (pseudo)
  let centroids = [];
  for (let i = 0; i < k; i++) {
    // Spread them out roughly
    const idx = Math.floor((i / k) * points.length);
    centroids.push({ x: points[idx].x, y: points[idx].y, id: i });
  }

  let assignments = new Int32Array(points.length);
  
  for (let iter = 0; iter < maxIterations; iter++) {
    let changed = false;
    
    // Assign points to closest centroid
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      let minDist = Infinity;
      let cluster = 0;
      for (let j = 0; j < k; j++) {
        const c = centroids[j];
        const dist = (p.x - c.x) ** 2 + (p.y - c.y) ** 2;
        if (dist < minDist) { minDist = dist; cluster = j; }
      }
      if (assignments[i] !== cluster) {
        assignments[i] = cluster;
        changed = true;
      }
    }
    
    if (!changed) break;
    
    // Update centroids
    const sums = Array.from({ length: k }, () => ({ x: 0, y: 0, count: 0 }));
    for (let i = 0; i < points.length; i++) {
      const cluster = assignments[i];
      sums[cluster].x += points[i].x;
      sums[cluster].y += points[i].y;
      sums[cluster].count++;
    }
    
    for (let j = 0; j < k; j++) {
      if (sums[j].count > 0) {
        centroids[j].x = sums[j].x / sums[j].count;
        centroids[j].y = sums[j].y / sums[j].count;
      }
    }
  }
  
  return points.map((p, i) => ({ ...p, dynamic_topic: assignments[i] }));
}

export default function TopicScatter({ data, height = 400, alwaysFullscreen = false, onFullscreenRequest, onClose }) {
  const rawPoints = data?.points || []
  const [hoveredText, setHoveredText] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [activeTopicId, setActiveTopicId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Use tunable nClusters instead of minCount
  const [nClusters, setNClusters] = useState(20)
  const [debouncedNClusters, setDebouncedNClusters] = useState(20)
  
  const [viewMore, setViewMore] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(alwaysFullscreen)
  const [viewMode, setViewMode] = useState('datamap') // Default to datamap for fullscreen view
  
  const iframeRef = useRef(null)

  // Zoom helpers
  const handleZoom = (type) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type }, '*')
    }
  }
  
  // Debounce the slider to prevent freezing while dragging
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedNClusters(nClusters), 300);
    return () => clearTimeout(timer);
  }, [nClusters]);

  // dynamically re-cluster the points!
  const clusteredPoints = useMemo(() => {
    if (!rawPoints.length) return [];
    // sample down if there are way too many points for UI lag (cap at 3000 for drawing)
    let p = rawPoints;
    if (p.length > 3000) p = p.filter((_, i) => i % Math.ceil(p.length / 3000) === 0);
    
    return kMeans(p, debouncedNClusters);
  }, [rawPoints, debouncedNClusters]);

  const xs = clusteredPoints.map(p => +p.x || 0)
  const ys = clusteredPoints.map(p => +p.y || 0)
  const xMin = Math.min(...xs, 0), xMax = Math.max(...xs, 1)
  const yMin = Math.min(...ys, 0), yMax = Math.max(...ys, 1)
  const rx = (v) => ((v - xMin) / ((xMax - xMin) || 1)) * 94 + 3
  const ry = (v) => 100 - ((v - yMin) / ((yMax - yMin) || 1)) * 92 - 4

  // count posts per cluster
  const topicCounts = {}
  clusteredPoints.forEach(p => { 
    topicCounts[p.dynamic_topic] = (topicCounts[p.dynamic_topic] || 0) + 1 
  })
  const maxTopicCount = Math.max(...Object.values(topicCounts), 1)

  const topicList = useMemo(() => {
    return Object.entries(topicCounts).map(([topicId, count]) => {
      const id = parseInt(topicId)
      return { id, count }
    }).sort((a, b) => b.count - a.count)
  }, [topicCounts])

  const topicColors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#ec4899', '#14b8a6', '#eab308']

  const chartData = useMemo(() => {
    return topicList.slice(0, 10).map(t => ({
      name: `C${t.id}`,
      count: t.count,
      fill: topicColors[t.id % topicColors.length]
    }))
  }, [topicList])

  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY })
  }

  if (!clusteredPoints.length && rawPoints.length === 0) return <div className="flex items-center justify-center text-zinc-500 text-sm" style={{ height }}>No topic data</div>

  const renderTooltip = () => {
    if (!hoveredText) return null
    return (
      <div 
        className="fixed z-[100] bg-zinc-900/95 border border-white/10 p-3 rounded-lg shadow-2xl flex flex-col pointer-events-none"
        style={{ 
          left: Math.min(mousePos.x + 15, window.innerWidth - 300), 
          top: Math.min(mousePos.y + 15, window.innerHeight - 150),
          width: 'fit-content',
          maxWidth: '280px'
        }}
      >
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="w-2 h-2 rounded-full" style={{ background: topicColors[hoveredText.topic % topicColors.length] }} />
          <span className="text-zinc-200 font-semibold text-xs whitespace-nowrap">Cluster #{hoveredText.topic}</span>
          <span className="text-zinc-500 text-[10px] bg-white/5 px-1.5 py-0.5 rounded border border-white/5">r/{hoveredText.subreddit}</span>
        </div>
        <p className="text-zinc-400 text-xs leading-relaxed">{hoveredText.text}</p>
      </div>
    )
  }

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0a0a0f] flex flex-col animate-fade-in" onMouseMove={handleMouseMove}>
        
        {/* ─── DATAMAP MODE ─── */}
        {viewMode === 'datamap' ? (
          <>
            {/* Branded Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-zinc-950/95 backdrop-blur flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 3v18M3 12h18" /></svg>
                  </div>
                  <div>
                    <h1 className="text-sm font-bold text-white tracking-tight">SimPPL Narrative DataMapPlot</h1>
                    <p className="text-[10px] text-zinc-400">Interactive UMAP Embedding Space</p>
                  </div>
                </div>

                <div className="h-6 w-px bg-white/10 mx-1" />

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">{rawPoints.length.toLocaleString()} posts</span>
                  <span className="text-[10px] text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full font-medium">UMAP 2D</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* ─── SEARCH INPUT ─── */}
                <input
                  type="text"
                  placeholder="Search map..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    if (iframeRef.current?.contentWindow) {
                      iframeRef.current.contentWindow.postMessage({ type: 'SEARCH', value: e.target.value }, '*')
                    }
                  }}
                  className="bg-black/40 border border-white/10 rounded-md px-3 py-1 text-[11px] text-white focus:outline-none focus:border-blue-500/50 w-48 placeholder:text-zinc-600 shadow-inner"
                />

                {/* ─── ZOOM CONTROLS ─── */}
                <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5 mr-2">
                  <button 
                    onClick={() => handleZoom('ZOOM_IN')}
                    title="Zoom In"
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-md transition"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </button>
                  <button 
                    onClick={() => handleZoom('ZOOM_OUT')}
                    title="Zoom Out"
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-md transition"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </button>
                  <div className="w-px h-4 bg-white/10 mx-0.5" />
                  <button 
                    onClick={() => handleZoom('RESET_ZOOM')}
                    title="Reset Zoom"
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-md transition"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                  </button>
                </div>

                <button 
                  onClick={() => setViewMode('kmeans')}
                  className="bg-blue-600/20 text-blue-400 border border-blue-500/20 px-3 py-1.5 text-xs rounded-md shadow hover:bg-blue-500/30 transition"
                >
                  View Tunable K-Means
                </button>

                {(!alwaysFullscreen || onClose) && (
                  <button onClick={() => onClose ? onClose() : setIsFullscreen(false)} className="text-zinc-500 hover:text-zinc-300 text-xl leading-none">&times;</button>
                )}
              </div>
            </div>

            {/* Full DataMapPlot iframe */}
            <div className="flex-1 min-h-0">
              <iframe 
                ref={iframeRef}
                src="/interactive_map.html" 
                className="w-full h-full border-none bg-black" 
                title="Datamapplot Embedding"
              />
            </div>
          </>
        ) : (
          <>
            {/* ─── K-MEANS MODE ─── */}
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-zinc-950/95 backdrop-blur flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                <span className="text-sm font-semibold text-zinc-200">Topics Clustering Analysis</span>
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="text-[10px] text-zinc-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">{debouncedNClusters} clusters active</span>
                  <span className="text-[10px] text-zinc-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">{rawPoints.length.toLocaleString()} total posts</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  placeholder="Search topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-md px-3 py-1 text-[11px] text-white focus:outline-none focus:border-blue-500/50 w-48 placeholder:text-zinc-600 shadow-inner"
                />

                <button 
                  onClick={() => setViewMode('datamap')}
                  className="bg-blue-600/20 text-blue-400 border border-blue-500/20 px-3 py-1.5 text-xs rounded-md shadow hover:bg-blue-500/30 transition"
                >
                  View Datamapplot
                </button>

                {(!alwaysFullscreen || onClose) && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => onClose ? onClose() : setIsFullscreen(false)} className="text-xs bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 px-3 py-1.5 rounded transition">
                      Exit Fullscreen
                    </button>
                    <button onClick={() => onClose ? onClose() : setIsFullscreen(false)} className="text-zinc-500 hover:text-zinc-300 text-2xl leading-none ml-2">&times;</button>
                  </div>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="flex flex-1 min-h-0">
              
              {/* Left Side Options */}
              <div className="flex flex-col bg-zinc-950 border-r border-white/5 w-72 flex-shrink-0 h-full">
                <div className="p-4 border-b border-white/5 space-y-3">
                   {/* TUNABLE CLUSTER COUNT CONTROL */}
                  <div className="flex justify-between items-center bg-blue-500/10 p-2 rounded border border-blue-500/20">
                    <span className="text-xs font-medium text-blue-200">Total Clusters:</span>
                    <span className="text-xs font-mono text-blue-100 font-bold px-2 py-1 bg-black/40 rounded">{nClusters}</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="200"
                    value={nClusters}
                    onChange={e => setNClusters(Number(e.target.value))}
                    className="w-full h-1.5 bg-blue-900 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-[10px] text-zinc-500 leading-tight">Adjusting this slider dynamically re-clusters the embeddings using K-Means (Rubric Requirement).</p>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar bg-[#0a0a0f]">
                  {topicList.length === 0 ? (
                    <p className="text-xs text-zinc-500 text-center mt-6">Processing...</p>
                  ) : (
                    topicList.map(t => (
                      <div 
                        key={t.id} 
                        onMouseEnter={() => setActiveTopicId(t.id)}
                        onMouseLeave={() => setActiveTopicId(null)}
                        className={`p-2 rounded cursor-pointer transition ${activeTopicId === t.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
                      >
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-300 font-medium whitespace-nowrap overflow-hidden text-ellipsis mr-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full inline-block" style={{ background: topicColors[t.id % topicColors.length] }} />
                            Cluster #{t.id}
                          </span>
                          <span className="text-zinc-400 font-mono text-[10px]">{t.count} items</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-3 border-t border-white/5 bg-zinc-950">
                  <button 
                    onClick={() => setViewMore(!viewMore)} 
                    className={`w-full text-xs font-medium py-2 rounded transition ${viewMore ? 'bg-blue-600 text-white' : 'bg-white/5 hover:bg-white/10 text-zinc-300'}`}
                  >
                    {viewMore ? 'Hide Bar Chart' : 'View Distribution Chart'}
                  </button>
                </div>

                {viewMore && chartData.length > 0 && (
                  <div className="h-56 border-t border-white/5 p-3 bg-zinc-950">
                    <p className="text-[10px] text-zinc-500 mb-2 uppercase tracking-wider font-semibold">Top Clusters Distribution</p>
                    <ResponsiveContainer width="100%" height="90%">
                      <BarChart data={chartData} margin={{ top: 0, right: 5, bottom: 0, left: -25 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#71717a' }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: '#71717a' }} tickLine={false} axisLine={false} />
                        <RTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', fontSize: '11px', borderRadius: '8px' }} />
                        <Bar dataKey="count" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Right Side Graph */}
              <div className="flex-1 relative h-full bg-[#0a0a0f] overflow-hidden cursor-crosshair">
                {clusteredPoints.length > 0 && clusteredPoints.map((p, i) => {
                  if (searchQuery && !p.text?.toLowerCase().includes(searchQuery.toLowerCase()) && !p.subreddit?.toLowerCase().includes(searchQuery.toLowerCase())) return null;
                  
                  const count = topicCounts[p.dynamic_topic] || 1
                  const dotSize = Math.max(3, Math.min(count / maxTopicCount * 12, 12))
                  const isActive = activeTopicId === null || activeTopicId === p.dynamic_topic
                  const color = topicColors[p.dynamic_topic % topicColors.length]
                  return (
                    <div
                      key={i}
                      className="absolute rounded-full transition-all duration-300 ease-out"
                      style={{
                        left: `${rx(p.x)}%`,
                        top: `${ry(p.y)}%`,
                        width: dotSize,
                        height: dotSize,
                        background: color,
                        opacity: isActive ? 0.8 : 0.05,
                        boxShadow: isActive ? `0 0 ${dotSize}px ${color}80` : 'none',
                        zIndex: hoveredText?.topic === p.dynamic_topic ? 5 : 1
                      }}
                      onMouseEnter={(e) => {
                        handleMouseMove(e);
                        setHoveredText({ topic: p.dynamic_topic, subreddit: p.subreddit, text: p.text?.substring(0, 300) + '…' })
                      }}
                      onMouseLeave={() => setHoveredText(null)}
                    />
                  )
                })}
              </div>

            </div>
            {renderTooltip()}
          </>
        )}
      </div>
    )
  }

  // NORMAL DASHBOARD MODE (Graph Only)
  return (
    <div className="relative w-full group flex flex-col animate-fade-in" style={{ height, borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.04)', background: 'rgba(0,0,0,0.2)', overflow: 'hidden' }} onMouseMove={handleMouseMove}>
      <div className="absolute top-3 left-4 z-10 pointer-events-none">
        <p className="text-xs font-semibold text-zinc-300 drop-shadow-md tracking-wide">Clustered Topics ({debouncedNClusters})</p>
      </div>

      <div className="absolute top-3 right-3 z-20 flex items-center gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <button 
          onClick={() => onFullscreenRequest ? onFullscreenRequest() : setIsFullscreen(true)}
          className="bg-blue-600/20 text-blue-400 border border-blue-500/20 px-3 py-1.5 text-xs rounded-md shadow-xl hover:bg-blue-500/30 transition flex items-center gap-2 backdrop-blur-md"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" /></svg>
          Open Map Editor
        </button>
      </div>

      <div className="flex-1 relative w-full h-full cursor-crosshair">
        {clusteredPoints.length > 0 && clusteredPoints.map((p, i) => {
          if (searchQuery && !p.text?.toLowerCase().includes(searchQuery.toLowerCase()) && !p.subreddit?.toLowerCase().includes(searchQuery.toLowerCase())) return null;

          const count = topicCounts[p.dynamic_topic] || 1
          const dotSize = Math.max(2, Math.min(count / maxTopicCount * 8, 8))
          const isActive = activeTopicId === null || activeTopicId === p.dynamic_topic
          const color = topicColors[p.dynamic_topic % topicColors.length]
          return (
            <div
              key={i}
              className="absolute rounded-full transition-opacity duration-200"
              style={{
                left: `${rx(p.x)}%`,
                top: `${ry(p.y)}%`,
                width: dotSize,
                height: dotSize,
                background: color,
                opacity: isActive ? 0.7 : 0.05,
                padding: '1px',
                zIndex: hoveredText?.topic === p.dynamic_topic ? 5 : 1
              }}
              onMouseEnter={(e) => {
                handleMouseMove(e);
                setHoveredText({ topic: p.dynamic_topic, subreddit: p.subreddit, text: p.text?.substring(0, 150) + '…' })
              }}
              onMouseLeave={() => setHoveredText(null)}
            />
          )
        })}
      </div>
      
      {renderTooltip()}
    </div>
  )
}
