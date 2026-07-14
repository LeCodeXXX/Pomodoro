/**
 * Returns the Authorization header object for authenticated API calls.
 * Reads the JWT token stored in localStorage.
 */
export const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem('pomodoroToken')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const storeToken = (token: string): void => {
  localStorage.setItem('pomodoroToken', token)
}

export const clearToken = (): void => {
  localStorage.removeItem('pomodoroToken')
}
