import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { sendMessage } from '../api'

/**
 * Lightweight markdown renderer for AI responses.
 * Handles: **bold**, *italic*, `inline code`, ```code blocks```,
 * numbered/bullet lists, ### headers, --- dividers, paragraphs
 */
function MarkdownText({ text }) {
  const segments = useMemo(() => {
    if (!text) return []

    // Split by code blocks first to protect them
    const parts = text.split(/(```[\s\S]*?```)/g)
    const result = []

    parts.forEach((part, pi) => {
      if (part.startsWith('```')) {
        // code block
        const lines = part.replace(/^```[a-z]*\n?/i, '').replace(/```$/, '').trim()
        result.push({ type: 'code', content: lines, key: `code-${pi}` })
        return
      }

      // Process inline within non-code segments
      const lines = part.split('\n')
      let i = 0
      while (i < lines.length) {
        const line = lines[i]

        // empty line → paragraph break
        if (line.trim() === '') {
          result.push({ type: 'break', key: `br-${pi}-${i}` })
          i++
          continue
        }

        // headers
        const headerMatch = line.match(/^(#{1,6})\s+(.*)/)
        if (headerMatch) {
          result.push({ type: 'header', level: headerMatch[1].length, content: headerMatch[2], key: `h-${pi}-${i}` })
          i++
          continue
        }

        // horizontal rule
        if (/^---+$/.test(line.trim())) {
          result.push({ type: 'divider', key: `hr-${pi}-${i}` })
          i++
          continue
        }

        // bullet list item
        if (/^[\s]*[-*+]\s+/.test(line)) {
          const items = []
          let j = i
          while (j < lines.length && /^[\s]*[-*+]\s+/.test(lines[j])) {
            items.push(lines[j].replace(/^[\s]*[-*+]\s+/, ''))
            j++
          }
          result.push({ type: 'list', items, key: `ul-${pi}-${i}` })
          i = j
          continue
        }

        // numbered list item
        if (/^[\s]*\d+\.\s+/.test(line)) {
          const items = []
          let j = i
          while (j < lines.length && /^[\s]*\d+\.\s+/.test(lines[j])) {
            items.push(lines[j].replace(/^[\s]*\d+\.\s+/, ''))
            j++
          }
          result.push({ type: 'olist', items, key: `ol-${pi}-${i}` })
          i = j
          continue
        }

        // regular paragraph line
        const paraLines = []
        while (i < lines.length && lines[i].trim() !== '' && !/^#{1,6}\s/.test(lines[i]) && !/^---+$/.test(lines[i].trim()) && !/^[\s]*[-*+]\s+/.test(lines[i]) && !/^[\s]*\d+\.\s+/.test(lines[i])) {
          paraLines.push(lines[i])
          i++
        }
        if (paraLines.length) {
          result.push({ type: 'inline', content: paraLines.join(' '), key: `p-${pi}-${i}` })
        }
      }
    })

    return result
  }, [text])

  if (!segments.length) return null

  return (
    <>
      {segments.map(seg => {
        if (seg.type === 'code') {
          return <pre key={seg.key} className="bg-zinc-900 border border-white/10 rounded-lg p-2.5 my-2 text-xs text-zinc-200 font-mono overflow-x-auto whitespace-pre-wrap">{seg.content}</pre>
        }
        if (seg.type === 'header') {
          const size = seg.level === 1 ? 'text-lg' : seg.level === 2 ? 'text-base' : 'text-sm'
          return <div key={seg.key} className={`${size} font-semibold text-zinc-100 my-1`}>{renderInline(seg.content)}</div>
        }
        if (seg.type === 'divider') {
          return <hr key={seg.key} className="border-white/10 my-2" />
        }
        if (seg.type === 'list') {
          return (
            <ul key={seg.key} className="list-disc list-outside ml-4 my-1.5 space-y-0.5">
              {seg.items.map((item, li) => (
                <li key={li} className="text-sm text-zinc-300">{renderInline(item)}</li>
              ))}
            </ul>
          )
        }
        if (seg.type === 'olist') {
          return (
            <ol key={seg.key} className="list-decimal list-outside ml-4 my-1.5 space-y-0.5">
              {seg.items.map((item, li) => (
                <li key={li} className="text-sm text-zinc-300">{renderInline(item)}</li>
              ))}
            </ol>
          )
        }
        if (seg.type === 'break') {
          return <div key={seg.key} className="h-1.5" />
        }
        // inline text
        return <span key={seg.key} className="text-sm">{renderInline(seg.content)}</span>
      })}
    </>
  )
}

/** render inline markdown: **bold**, *italic*, `code` */
function renderInline(text) {
  if (!text) return null
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
  return parts.map((p, i) => {
    if (!p) return null
    if (p.startsWith('**') && p.endsWith('**')) {
      return <strong key={i} className="text-white font-semibold">{p.slice(2, -2)}</strong>
    }
    if (p.startsWith('*') && p.endsWith('*')) {
      return <em key={i} className="text-zinc-200 italic">{p.slice(1, -1)}</em>
    }
    if (p.startsWith('`') && p.endsWith('`')) {
      return <code key={i} className="bg-zinc-800 text-blue-300 px-1 py-0.5 rounded text-xs font-mono">{p.slice(1, -1)}</code>
    }
    return <span key={i}>{p}</span>
  })
}

const SummaryRenderer = MarkdownText
export { SummaryRenderer }

export default function ChatPanel({ open, onClose }) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const endRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('chat_history')
      if (saved) setMessages(JSON.parse(saved))
    } catch { }
  }, [])

  useEffect(() => {
    if (messages.length > 0) {
      try { localStorage.setItem('chat_history', JSON.stringify(messages)) } catch { }
    }
  }, [messages])

  const send = async (text) => {
    const q = text || input.trim()
    if (!q || loading) return
    const history = messages.map(m => ({ role: m.role, content: m.content }))
    setLoading(true)
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setInput('')
    try {
      const res = await sendMessage(q, history)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.reply || '',
        sources: res.sources || [],
        suggested_queries: res.suggested_queries || [],
      }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }])
    } finally {
      setLoading(false)
    }
  }

  const clearHistory = useCallback(() => {
    setMessages([])
    localStorage.removeItem('chat_history')
  }, [])

  if (!open) return null

  return (
    <div className={`fixed transition-all duration-300 ${fullscreen ? 'inset-0 z-50' : 'right-4 bottom-4 w-96 max-w-[calc(100vw-2rem)]'} bg-zinc-950 border border-white/5 flex flex-col shadow-2xl`} style={{ height: fullscreen ? '100vh' : 'min(580px, 65vh)' }}>
      {/* header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-zinc-950/95 backdrop-blur flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-sm font-semibold text-zinc-200">Narrative AI</span>
          <span className="text-[10px] text-zinc-500">· {messages.length}</span>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button onClick={clearHistory} className="text-zinc-500 hover:text-zinc-300 text-xs px-1.5 py-0.5">Clear</button>
          )}
          <button onClick={() => setFullscreen(f => !f)} className="text-zinc-500 hover:text-zinc-300" title={fullscreen ? 'Minimize' : 'Fullscreen'}>
            {fullscreen ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" /></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" /></svg>
            )}
          </button>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-lg leading-none ml-1">&times;</button>
        </div>
      </div>

      {/* messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-50">
              <path d="M8 10h.01M12 10h.01M16 10h.01" /><rect x="2" y="4" width="20" height="12" rx="2" /><path d="M6 20l2-4h12" />
            </svg>
            <p className="text-sm">Ask about your narrative data</p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <div className={`inline-block max-w-[90%] rounded-2xl px-4 py-2.5 ${m.role === 'user' ? 'bg-blue-600/20 border border-blue-500/20 text-blue-100 text-sm' : 'bg-white/5 border border-white/5 text-zinc-300'}`} style={{ lineHeight: '1.6' }}>
              {m.role === 'user' ? m.content : <MarkdownText text={m.content} />}
            </div>
            {m.sources?.length > 0 && (
              <div className="mt-1 flex items-center gap-1 flex-wrap">
                <span className="text-[10px] text-zinc-500">Sources:</span>
                {m.sources.slice(0, 5).map((s, j) => (
                  <span key={j} className="text-[10px] text-violet-400 bg-violet-500/10 border border-violet-500/15 px-1.5 py-0.5 rounded">@{s.author || 'anon'} · r/{s.subreddit}</span>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-1.5 items-center px-2">
            <span className="w-2 h-2 rounded-full bg-zinc-600 animate-pulse" />
            <span className="w-2 h-2 rounded-full bg-zinc-600 animate-pulse" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-zinc-600 animate-pulse" style={{ animationDelay: '300ms' }} />
            <span className="text-xs text-zinc-600 ml-2">Thinking…</span>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* suggested queries */}
      {messages.length > 0 && messages[messages.length - 1]?.suggested_queries?.length > 0 && (
        <div className="px-3 pb-2 flex flex-wrap gap-1.5">
          {messages[messages.length - 1].suggested_queries.map((q, i) => (
            <button key={i} onClick={() => send(q)} className="text-xs bg-zinc-900 text-zinc-400 border border-white/5 rounded-full px-2.5 py-1.5 hover:bg-zinc-800 hover:text-zinc-200 transition">
              {q}
            </button>
          ))}
        </div>
      )}

      {/* input */}
      <div className="flex gap-2 px-3 py-2.5 border-t border-white/5 bg-zinc-950/90 flex-shrink-0">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && send()}
          placeholder="Ask a question…"
          className="flex-1 bg-zinc-900 text-zinc-300 text-sm px-3 py-2.5 rounded-lg border border-white/5 focus:outline-none focus:border-blue-500/50 placeholder-zinc-600"
          disabled={loading}
        />
        <button
          onClick={() => !loading && send()}
          disabled={loading || !input.trim()}
          className="bg-blue-600 text-white text-sm px-4 py-2.5 rounded-lg hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {loading ? (
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : '↵'}
        </button>
      </div>
    </div>
  )
}
