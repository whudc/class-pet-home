const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const token = localStorage.getItem('class-pet-home:token')
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  }

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || '请求失败')
  }

  return data
}

// 认证相关 API
export const authApi = {
  async login(username: string, password: string) {
    return request<{ ok: boolean; token: string; user: { id: string; username: string; createdAt: number } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
  },

  async register(username: string, password: string) {
    return request<{ ok: boolean; token: string; user: { id: string; username: string; createdAt: number } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
  },

  async getMe() {
    return request<{ ok: boolean; user: { id: string; username: string } }>('/auth/me')
  },
}

// 数据相关 API
export const dataApi = {
  async getData() {
    return request<{ ok: boolean; data: any; version: number; updatedAt: number }>('/data/')
  },

  async saveData(data: any, version?: number) {
    return request<{ ok: boolean; version: number; updatedAt: number }>('/data/save', {
      method: 'POST',
      body: JSON.stringify({ data, version }),
    })
  },

  async syncData(data: any, clientVersion: number, deviceId?: string) {
    return request<{ ok: boolean; data: any; version: number; synced: boolean; hasNewer?: boolean }>('/data/sync', {
      method: 'POST',
      body: JSON.stringify({ data, clientVersion, deviceId }),
    })
  },
}

// API 健康检查
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`)
    return response.ok
  } catch {
    return false
  }
}
