"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-8">
      <div className="panel max-w-lg rounded-lg p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-rust/10 p-2 text-rust">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="text-lg font-semibold">Workspace error</h1>
        </div>
        <p className="mt-3 text-sm leading-6 text-ink/65">{error.message || "The workspace could not load."}</p>
        <button className="button-primary mt-5" onClick={reset}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Retry
        </button>
      </div>
    </div>
  );
}
