import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './theme/ThemeProvider'
import { LocaleProvider } from './i18n'
import { AudioProvider } from './audio/AudioProvider'
import { routeConfig } from './router'
import { createQueryClient } from './data/queryClient'
import './styles/index.css'

const router = createBrowserRouter(routeConfig)
const queryClient = createQueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: true } },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <ThemeProvider>
          <AudioProvider>
            <RouterProvider router={router} />
          </AudioProvider>
        </ThemeProvider>
      </LocaleProvider>
    </QueryClientProvider>
  </StrictMode>,
)
