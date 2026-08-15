import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('Unhandled error in app tree:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-tertiary px-4">
          <div className="w-full max-w-sm text-center">
            <p className="text-danger font-semibold mb-2">Something went wrong</p>
            <p className="text-disabled text-sm mb-4">
              {this.state.error.message || 'The app hit an unexpected error.'}
            </p>
            <button
              onClick={() => {
                this.setState({ error: null })
                window.location.reload()
              }}
              className="bg-primary hover:bg-primary-hover text-secondary font-semibold px-4 py-2 rounded-lg text-sm"
            >
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
