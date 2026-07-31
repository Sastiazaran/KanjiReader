import axios from 'axios'

/**
 * Cliente HTTP para la Fase 2 (auth y sync). El MVP no lo usa aún.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  headers: { 'Content-Type': 'application/json' },
})
