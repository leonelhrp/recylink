import React from 'react';

interface State {
  hasError: boolean;
  error: Error | null;
}

export class EventsErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Events module error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const message =
        this.state.error?.message && this.state.error.message !== 'Script error.'
          ? this.state.error.message
          : 'The Events module failed to load. Make sure the API is running at http://localhost:3000 and try again.';
      return (
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-muted-foreground mb-6">{message}</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="inline-flex items-center justify-center h-10 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
