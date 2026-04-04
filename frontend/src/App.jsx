import { useState, useEffect, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip } from 'recharts'

import { searchPosts, getTimeseries, getNetwork, getTopics, checkHealth, isHealthy } from './api'
import NetworkGraph from './components/NetworkGraph'
import TopicScatter from './components/TopicScatter'
import ChatPanel from './components/ChatPanel'
import AnalyticsPage from './components/AnalyticsPage'

const navItems = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'topics', label: 'Map Editor' },
]

const defaultChartData = []
const defaultTopics = { points: [] }

/* ─── Sidebar ─── */
function Sidebar({ page, onNav, collapsed, onToggle }) {
  return (
    <div className={`flex flex-col transition-all duration-200 flex-shrink-0 bg-zinc-950 border-r border-white/5 ${collapsed ? 'w-10' : 'w-44'}`}>
      <div className="flex items-center justify-between px-2 py-3 border-b border-white/5">
        {!collapsed && <span className="text-sm font-bold text-white">NS</span>}
        <button onClick={onToggle} className="text-zinc-500 hover:text-zinc-300 p-0.5 ml-auto">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
        </button>
      </div>

      <nav className="flex-1 py-1">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNav(item.id)}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition ${page === item.id ? 'bg-blue-500/15 text-white border-l-2 border-blue-500' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              {item.id === 'dashboard'
                ? <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                : item.id === 'topics'
                ? <><circle cx="12" cy="12" r="9" /><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" /></>
                : <>
                    <path d="M3 3v18h18" />
                    <path d="M7 16l4-6 4 4 5-9" />
                  </>
              }
            </svg>
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className={`px-2 py-2 border-t border-white/5 flex items-center gap-2 ${collapsed ? 'justify-center' : ''}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${isHealthy() ? 'bg-emerald-500' : 'bg-red-500'}`} />
        {!collapsed && <span className="text-[10px] text-zinc-400">{isHealthy() ? 'Connected' : 'Offline'}</span>}
      </div>
    </div>
  )
}

/* ─── Landing Page ─── */
function LandingPage({ onEnter, onSearchFocus }) {
  return (
    <div className="min-h-screen animate-fade-in relative">
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(rgba(59,130,246,0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59,130,246,0.06) 1px, transparent 1px),
              linear-gradient(160deg, rgba(139,92,246,0.08) 1px, transparent 1px),
              linear-gradient(-20deg, rgba(139,92,246,0.08) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
            transform: 'perspective(1000px) rotateX(60deg) rotateZ(45deg) translateY(-30%)',
            maskImage: 'radial-gradient(ellipse 50% 40% at 50% 40%, black, transparent)',
          }}
        />
      </div>

      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full" style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.1) 0%, rgba(139,92,246,0.06) 50%, transparent 100%)', filter: 'blur(60px)' }} />

      <div className="relative z-10 flex flex-col items-center pt-40 px-6">

        <h1 className="text-white font-bold text-center leading-tight tracking-tight" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}>
          Analyze the Flow of
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500 bg-clip-text text-transparent" style={{ textShadow: '0 0 40px rgba(139,92,246,0.3)' }}>
            Digital Narratives
          </span>
        </h1>

        <p className="text-zinc-300 mt-5 max-w-[36rem] text-center leading-relaxed">
          Data-driven viewport into how ideas form, spread, and decay across the internet.
        </p>

        <div className="flex gap-3 mt-8">
          <button onClick={onEnter} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-500 transition shadow-lg">
            Enter Dashboard →
          </button>
        </div>

      </div>

      <div className="relative z-10 max-w-5xl mx-auto mt-20 px-6 pb-16">
        <p className="text-center text-zinc-400 text-sm mb-8">Platform Capabilities</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: 'Semantic Search', desc: 'Vector-based RAG finds similar narratives across posts' },
            { title: 'Network Analysis', desc: 'Interactive graphs with community-colored nodes' },
            { title: 'Time Series', desc: 'Track narrative velocity with AI summary' },
            { title: 'Narrative AI', desc: 'RAG-powered chat assistant with source citations' },
            { title: 'Topic Clustering', desc: '123+ ML-discovered topic clusters from 8,667 posts' },
            { title: 'Multi-Platform', desc: 'Data from Reddit, Twitter/X, and more' },
          ].map((f, i) => (
            <div key={i} className="glass-card p-4">
              <h3 className="text-zinc-200 font-medium text-sm mb-1">{f.title}</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Search suggestions ─── */
const suggestedQueries = [
  'institutional decay',
  'media manipulation',
  'political polarization',
  'economic anxiety',
  'echo chambers',
  'social movements',
]

/* ─── Dashboard Page ─── */
function DashboardPage({ searchQuery, setSearchQuery, onSearch, onNavigate }) {
  const [searchResults, setSearchResults] = useState([])
  const [tsData, setTsData] = useState(defaultChartData)
  const [summary, setSummary] = useState('')
  const [networkData, setNetworkData] = useState({ nodes: [], edges: [] })
  const [topicData, setTopicData] = useState(defaultTopics)
  const [activeSearch, setActiveSearch] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchError, setSearchError] = useState('')

  useEffect(() => {
    getNetwork().then(setNetworkData).catch(() => {})
    getTopics().then(setTopicData).catch(() => {})
  }, [])

  const doSearch = useCallback(async (q) => {
    const trimmed = q.trim()
    if (!trimmed) {
      setSearchQuery('')
      return
    }
    
    // Edge Case: Very short query
    if (trimmed.length < 2) {
      setSearchError('Query too short. Please enter at least 2 characters.')
      return
    }
    
    setSearchError('')
    setLoading(true)
    setActiveSearch(true)
    
    try {
      const [posts, ts] = await Promise.all([searchPosts(trimmed, 50), getTimeseries(trimmed)])
      setSearchResults(posts)
      setTsData(ts.data?.length ? ts.data : defaultChartData)
      setSummary(ts.summary || '')
      setSearchQuery(trimmed)
    } catch (err) {
      setSearchError('An error occurred while fetching insights. Please try again.')
    }
    setLoading(false)
  }, [setSearchQuery])

  // expose search to parent
  useEffect(() => { onSearch(() => doSearch) }, [doSearch, onSearch])

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setTsData(defaultChartData)
    setSummary('')
    setActiveSearch(false)
  }

  return (
    <div className="animate-fade-in pb-10 space-y-4">
      {/* search bar */}
      <div className={`glass-card p-3 transition-all duration-300 ${loading ? 'shadow-[0_0_20px_rgba(59,130,246,0.3)] border-blue-500/50' : ''}`}>
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch(searchQuery)}
              placeholder="Search narratives…"
              className="w-full bg-zinc-900 border border-white/10 rounded-lg pl-3 pr-10 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
            />
            <button
              onClick={() => doSearch(searchQuery)}
              disabled={loading}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-blue-600 text-white w-7 h-7 rounded-md hover:bg-blue-500 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="M21 21l-6-6" /></svg>
              )}
            </button>
          </div>
          {activeSearch && (
            <button onClick={clearSearch} className="text-xs bg-white/5 border border-white/10 px-3 py-2 rounded-lg hover:bg-white/10 text-zinc-300 whitespace-nowrap">Clear</button>
          )}
        </div>

        {searchError && (
          <div className="mt-2 text-xs text-red-400 font-medium px-1">
            ⚠️ {searchError}
          </div>
        )}

        {/* suggestions when no active search */}
        {!activeSearch && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {suggestedQueries.map(q => (
              <button key={q} onClick={() => doSearch(q)} className="text-xs bg-white/5 border border-white/5 px-2.5 py-1 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-white/10 transition">
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Posts Over Time — summary shown directly, not hidden in details */}
      {(tsData.length > 0 || summary) && (
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-zinc-300">Posts Over Time</p>
            <span className="text-xs text-zinc-400">{tsData.length} days of data</span>
          </div>
          {tsData.length > 0 && (
            <ResponsiveContainer width="100%" height={100}>
              <LineChart data={tsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} />
                <RTooltip content={({ active, payload }) => active && payload?.[0] ? (
                  <div className="bg-zinc-800 border border-white/15 px-3 py-1 text-xs text-zinc-200">{payload[0].value} posts on {payload[0].payload.date}</div>
                ) : null} />
                <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
          {summary && (
            <div className="mt-2 text-xs text-zinc-200 border border-white/10 rounded-lg p-3 bg-white/5 leading-relaxed">{summary}</div>
          )}
        </div>
      )}

      {/* network + topics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-4">
          <NetworkGraph data={networkData} height={activeSearch ? 300 : 400} />
        </div>
        <div className="glass-card p-4">
          <TopicScatter data={topicData} height={activeSearch ? 300 : 400} onFullscreenRequest={() => onNavigate('topics')} />
        </div>
      </div>

      {/* search results */}
      {activeSearch && (
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-zinc-300">Search Results</p>
            <span className="text-xs text-zinc-400">{searchResults.length} found for "{searchQuery}"</span>
          </div>
          {searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-zinc-500 space-y-3">
              <span className="text-lg">🔍</span>
              <p className="text-sm">No results found for "{searchQuery}"</p>
              <div className="flex gap-2">
                <button onClick={() => doSearch('echo chambers')} className="text-xs bg-white/5 px-3 py-1.5 rounded-md hover:bg-white/10 transition text-zinc-300">Try "echo chambers"</button>
                <button onClick={() => doSearch('misinformation')} className="text-xs bg-white/5 px-3 py-1.5 rounded-md hover:bg-white/10 transition text-zinc-300">Try "misinformation"</button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {searchResults.slice(0, 30).map((r, i) => (
                <div key={i} className="border border-white/5 rounded-lg p-3 hover:bg-white/5 transition">
                  <p className="text-sm text-zinc-200 leading-relaxed">{r.text?.substring(0, 300)}{r.text?.length > 300 ? '…' : ''}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {r.metadata?.author && <span className="text-[10px] bg-blue-500/15 text-blue-400 px-1.5 py-0.5 rounded">@{r.metadata.author}</span>}
                    {r.metadata?.subreddit && <span className="text-[10px] bg-purple-500/15 text-purple-400 px-1.5 py-0.5 rounded">r/{r.metadata.subreddit}</span>}
                    {r.distance != null && <span className="text-[10px] text-zinc-500">similar: {(1 - r.distance).toFixed(2)}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Topics Page ─── */
function TopicsPage({ onNavigate }) {
  const [topicData, setTopicData] = useState(defaultTopics)
  
  useEffect(() => {
    getTopics().then(setTopicData).catch(() => {})
  }, [])
  
  return (
    <div className="animate-fade-in w-full h-[calc(100vh-2rem)]">
      <TopicScatter data={topicData} height="100%" alwaysFullscreen={true} onClose={() => onNavigate('dashboard')} />
    </div>
  )
}

/* ─── Router Hook ─── */
function useLocation() {
  const [path, setPath] = useState(window.location.pathname)

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const push = useCallback((newPath) => {
    window.history.pushState({}, '', newPath)
    setPath(newPath)
  }, [])

  return [path, push]
}

/* ─── App Root ─── */
export default function App() {
  const [path, navigate] = useLocation()
  const page = (path === '/' || path === '/home' || !path) ? 'landing' : path.replace('/', '')
  const setPage = (p) => navigate(p === 'landing' ? '/' : `/${p}`)

  const [collapsed, setCollapsed] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [doSearchFn, setDoSearchFn] = useState(null)

  // health check
  useEffect(() => {
    checkHealth()
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  // Ctrl+K shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        if (page !== 'dashboard') {
          setPage('dashboard')
        }
        setTimeout(() => {
          const input = document.querySelector('input[placeholder="Search narratives…"]')
          if (input) input.focus()
        }, 100)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [page])

  const handleSearchRef = useCallback((fn) => {
    setDoSearchFn(() => fn)
  }, [])

  // expose search to window for Ctrl+K
  useEffect(() => {
    if (doSearchFn) {
      window.__doSearch = doSearchFn
    }
  }, [doSearchFn])

  return (
    <div className="flex h-screen bg-[#0a0a0f] overflow-hidden">
      {/* sidebar */}
      {page !== 'landing' && (
        <Sidebar page={page} onNav={(p) => { setPage(p); if (doSearchFn) window.__doSearch = doSearchFn }} collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      )}

      {/* main */}
      <div className="flex-1 overflow-y-auto">
        <div className={`mx-auto ${page === 'landing' ? '' : (page === 'topics' ? 'w-full h-full p-0' : 'max-w-7xl p-4')}`}>
          {page === 'landing' && <LandingPage onEnter={() => setPage('dashboard')} />}
          {page === 'dashboard' && <DashboardPage searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={handleSearchRef} onNavigate={setPage} />}
          {page === 'analytics' && <AnalyticsPage />}
          {page === 'topics' && <TopicsPage onNavigate={setPage} />}
        </div>

        {/* chat button */}
        {page !== 'landing' && !chatOpen && (
          <button
            onClick={() => setChatOpen(o => !o)}
            className="fixed right-4 bottom-4 z-30 bg-blue-600 text-white rounded-full px-4 py-2.5 text-sm font-medium shadow-lg hover:bg-blue-500 transition flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 10h.01M12 10h.01M16 10h.01" /><rect x="2" y="4" width="20" height="12" rx="2" /><path d="M6 20l2-4h12" /></svg>
            Narrative AI
          </button>
        )}

        <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
      </div>
    </div>
  )
}
