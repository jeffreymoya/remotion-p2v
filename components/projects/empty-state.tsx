import Link from "next/link";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 px-10 py-16 text-center text-slate-300">
      <p className="text-lg font-semibold text-white">No projects yet</p>
      <p className="mt-1 text-sm text-slate-400">
        Start by creating a project. You can set the aspect ratio now and add a
        topic later.
      </p>
      <Link
        href="/projects/new"
        className="mt-6 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:-translate-y-0.5"
      >
        New Project
      </Link>
    </div>
  );
}
