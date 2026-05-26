import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="container py-12">
          <h1 className="text-2xl font-bold text-destructive">문제가 발생했습니다</h1>
          <pre className="mt-4 overflow-auto rounded-md bg-muted p-4 text-sm">
            {this.state.error?.message}
          </pre>
          <button
            onClick={this.reset}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            다시 시도
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
