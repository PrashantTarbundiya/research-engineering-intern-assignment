import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const api = axios.create({ baseURL: BASE, timeout: 35000 })

let _health = false
export const checkHealth = async () => {
  try { await api.get('/', { timeout: 3000 }); _health = true; return true }
  catch { _health = false; return false }
}
export const isHealthy = () => _health

export const searchPosts = async (query, limit = 50) => {
  const res = await api.post('/api/search', { query, limit })
  return { results: res.data.results || [], lang: res.data.detected_lang, lang_warning: res.data.lang_warning }
}

export const getTimeseries = async (query, limit = 500) => {
  const res = await api.post('/api/timeseries', { query, limit })
  return res.data
}

export const getNetwork = async () => {
  const res = await api.get('/api/network')
  return res.data.elements || { nodes: [], edges: [] }
}

export const getTopics = async () => {
  const res = await api.get('/api/topics')
  return res.data
}

export const sendMessage = async (message, history = []) => {
  const res = await api.post('/api/chat', { message, history })
  return res.data
}

export default api