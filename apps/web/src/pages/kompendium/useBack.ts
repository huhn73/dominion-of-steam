import { useLocation, useNavigate } from 'react-router'

/** „Zurück“: one step back in the history, or `fallback` when the page was opened directly */
export function useBack(fallback: string) {
  const navigate = useNavigate()
  const location = useLocation()
  return () => (location.key !== 'default' ? navigate(-1) : navigate(fallback))
}
