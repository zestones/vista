import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { MotionConfig } from 'motion/react'
import { Toaster } from 'react-hot-toast'
import App from '@/App'
import { AuthProvider } from '@/providers/auth.provider'
import { ErrorBoundary } from '@/components/feedback'
import { queryClient } from '@/lib/config/query-client.config'
import '@/lib/i18n/i18n'
import '@/styles/index.css'

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MotionConfig reducedMotion='user'>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
            <Toaster position='bottom-right' />
          </MotionConfig>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
)
