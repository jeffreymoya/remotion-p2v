interface WorkflowErrorProps {
  error: string;
  onReset: () => void;
}

export function WorkflowError({ error, onReset }: WorkflowErrorProps) {
  return (
    <div className="rounded-lg border border-rose-800 bg-rose-950/50 p-6">
      <h3 className="text-lg font-semibold text-rose-200">Workflow State Error</h3>
      <p className="mt-2 text-sm text-rose-300">{error}</p>
      <button
        onClick={onReset}
        className="mt-4 rounded bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow hover:-translate-y-0.5"
      >
        Reset &amp; Start Fresh
      </button>
    </div>
  );
}
