export class ApiError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const getApiUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_APIURL
  if (!apiUrl) {
    throw new ApiError('No existe NEXT_PUBLIC_APIURL en el .env')
  }
  return apiUrl
}

const buildApiUrl = (path: string) => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  const apiUrl = getApiUrl()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${apiUrl}${normalizedPath}`
}

export const apiFetch = async (path: string, init?: RequestInit) => {
  const url = buildApiUrl(path)
  return fetch(url, init)
}

export const apiFetchJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await apiFetch(path, init)
  if (!response.ok) {
    throw new ApiError(`Fallo el fetch (${response.status})`, response.status)
  }
  return response.json()
}

export const getApiErrorMessage = (error: unknown, fallback = 'Error al cargar datos') => {
  if (error instanceof ApiError) {
    if (error.message.includes('NEXT_PUBLIC_APIURL')) {
      return error.message
    }
    if (error.status === 401) return 'No autorizado'
    if (error.status === 403) return 'Acceso denegado'
    if (error.status === 404) return 'No se encontro el recurso'
    if (error.status && error.status >= 500) return 'Error del servidor'
    return fallback
  }
  if (error instanceof Error) return error.message
  return fallback
}
