import { Terminal } from 'lucide-react'

import type { CodeRunResult } from '../../types/editor'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'

type EditorOutputPanelProps = {
  error: string | null
  fillAvailableHeight?: boolean
  isRunning: boolean
  result: CodeRunResult | null
  stdin: string
  tabVariant?: 'default' | 'competing'
  onStdinChange: (value: string) => void
}

export function EditorOutputPanel({
  error,
  fillAvailableHeight = false,
  isRunning,
  result,
  stdin,
  tabVariant = 'default',
  onStdinChange,
}: EditorOutputPanelProps) {
  const hasOutput = Boolean(result?.stdout || result?.stderr || result?.compileOutput || result?.output)
  const executionLabel = typeof result?.executionTimeMs === 'number'
    ? String(result.executionTimeMs) + 'ms'
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
  const containerClassName = fillAvailableHeight
    ? 'flex h-full min-h-0 min-w-0 flex-col bg-[#05080A]/78 backdrop-blur-xl'
    : 'flex max-h-[42dvh] min-h-[180px] min-w-0 shrink-0 flex-col border-t border-white/10 bg-[#05080A]/78 backdrop-blur-xl md:min-h-[220px]'

  return (
    <section className={containerClassName}>
      <Tabs defaultValue="output" className="flex h-full min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg border border-white/10 bg-white/[0.045] text-[#7FFFE0]">
              <Terminal size={15} aria-hidden="true" />
            </span>
            <TabsList
              variant={tabVariant === 'competing' ? 'competing' : 'default'}
              className={tabVariant === 'competing' ? 'h-8' : 'h-8 bg-white/[0.035]'}
            >
              <TabsTrigger value="output" className="px-3 text-xs">
                Output
              </TabsTrigger>
              {tabVariant === 'competing' && (
                <>
                  <TabsTrigger value="testcases" className="px-3 text-xs">
                    Testcases
                  </TabsTrigger>
                  <TabsTrigger value="console" className="px-3 text-xs">
                    Console
                  </TabsTrigger>
                </>
              )}
            </TabsList>
          </div>

          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-1.5 text-xs text-slate-500 sm:min-w-[220px] md:max-w-md">
            stdin
            <input
              value={stdin}
              onChange={(event) => onStdinChange(event.target.value)}
              placeholder="Optional input"
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600"
            />
          </label>
        </div>

        <TabsContent value="output" className="m-0 min-h-0 flex-1 overflow-auto p-3 font-mono text-sm data-[state=active]:flex data-[state=active]:flex-col sm:p-4">
          <p className="mb-3 font-sans text-xs text-slate-500">
            {isRunning
              ? 'Executing code...'
              : result
                ? 'Status ' + result.status + ' - Exit code ' + exitCodeLabel + (executionLabel ? ' - ' + executionLabel : '')
                : 'Run code to see output here'}
          </p>

          {isRunning ? <p className="text-[#7FFFE0]">Running...</p> : null}
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
        </TabsContent>

        <TabsContent value="testcases" className="m-0 min-h-0 flex-1 overflow-auto p-4 data-[state=active]:block">
          <div className="rounded-lg border border-white/8 bg-white/[0.025] p-4">
            <p className="text-sm font-medium text-slate-200">Testcases are UI-only for now.</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Real testcase execution will be connected with the judge milestone.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="console" className="m-0 min-h-0 flex-1 overflow-auto p-4 font-mono text-sm text-slate-500 data-[state=active]:block">
          Runner logs will appear here in a later milestone.
        </TabsContent>
      </Tabs>
    </section>
  )
}
