import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer } from 'recharts'

export default function TopicScatter({ data, height = 400 }) {
  const points = data?.points || []
  const [hoveredText, setHoveredText] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [activeTopicId, setActiveTopicId] = useState(null)
  
  const [minCount, setMinCount] = useState(1)
  const [viewMore, setViewMore] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // pre-calculate absolute max size for the slider upper bound
  const rawTopicCounts = useMemo(() => {
    const counts = {}
    points.forEach(p => { counts[p.topic] = (counts[p.topic] || 0) + 1 })
    return counts
  }, [points])
  const absoluteMaxTopicCount = useMemo(() => Math.max(...Object.values(rawTopicCounts), 1), [rawTopicCounts])

  // filter points based on minCount and sample for performance
  const sampled = useMemo(() => {
    if (!points.length) return []
    let p = points.filter(pt => rawTopicCounts[pt.topic] >= minCount)
    if (p.length > 3000) p = p.filter((_, i) => i % Math.ceil(p.length / 3000) === 0)
    return p
  }, [points, minCount, rawTopicCounts])

  const xs = sampled.map(p => +p.x || 0)
  const ys = sampled.map(p => +p.y || 0)
  const xMin = Math.min(...xs), xMax = Math.max(...xs)
  const yMin = Math.min(...ys), yMax = Math.max(...ys)
  const rx = (v) => ((v - xMin) / ((xMax - xMin) || 1)) * 94 + 3
  const ry = (v) => 100 - ((v - yMin) / ((yMax - yMin) || 1)) * 92 - 4

  // count posts per topic for dot sizing + lists
  const topicCounts = {}
  sampled.forEach(p => { topicCounts[p.topic] = (topicCounts[p.topic] || 0) + 1 })
  const maxTopicCount = Math.max(...Object.values(topicCounts), 1)

  const topicList = useMemo(() => {
    return Object.entries(topicCounts).map(([topicId, count]) => {
      const id = parseInt(topicId)
      return { id, count }
    }).sort((a, b) => b.count - a.count)
  }, [topicCounts])

  const topicColors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#ec4899', '#14b8a6']

  const chartData = useMemo(() => {
    return topicList.slice(0, 10).map(t => ({
      name: t.id === -1 ? 'Outliers' : `T${t.id}`,
      count: t.count,
      fill: topicColors[Math.abs(t.id) % topicColors.length]
    }))
  }, [topicList])

  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY })
  }

  if (!sampled.length && points.length === 0) return <div className="flex items-center justify-center text-zinc-500 text-sm" style={{ height }}>No topic data</div>

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
          <span className="w-2 h-2 rounded-full" style={{ background: topicColors[Math.abs(hoveredText.topic) % topicColors.length] }} />
          <span className="text-zinc-200 font-semibold text-xs whitespace-nowrap">{hoveredText.topic === -1 ? 'Topic -1 (Outliers)' : `Topic #${hoveredText.topic}`}</span>
          <span className="text-zinc-500 text-[10px] bg-white/5 px-1.5 py-0.5 rounded border border-white/5">r/{hoveredText.subreddit}</span>
        </div>
        <p className="text-zinc-400 text-xs leading-relaxed">{hoveredText.text}</p>
      </div>
    )
  }

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0a0a0f] flex flex-col animate-fade-in" onMouseMove={handleMouseMove}>
        {/* Header matching ChatPanel */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-zinc-950/95 backdrop-blur flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            <span className="text-sm font-semibold text-zinc-200">Topics Clustering Analysis</span>
            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-[10px] text-zinc-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">{topicList.length} clusters active</span>
              <span className="text-[10px] text-zinc-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">{points.length.toLocaleString()} total posts</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsFullscreen(false)} className="text-xs bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 px-3 py-1.5 rounded transition">
              Exit Fullscreen
            </button>
            <button onClick={() => setIsFullscreen(false)} className="text-zinc-500 hover:text-zinc-300 text-2xl leading-none ml-2">&times;</button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">
          
          {/* Left Side Options */}
          <div className="flex flex-col bg-zinc-950 border-r border-white/5 w-72 flex-shrink-0 h-full">
            <div className="p-4 border-b border-white/5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-zinc-300">Min Cluster Size:</span>
                <span className="text-xs font-mono text-zinc-200 bg-black/40 px-2 py-1 rounded">{minCount}</span>
              </div>
              <input
                type="range"
                min="1"
                max="126"
                value={minCount}
                onChange={e => setMinCount(Number(e.target.value))}
                className="w-full h-1 bg-blue-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar bg-[#0a0a0f]">
              {topicList.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center mt-6">No topics match min size ({minCount})</p>
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
                        <span className="w-2 h-2 rounded-full inline-block" style={{ background: topicColors[Math.abs(t.id) % topicColors.length] }} />
                        {t.id === -1 ? 'Outliers' : `Topic #${t.id}`}
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
                <p className="text-[10px] text-zinc-500 mb-2 uppercase tracking-wider font-semibold">Top Topics Distribution</p>
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
            {sampled.length > 0 ? sampled.map((p, i) => {
              const count = topicCounts[p.topic] || 1
              const dotSize = Math.max(3, Math.min(count / maxTopicCount * 12, 12))
              const isActive = activeTopicId === null || activeTopicId === p.topic
              return (
                <div
                  key={i}
                  className="absolute rounded-full transition-all duration-300 ease-out"
                  style={{
                    left: `${rx(p.x)}%`,
                    top: `${ry(p.y)}%`,
                    width: dotSize,
                    height: dotSize,
                    background: topicColors[p.topic % topicColors.length],
                    opacity: isActive ? 0.8 : 0.05,
                    boxShadow: isActive ? `0 0 ${dotSize}px ${topicColors[p.topic % topicColors.length]}80` : 'none',
                    zIndex: hoveredText?.topic === p.topic ? 5 : 1
                  }}
                  onMouseEnter={(e) => {
                    handleMouseMove(e);
                    setHoveredText({ topic: p.topic, subreddit: p.subreddit, text: p.text?.substring(0, 300) + '…' })
                  }}
                  onMouseLeave={() => setHoveredText(null)}
                />
              )
            }) : (
              <div className="flex h-full items-center justify-center text-zinc-600 text-sm">
                Increase the minimum cluster size or try picking a size with points.
              </div>
            )}
          </div>

        </div>
        {renderTooltip()}
      </div>
    )
  }

  // NORMAL DASHBOARD MODE (Graph Only)
  return (
    <div className="relative w-full group flex flex-col animate-fade-in" style={{ height, borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.04)', background: 'rgba(0,0,0,0.2)', overflow: 'hidden' }} onMouseMove={handleMouseMove}>
      <div className="absolute top-3 left-4 z-10 pointer-events-none">
        <p className="text-xs font-semibold text-zinc-300 drop-shadow-md tracking-wide">Topics ({topicList.length} clusters)</p>
      </div>

      <button 
        onClick={() => setIsFullscreen(true)}
        className="absolute top-3 right-3 z-20 bg-zinc-900/90 border border-white/10 text-zinc-300 px-3 py-1.5 text-xs rounded-md shadow-xl hover:bg-zinc-800 transition flex items-center gap-2 backdrop-blur-md opacity-0 group-hover:opacity-100 focus:opacity-100"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" /></svg>
        Full Screen / Options
      </button>

      <div className="flex-1 relative w-full h-full cursor-crosshair">
        {sampled.length > 0 ? sampled.map((p, i) => {
          const count = topicCounts[p.topic] || 1
          const dotSize = Math.max(2, Math.min(count / maxTopicCount * 8, 8))
          const isActive = activeTopicId === null || activeTopicId === p.topic
          return (
            <div
              key={i}
              className="absolute rounded-full transition-opacity duration-200"
              style={{
                left: `${rx(p.x)}%`,
                top: `${ry(p.y)}%`,
                width: dotSize,
                height: dotSize,
                background: topicColors[p.topic % topicColors.length],
                opacity: isActive ? 0.7 : 0.05,
                padding: '1px',
                zIndex: hoveredText?.topic === p.topic ? 5 : 1
              }}
              onMouseEnter={(e) => {
                handleMouseMove(e);
                setHoveredText({ topic: p.topic, subreddit: p.subreddit, text: p.text?.substring(0, 150) + '…' })
              }}
              onMouseLeave={() => setHoveredText(null)}
            />
          )
        }) : (
          <div className="flex h-full items-center justify-center text-zinc-600 text-xs text-center px-4">
            Increase the minimum cluster size.
          </div>
        )}
      </div>
      
      {renderTooltip()}
    </div>
  )
}
