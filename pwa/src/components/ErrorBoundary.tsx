import { Component, type ReactNode } from 'react';

type State = { err: Error | null };

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { err: null };

  static getDerivedStateFromError(err: Error): State {
    return { err };
  }

  componentDidCatch(err: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', err, info);
  }

  render() {
    if (!this.state.err) return this.props.children;
    return (
      <main className="min-h-dvh flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 text-center">
          <div className="text-4xl mb-3">🌿</div>
          <h1 className="text-xl font-semibold">S-a întâmplat ceva neașteptat</h1>
          <p className="mt-2 text-sm text-[color:var(--color-muted)]">
            Am primit o eroare la încărcarea aplicației. Reîncarcă pagina sau încearcă mai târziu.
          </p>
          <pre className="mt-4 text-xs text-left text-[color:var(--color-muted)] bg-[color:var(--color-surface-tinted)] border border-[color:var(--color-border)] rounded-xl p-3 overflow-auto max-h-48">
            {this.state.err.name}: {this.state.err.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="cta-primary mt-5 justify-center w-full"
          >
            Reîncarcă pagina
          </button>
        </div>
      </main>
    );
  }
}
