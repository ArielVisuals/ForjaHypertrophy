import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  label?: string;
  compact?: boolean;
}

interface State {
  hasError: boolean;
  errorMsg: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMsg: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary/${this.props.label ?? "unknown"}]`, error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.compact) {
      return (
        <div className="px-4 py-3 rounded-2xl bg-red-500/5 border border-red-500/15 flex items-center justify-between gap-4">
          <p className="text-[9px] font-black text-red-400/60 uppercase tracking-widest">
            {this.props.label ?? "Módulo"} — error al cargar
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="text-[8px] font-black text-white/30 uppercase tracking-widest hover:text-white/60 transition-colors"
          >
            Reintentar
          </button>
        </div>
      );
    }

    return (
      <div className="p-8 rounded-[2.5rem] bg-[#0A0A0B] border border-red-500/15 text-center space-y-4">
        <p className="text-[10px] font-black text-red-400/50 uppercase tracking-[0.3em]">
          {this.props.label ?? "MÓDULO"} INACCESIBLE
        </p>
        <p className="text-[9px] font-bold text-white/15 uppercase tracking-widest">
          Ocurrió un error al renderizar este componente
        </p>
        {this.state.errorMsg && (
          <p className="text-[10px] text-red-400 font-mono text-left p-4 bg-red-950/20 rounded-xl overflow-auto">
            {this.state.errorMsg}
          </p>
        )}
        <button
          onClick={() => this.setState({ hasError: false, errorMsg: "" })}
          className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black text-white/40 uppercase tracking-widest hover:text-white hover:border-white/20 transition-all"
        >
          Reintentar
        </button>
      </div>
    );
  }
}
