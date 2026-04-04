import { useEffect, useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { getNetwork, getTopics } from '../api'

function Tooltip({ active, payload }) {
  if (!active || !payload?.[0]) return null
  return (
    <div className="bg-zinc-800 border border-white/15 rounded-lg px-3 py-2 text-xs shadow-xl">
      <span className="text-white font-medium">{payload[0].name || payload[0].payload?.date || ''}</span>
      <span className="text-zinc-300 ml-2">{payload[0].value}</span>
    </div>
  )
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e', '#06b6d4', '#ec4899', '#14b8a6']

export default function AnalyticsPage() {
  const [topicData, setTopicData] = useState({ topics: {}, points: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTopics().then(setTopicData).catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64 text-zinc-400">Loading analytics...</div>

  const fullPoints = topicData?.points || []
  const topics = topicData?.topics || {}

  // Take all points for stats, sample for charts
  const points = fullPoints.slice(0, 10000) // cap for performance

  // Total posts
  const TOTAL = points.length.toLocaleString()
  const UNIQUE_TOPICS = Object.keys(topics).length
  const SUBREDDITS = new Set(points.map(p => p.subreddit)).size

  // Subreddit distribution (top 15)
  const subCounts = {}
  points.forEach(p => { subCounts[p.subreddit] = (subCounts[p.subreddit] || 0) + 1 })
  const topSubs = Object.entries(subCounts).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))

  // Topic distribution (posts per topic, top 15)
  const topicCounts = {}
  points.forEach(p => { topicCounts[p.topic] = (topicCounts[p.topic] || 0) + 1 })
  const topTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([topic, posts]) => ({ name: `#${topic}`, posts, label: topics[topic] || 'Unlabeled' }))

  // Topic density by X position (shows clustering)
  const xs = points.map(p => +p.x || 0)
  const xMin = Math.min(...xs), xMax = Math.max(...xs)
  const xRange = xMax - xMin || 1
  const BINS = 30
  const densityData = new Array(BINS).fill(0)
  points.forEach(p => {
    const bin = Math.min(Math.floor(((p.x - xMin) / xRange) * BINS), BINS - 1)
    densityData[bin]++
  })
  const densityChart = densityData.map((count, i) => ({ x: (xMin + (i / BINS) * xRange).toFixed(2), count }))

  // Topic labels display
  const topicLabels = Object.entries(topics)
    .map(([id, label]) => ({ id: parseInt(id), label: String(label) }))

  // Top subs by unique topics
  const subTopicMap = {}
  points.forEach(p => {
    if (!subTopicMap[p.subreddit]) subTopicMap[p.subreddit] = new Set()
    subTopicMap[p.subreddit].add(p.topic)
  })
  const subTopicCounts = Object.entries(subTopicMap)
    .map(([name, set]) => ({ name, topics: set.size, posts: subCounts[name] || 0 }))
    .sort((a, b) => b.topics - a.topics || b.posts - a.posts).slice(0, 12)

  return (
    <div className="min-h-screen animate-fade-in pb-10">
      {/* header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
        <p className="text-sm text-zinc-400 mt-1">Data-driven insights from {points.length.toLocaleString()} posts across {SUBREDDITS} communities</p>
      </div>

      {/* stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Posts', value: TOTAL, color: '#3b82f6' },
          { label: 'Topics Found', value: UNIQUE_TOPICS, color: '#8b5cf6' },
          { label: 'Subreddits', value: SUBREDDITS, color: '#10b981' },
          { label: 'Sample Size', value: `${(points.length / fullPoints.length * 100).toFixed(0)}%`, color: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} className="glass-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-400">{s.label}</span>
              <span className="w-2 h-2 rounded-full shadow-lg" style={{ background: s.color }} />
            </div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
          </div>
        ))}
      </div>

      {/* subreddit bar + topic pie */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Posts by Subreddit</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topSubs.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 11 }} tickLine={false} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fill: '#888', fontSize: 11 }} tickLine={false} />
              <RTooltip content={<Tooltip />} />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Top Topics</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topTopics} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis type="number" tick={{ fill: '#888', fontSize: 11 }} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#d4d4d8', fontSize: 11 }} width={70} tickLine={false} />
              <RTooltip content={<Tooltip />} />
              <Bar dataKey="posts" radius={[0, 4, 4, 0]}>
                {topTopics.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* topic density */}
      <div className="glass-card p-5 mb-6">
        <h3 className="text-sm font-semibold text-white mb-4">Narrative Density (spatial distribution of clusters)</h3>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={densityChart}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="x" tick={{ fill: '#666', fontSize: 10 }} tickLine={false} />
            <YAxis tick={{ fill: '#666', fontSize: 10 }} tickLine={false} />
            <RTooltip content={<Tooltip />} />
            <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* subreddit topic diversity */}
      <div className="glass-card p-5 mb-6">
        <h3 className="text-sm font-semibold text-white mb-4">Subreddits — Topic Diversity vs Post Volume</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={subTopicCounts}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 11 }} tickLine={false} angle={-35} textAnchor="end" height={60} />
            <YAxis tick={{ fill: '#888', fontSize: 11 }} tickLine={false} />
            <RTooltip content={<Tooltip />} />
            <Bar dataKey="topics" fill="#10b981" name="Unique Topics" radius={[4, 4, 0, 0]} />
            <Bar dataKey="posts" fill="#f59e0b80" name="Total Posts" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* topic labels */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">All Topic Keywords ({topicLabels.length})</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {topicLabels.map((t, i) => (
            <div key={i} className="border border-white/5 rounded-lg p-3 bg-white/[0.02]">
              <span className="text-xs font-bold text-blue-400 mb-1 block">Topic #{t.id}</span>
              <p className="text-sm text-zinc-300">{t.label}</p>
              <p className="text-xs text-zinc-500 mt-1">{topicCounts[t.id] || 0} posts</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
