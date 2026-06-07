import { Terminal } from 'lucide-react'

import type { CodeRunResult } from '../../types/editor'

type EditorOutputPanelProps = {
  error: string | null
  isRunning: boolean
  result: CodeRunResult | null
  stdin: string
  onStdinChange: (value: string) => void
}

export function EditorOutputPanel({
  error,
  isRunning,
  result,
  stdin,
  onStdinChange,
}: EditorOutputPanelProps) {
  const hasOutput = Boolean(result?.stdout || result?.stderr || result?.compileOutput || result?.output)
  const executionLabel = typeof result?.executionTimeMs === 'number'
    ? `${result.executionTimeMs}ms`
    : null
  const exitCodeLabel = result?.exitCode ?? 'none'
  const outputRepeatsCompileMessage = Boolean(result?.output && result.output === result.compileOutput)
  const outputRepeatsStderrMessage = Boolean(result?.output && result.output === result.stderr)
  const shouldShowFallbackOutput = Boolean(
    result?.output &&
      !result.stdout &&
      !result.stderr &&
      !outputRepeatsCompileMessage &&
      !outputRepeatsStderrMessage,
  )

  return (
    <section className="flex max-h-[42dvh] min-h-[180px] min-w-0 shrink-0 flex-col border-t border-white/10 bg-[#05080A]/78 backdrop-blur-xl md:min-h-[220px]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid size-8 place-items-center rounded-xl border border-white/10 bg-white/[0.045] text-[#7FFFE0]">
            <Terminal size={15} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-100">Output</p>
            <p className="truncate text-xs text-slate-500">
              {isRunning
                ? 'Executing code...'
                : result
                  ? `Status ${result.status} - Exit code ${exitCodeLabel}${executionLabel ? ` - ${executionLabel}` : ''}`
                  : 'Run code to see output here'}
            </p>
          </div>
        </div>

        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs text-slate-500 sm:min-w-[220px] md:max-w-md">
          stdin
          <input
            value={stdin}
            onChange={(event) => onStdinChange(event.target.value)}
            placeholder="Optional input"
            className="min-w-0 flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600"
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-3 font-mono text-sm sm:p-4">
        {isRunning ? (
          <p className="text-[#7FFFE0]">Running...</p>
        ) : null}

        {!isRunning && error ? (
          <pre className="whitespace-pre-wrap break-words text-red-200">{error}</pre>
        ) : null}

        {!isRunning && !error && !hasOutput ? (
          <p className="text-slate-600">Run code to see output here.</p>
        ) : null}

        {!isRunning && result?.compileOutput ? (
          <pre className="mb-3 whitespace-pre-wrap break-words text-amber-200">{result.compileOutput}</pre>
        ) : null}

        {!isRunning && result?.stderr ? (
          <pre className="mb-3 whitespace-pre-wrap break-words text-red-200">{result.stderr}</pre>
        ) : null}

        {!isRunning && result?.stdout ? (
          <pre className="whitespace-pre-wrap break-words text-emerald-100">{result.stdout}</pre>
        ) : null}

        {!isRunning && shouldShowFallbackOutput ? (
          <pre className="whitespace-pre-wrap break-words text-slate-200">{result?.output}</pre>
        ) : null}
      </div>
    </section>
  )
}
