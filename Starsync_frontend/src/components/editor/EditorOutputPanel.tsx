import { Terminal } from 'lucide-react'

import type { CodeRunResult, RoomProblemRunResult, RoomProblemSubmitResult } from '../../types/editor'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'

type EditorOutputPanelProps = {
  error: string | null
  fillAvailableHeight?: boolean
  isRunning: boolean
  result: CodeRunResult | null
  testcaseResult?: RoomProblemRunResult | null
  submitResult?: RoomProblemSubmitResult | null
  stdin: string
  tabVariant?: 'default' | 'competing'
  onStdinChange: (value: string) => void
}

export function EditorOutputPanel({
  error,
  fillAvailableHeight = false,
  isRunning,
  result,
  testcaseResult = null,
  submitResult = null,
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
  const isCompetingPanel = tabVariant === 'competing'
  const submitDiagnostic = submitResult && [
    'COMPILATION_ERROR',
    'RUNTIME_ERROR',
    'TIME_LIMIT_EXCEEDED',
    'INTERNAL_ERROR',
  ].includes(submitResult.status)
    ? {
      title: submitResult.status === 'COMPILATION_ERROR'
        ? 'Compile Error'
        : submitResult.status === 'RUNTIME_ERROR'
          ? 'Runtime Error'
          : submitResult.status === 'TIME_LIMIT_EXCEEDED'
            ? 'Time Limit Exceeded'
            : 'Execution Error',
      message: submitResult.results.find((testcase) => testcase.error)?.error || 'Code execution failed.',
    }
    : null
  const runFailure = testcaseResult?.results.find((testcase) => testcase.error)
  const runDiagnostic = runFailure
    ? {
      title: /compile|syntax|parse|expected|undeclared|undefined|not declared|cannot find|invalid/i.test(runFailure.error || '')
        ? 'Compile Error'
        : 'Runtime Error',
      message: runFailure.error || 'Code execution failed.',
    }
    : null
  const containerClassName = fillAvailableHeight
    ? 'flex h-full min-h-0 min-w-0 flex-col bg-[#05080A]/78 backdrop-blur-xl'
    : 'flex max-h-[42dvh] min-h-[180px] min-w-0 shrink-0 flex-col border-t border-white/10 bg-[#05080A]/78 backdrop-blur-xl md:min-h-[220px]'

  return (
    <section className={containerClassName}>
      <Tabs defaultValue={isCompetingPanel ? 'testcases' : 'output'} className="flex h-full min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg border border-white/10 bg-white/[0.045] text-[#7FFFE0]">
              <Terminal size={15} aria-hidden="true" />
            </span>
            {isCompetingPanel ? (
              <div className="flex h-8 items-center rounded-md border border-white/10 bg-white/[0.035] px-3 text-xs font-semibold text-white">
                Test Results
              </div>
            ) : (
              <TabsList variant="default" className="h-8 bg-white/[0.035]">
                <TabsTrigger value="output" className="px-3 text-xs">
                  Output
                </TabsTrigger>
              </TabsList>
            )}
          </div>

          {!isCompetingPanel ? (
            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-1.5 text-xs text-slate-500 sm:min-w-[220px] md:max-w-md">
              stdin
              <input
                value={stdin}
                onChange={(event) => onStdinChange(event.target.value)}
                placeholder="Optional input"
                className="min-w-0 flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600"
              />
            </label>
          ) : null}
        </div>

        {!isCompetingPanel ? (
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
            <pre className="whitespace-pre-wrap wrap-break-word text-red-200">{error}</pre>
          ) : null}
          {!isRunning && !error && !hasOutput ? (
            <p className="text-slate-600">Run code to see output here.</p>
          ) : null}
          {!isRunning && result?.compileOutput ? (
            <pre className="mb-3 whitespace-pre-wrap wrap-break-word text-amber-200">{result.compileOutput}</pre>
          ) : null}
          {!isRunning && result?.stderr ? (
            <pre className="mb-3 whitespace-pre-wrap wrap-break-word text-red-200">{result.stderr}</pre>
          ) : null}
          {!isRunning && result?.stdout ? (
            <pre className="whitespace-pre-wrap wrap-break-word text-emerald-100">{result.stdout}</pre>
          ) : null}
          {!isRunning && shouldShowFallbackOutput ? (
            <pre className="whitespace-pre-wrap wrap-break-word text-slate-200">{result?.output}</pre>
          ) : null}
        </TabsContent>
        ) : null}

        <TabsContent value="testcases" className="m-0 min-h-0 flex-1 overflow-auto p-4 data-[state=active]:block">
          {isRunning ? (
            <div className="rounded-lg border border-[#57F1DB]/20 bg-[#57F1DB]/[0.06] p-4 text-sm text-[#BFFCF0]">
              Running testcases...
            </div>
          ) : error ? (
            <pre className="whitespace-pre-wrap wrap-break-word rounded-lg border border-red-300/20 bg-red-400/[0.06] p-4 text-sm text-red-100">{error}</pre>
          ) : submitDiagnostic ? (
            <div className="rounded-lg border border-red-300/20 bg-red-400/[0.06] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-red-100">{submitDiagnostic.title}</p>
                <span className="rounded-md border border-red-300/20 bg-red-400/8 px-2 py-0.5 text-xs font-semibold text-red-100">
                  {submitResult?.passedCount ?? 0} / {submitResult?.totalCount ?? 0} passed
                </span>
              </div>
              <pre className="whitespace-pre-wrap wrap-break-word rounded-md border border-red-300/20 bg-black/25 p-3 font-mono text-xs text-red-100">
                {submitDiagnostic.message}
              </pre>
            </div>
          ) : submitResult ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/8 bg-white/[0.025] p-3">
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    Submission status: <span className={
                      submitResult.status === 'ACCEPTED' ? 'text-emerald-400' : 'text-[#ef4743]'
                    }>{submitResult.status}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {submitResult.passedCount} / {submitResult.totalCount} passed
                  </p>
                </div>

              </div>

              {submitResult.results.map((testcase) => (
                <div
                  key={testcase.testcaseId}
                  className={[
                    'rounded-lg border p-3',
                    testcase.passed
                      ? 'border-emerald-300/20 bg-emerald-400/[0.06]'
                      : 'border-[#ef4743]/20 bg-[#ef4743]/[0.06]',
                  ].join(' ')}
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-100">
                      Testcase {testcase.order} {testcase.isHidden ? '(Hidden)' : ''}
                    </p>
                    <span className={testcase.passed ? 'text-xs font-semibold text-emerald-200' : 'text-xs font-semibold text-[#ef4743]'}>
                      {testcase.passed ? 'Passed' : 'Failed'}
                    </span>
                  </div>

                  {testcase.isHidden ? null : (
                    <>
                      <div className="grid gap-3 text-xs md:grid-cols-3">
                        <div className="min-w-0">
                          <p className="mb-1 font-sans uppercase tracking-[0.14em] text-slate-500">Input</p>
                          <pre className="min-h-16 whitespace-pre-wrap wrap-break-word rounded-md border border-white/8 bg-black/25 p-2 text-slate-200">{testcase.input}</pre>
                        </div>
                        <div className="min-w-0">
                          <p className="mb-1 font-sans uppercase tracking-[0.14em] text-slate-500">Expected</p>
                          <pre className="min-h-16 whitespace-pre-wrap wrap-break-word rounded-md border border-white/8 bg-black/25 p-2 text-slate-200">{testcase.expectedOutput}</pre>
                        </div>
                        <div className="min-w-0">
                          <p className="mb-1 font-sans uppercase tracking-[0.14em] text-slate-500">Actual</p>
                          <pre className="min-h-16 whitespace-pre-wrap wrap-break-word rounded-md border border-white/8 bg-black/25 p-2 text-slate-200">{testcase.actualOutput || '(no output)'}</pre>
                        </div>
                      </div>

                      {testcase.error ? (
                        <pre className="mt-3 whitespace-pre-wrap wrap-break-word rounded-md border border-red-300/20 bg-black/25 p-2 text-xs text-red-100">{testcase.error}</pre>
                      ) : null}
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : runDiagnostic ? (
            <div className="rounded-lg border border-red-300/20 bg-red-400/[0.06] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-red-100">{runDiagnostic.title}</p>
                <span className="rounded-md border border-red-300/20 bg-red-400/8 px-2 py-0.5 text-xs font-semibold text-red-100">
                  {testcaseResult?.passedCount ?? 0} / {testcaseResult?.totalCount ?? 0} passed
                </span>
              </div>
              <pre className="whitespace-pre-wrap wrap-break-word rounded-md border border-red-300/20 bg-black/25 p-3 font-mono text-xs text-red-100">
                {runDiagnostic.message}
              </pre>
            </div>
          ) : testcaseResult ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/8 bg-white/[0.025] p-3">
                <p className="text-sm font-semibold text-slate-100">
                  {testcaseResult.passedCount} / {testcaseResult.totalCount} passed
                </p>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Visible testcases only</p>
              </div>

              {testcaseResult.results.map((testcase) => (
                <div
                  key={testcase.testcaseId}
                  className={[
                    'rounded-lg border p-3',
                    testcase.passed
                      ? 'border-emerald-300/20 bg-emerald-400/[0.06]'
                      : 'border-[#ef4743]/20 bg-[#ef4743]/[0.06]',
                  ].join(' ')}
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-100">Testcase {testcase.order}</p>
                    <span className={testcase.passed ? 'text-xs font-semibold text-emerald-200' : 'text-xs font-semibold text-[#ef4743]'}>
                      {testcase.passed ? 'Passed' : 'Failed'}
                    </span>
                  </div>

                  <div className="grid gap-3 text-xs md:grid-cols-3">
                    <div className="min-w-0">
                      <p className="mb-1 font-sans uppercase tracking-[0.14em] text-slate-500">Input</p>
                      <pre className="min-h-16 whitespace-pre-wrap wrap-break-word rounded-md border border-white/8 bg-black/25 p-2 text-slate-200">{testcase.input}</pre>
                    </div>
                    <div className="min-w-0">
                      <p className="mb-1 font-sans uppercase tracking-[0.14em] text-slate-500">Expected</p>
                      <pre className="min-h-16 whitespace-pre-wrap wrap-break-word rounded-md border border-white/8 bg-black/25 p-2 text-slate-200">{testcase.expectedOutput}</pre>
                    </div>
                    <div className="min-w-0">
                      <p className="mb-1 font-sans uppercase tracking-[0.14em] text-slate-500">Actual</p>
                      <pre className="min-h-16 whitespace-pre-wrap wrap-break-word rounded-md border border-white/8 bg-black/25 p-2 text-slate-200">{testcase.actualOutput || '(no output)'}</pre>
                    </div>
                  </div>

                  {testcase.error ? (
                    <pre className="mt-3 whitespace-pre-wrap wrap-break-word rounded-md border border-red-300/20 bg-black/25 p-2 text-xs text-red-100">{testcase.error}</pre>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-white/8 bg-white/[0.025] p-4">
              <p className="text-sm font-normal leading-6 text-slate-300">Run to execute testcases.</p>
            </div>
          )}
        </TabsContent>


      </Tabs>
    </section>
  )
}
