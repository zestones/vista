import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  variant?: 'page' | 'inline'
  resetKeys?: readonly unknown[]
}
interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidUpdate(prev: Props) {
    if (this.state.hasError && prev.resetKeys?.join() !== this.props.resetKeys?.join()) {
      this.setState({ hasError: false })
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='grid min-h-40 place-items-center p-6 text-sm text-muted-foreground'>
          Une erreur est survenue. Rechargez la page.
        </div>
      )
    }
    return this.props.children
  }
}
