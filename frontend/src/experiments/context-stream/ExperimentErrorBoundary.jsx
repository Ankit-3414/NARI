import React from 'react';
import { AlertTriangle } from 'lucide-react';

class ExperimentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ContextStreamExperiment]', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-danger/20 bg-danger/5 p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-danger/20 bg-danger/10 text-danger">
          <AlertTriangle size={28} />
        </div>
        <h1 className="mb-2 text-2xl font-black uppercase tracking-tighter text-white">
          Context Lab render failed
        </h1>
        <p className="mb-4 text-sm text-secondary">
          The production dashboard is untouched. This sandbox caught an experiment-only error instead of leaving a white page.
        </p>
        <pre className="overflow-x-auto rounded-xl border border-white/5 bg-background p-4 text-left text-xs text-danger/80">
          {this.state.error?.message || 'Unknown experiment error'}
        </pre>
      </div>
    );
  }
}

export default ExperimentErrorBoundary;
