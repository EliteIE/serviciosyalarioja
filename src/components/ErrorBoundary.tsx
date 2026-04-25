import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  private rejectionHandler: ((event: PromiseRejectionEvent) => void) | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidMount() {
    this.rejectionHandler = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection caught by ErrorBoundary:", event.reason);
    };
    window.addEventListener("unhandledrejection", this.rejectionHandler);
  }

  componentWillUnmount() {
    if (this.rejectionHandler) {
      window.removeEventListener("unhandledrejection", this.rejectionHandler);
    }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="text-center max-w-md space-y-4">
            <h1 className="text-2xl font-bold text-foreground">Algo salió mal</h1>
            <p className="text-muted-foreground">
              Ocurrió un error inesperado. Podés intentar de nuevo o recargar la página.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center justify-center rounded-[16px] bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Reintentar
              </button>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center rounded-[16px] border border-border bg-background px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Recargar página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
