import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    const { error } = this.state;

    if (error) {
      return (
        <div className="flex h-dvh w-screen flex-col items-center justify-center gap-5 bg-background px-6 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-danger/10 text-danger">
            <AlertTriangle className="size-7" />
          </div>

          <div className="space-y-1">
            <h1 className="text-lg font-semibold text-foreground">
              Something went wrong
            </h1>
            <p className="text-sm text-muted-foreground">
              {error.message || "An unexpected error occurred."}
            </p>
          </div>

          <button
            onClick={() => (window.location.href = "/")}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-semibold text-primary-foreground"
          >
            Back to Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
