import { Check, Copy } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { SubmissionHistoryItem } from '../../types/editor'
import { Badge } from '../ui/badge'
import { Card, CardContent } from '../ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { TabsContent } from '../ui/tabs'
import type { CompetingProblem } from './competingTypes'
import { formatSubmissionStatus, getSubmissionStatusClassName } from './competingUtils'

type CompetingSubmissionsPanelProps = {
  problems: CompetingProblem[]
  submissions: SubmissionHistoryItem[]
}

export function CompetingSubmissionsPanel({ problems, submissions }: CompetingSubmissionsPanelProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionHistoryItem | null>(null)
  const [copiedSubmissionId, setCopiedSubmissionId] = useState<string | null>(null)
  const isSubmissionCodeBlocked = Boolean(selectedSubmission && !selectedSubmission.canViewCode)
  const problemLabelById = useMemo(() => {
    const map = new Map<string, string>()
    problems.forEach((problem, index) => {
      map.set(problem.id, problem.shortLabel || 'P' + (index + 1))
    })
    return map
  }, [problems])
  const getSubmissionProblemLabel = (submission: SubmissionHistoryItem) =>
    problemLabelById.get(submission.problemId) ?? submission.problemLabel ?? 'Problem'
  const getSubmissionDisplayId = (submission: SubmissionHistoryItem) => submission.id.slice(-4).toUpperCase()
  const selectedSubmissionDisplayId = selectedSubmission ? getSubmissionDisplayId(selectedSubmission) : ''
  const selectedSubmissionProblemLabel = selectedSubmission ? getSubmissionProblemLabel(selectedSubmission) : 'Problem'

  useEffect(() => {
    if (!copiedSubmissionId) return

    const timeoutId = window.setTimeout(() => setCopiedSubmissionId(null), 1500)
    return () => window.clearTimeout(timeoutId)
  }, [copiedSubmissionId])

  return (
    <>
<TabsContent value="submissions" className="m-0 min-w-0 max-w-full overflow-hidden p-4 sm:p-5">
            <div className="min-w-0 w-full max-w-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.035]">
              <div className="border-b border-white/10 px-4 py-4 sm:px-5">
                <h2 className="text-lg font-semibold text-white">Submissions</h2>
                <p className="mt-1 text-sm text-slate-400">Shared submission history for this problem.</p>
              </div>
              <div className="w-0 min-w-full overflow-x-auto overscroll-x-contain [scrollbar-color:rgba(255,255,255,0.25)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/25 [&::-webkit-scrollbar-track]:bg-white/4">
                <table className="w-max min-w-full caption-bottom text-sm">
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="px-3 text-slate-400">ID</TableHead>
                      <TableHead className="px-3 text-slate-400">When</TableHead>
                      <TableHead className="px-3 text-slate-400">Who</TableHead>
                      <TableHead className="px-3 text-slate-400">Problem</TableHead>
                      <TableHead className="px-3 text-slate-400">Lang</TableHead>
                      <TableHead className="px-3 text-slate-400">Verdict</TableHead>
                      <TableHead className="px-3 text-slate-400">Time</TableHead>
                      <TableHead className="px-3 text-slate-400">Memory</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission) => (
                      <TableRow key={submission.id} className="border-white/8 hover:bg-white/[0.035]">
                        <TableCell className="px-3">
                          {submission.canViewCode ? (
                            <button
                              type="button"
                              className="font-mono text-sm font-semibold text-[#7FFFE0] underline-offset-4 hover:underline cursor-pointer"
                              onClick={() => setSelectedSubmission(submission)}
                            >
                              {getSubmissionDisplayId(submission)}
                            </button>
                          ) : (
                            <span className="font-mono text-sm font-semibold text-slate-500" title="Available after contest ends">
                              {getSubmissionDisplayId(submission)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-3 text-slate-400">
                          {new Date(submission.submittedAt).toLocaleTimeString()}
                        </TableCell>
                        <TableCell className="px-3 text-slate-200">{submission.username}</TableCell>
                        <TableCell className="px-3 text-slate-200">{getSubmissionProblemLabel(submission)}</TableCell>
                        <TableCell className="px-3 text-slate-300">{submission.language}</TableCell>
                        <TableCell className="px-3">
                          <Badge className={getSubmissionStatusClassName(submission.status)}>
                            {formatSubmissionStatus(submission.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-3 text-slate-400">{submission.runtimeMs ? `${submission.runtimeMs} ms` : '-'}</TableCell>
                        <TableCell className="whitespace-nowrap px-3 text-slate-400">{submission.memoryKb ? `${Math.round(submission.memoryKb / 1024)} MB` : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </table>
              </div>
            </div>
          </TabsContent>
<Dialog
        open={Boolean(selectedSubmission)}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedSubmission(null)
          }
        }}
      >
        <DialogContent className="max-h-[85dvh] max-w-lg gap-0 overflow-hidden rounded-2xl border border-white/10 bg-[#0B0D0F]/98 p-0 text-white" overlayClassName="backdrop-blur-sm">
          <DialogHeader className="space-y-1 border-b border-white/10 px-5 py-4 text-left">
            <DialogTitle className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-lg font-semibold text-white">
              <span>Submission</span>
              {selectedSubmissionDisplayId ? (
                <span className="font-mono text-base font-semibold text-[#7FFFE0]">
                  {selectedSubmissionDisplayId}
                </span>
              ) : null}
            </DialogTitle>
            {selectedSubmission ? (
              <p className="text-sm text-slate-400">
                {new Date(selectedSubmission.submittedAt).toLocaleString(undefined, {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            ) : null}
          </DialogHeader>

          {selectedSubmission ? (
            isSubmissionCodeBlocked ? (
              <div className="px-5 py-4">
                <Card className="border-amber-300/20 bg-amber-400/[0.06] py-0 shadow-none">
                  <CardContent className="p-5 text-sm text-amber-100">
                    Code is available after the session ends.
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="min-h-0 space-y-4 overflow-y-auto px-5 py-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/8 bg-white/[0.035] p-3">
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">User</p>
                    <p className="mt-1 text-sm font-medium text-slate-100">{selectedSubmission.username}</p>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-white/[0.035] p-3">
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">Problem</p>
                    <p className="mt-1 text-sm font-medium text-slate-100">{selectedSubmissionProblemLabel}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs capitalize text-slate-300">
                    {selectedSubmission.language}
                  </span>
                  <Badge className={getSubmissionStatusClassName(selectedSubmission.status)}>
                    {formatSubmissionStatus(selectedSubmission.status)}
                  </Badge>
                  <span className="text-sm text-slate-400">
                    {selectedSubmission.runtimeMs ? `${selectedSubmission.runtimeMs} ms` : 'Time —'}
                  </span>
                  <span className="text-sm text-slate-500">·</span>
                  <span className="text-sm text-slate-400">
                    {selectedSubmission.memoryKb ? `${Math.round(selectedSubmission.memoryKb / 1024)} MB` : 'Memory —'}
                  </span>
                </div>

                <div className="overflow-hidden rounded-xl border border-white/10 bg-black/35">
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
                    <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">Submitted code</span>
                    <button
                      type="button"
                      className="flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-400 transition hover:bg-white/[0.06] hover:text-slate-200"
                      onClick={() => {
                        void navigator.clipboard.writeText(selectedSubmission.code ?? '')
                        setCopiedSubmissionId(selectedSubmission.id)
                      }}
                      aria-label="Copy code"
                    >
                      {copiedSubmissionId === selectedSubmission.id ? (
                        <>
                          <Check size={13} className="text-emerald-400" aria-hidden="true" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} aria-hidden="true" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="max-h-[42dvh] overflow-auto p-4 font-mono text-sm leading-6 text-slate-200">
                    <code>{selectedSubmission.code}</code>
                  </pre>
                </div>
              </div>
            )
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
