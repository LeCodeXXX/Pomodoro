const configuredBackendUrl = import.meta.env.BACKEND_URL?.trim()

export const apiBaseUrl = (configuredBackendUrl || 'http://localhost:3000').replace(/\/$/, '')

export const apiUrl = (path: string): string => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${apiBaseUrl}/${path.replace(/^\//, '')}`;
}