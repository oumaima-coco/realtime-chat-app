// ErrorBoundary — catches React rendering errors and shows a fallback UI
// instead of a blank white screen.
//
// Why is this a CLASS component instead of a function component?
// Because error boundaries are one of the very few things in React that
// REQUIRE class components. The lifecycle method `componentDidCatch` and
// the static `getDerivedStateFromError` only exist on class components.
// This is the only class component in the whole project.

import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
  };

  // Called when a child component throws during render.
  // Returns the new state — sets hasError so the next render shows fallback UI.
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  // Called after a child throws. Useful for logging to error tracking services.
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught:", error, errorInfo);
    // In production you'd send this to Sentry, LogRocket, etc.
  }

  // Reset the error state — used by the "try again" button.
  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="page page--centered">
          <div className="error-boundary">
            <h1>Something went wrong</h1>
            <p>
              The app encountered an unexpected error. Try reloading the page,
              or click below to reset.
            </p>
            {this.state.error && (
              <details className="error-boundary-details">
                <summary>Technical details</summary>
                <pre>{this.state.error.message}</pre>
              </details>
            )}
            <button onClick={this.handleReset}>Try again</button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}