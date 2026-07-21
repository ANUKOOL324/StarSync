import { BookOpen, ChevronLeft, ChevronRight, FileText, ScrollText, Trophy } from 'lucide-react'
import { useState } from 'react'
import type { SubmissionHistoryItem } from '../../types/editor'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion'
import { Badge } from '../ui/badge'
import { Button } from '../ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { ProblemPanelRail } from './CompetingPanelRails'
import { CompetingSubmissionsPanel } from './CompetingSubmissionsPanel'
import type { CompetingProblem, ProblemPanelTab } from './competingTypes'
import { difficultyClassName, formatDifficulty } from './competingUtils'

export function CompetingProblemPanel({
  problems,
  isLoadingProblems = false,
  problemLoadError = null,
  activeTab: controlledActiveTab,
  onActiveTabChange,
  isCollapsed = false,
  onExpandRequest,
  selectedProblemId,
  onSelectedProblemIdChange,
  submissions,
}: {
  problems: CompetingProblem[]
  isLoadingProblems?: boolean
  problemLoadError?: string | null
  activeTab?: ProblemPanelTab
  onActiveTabChange?: (tab: ProblemPanelTab) => void
  isCollapsed?: boolean
  onExpandRequest?: (tab: ProblemPanelTab) => void
  selectedProblemId: string | null
  onSelectedProblemIdChange: (problemId: string) => void
  submissions: SubmissionHistoryItem[]
}) {
  const [internalActiveTab, setInternalActiveTab] = useState<ProblemPanelTab>('problem')
  const activeTab = controlledActiveTab ?? internalActiveTab


  const setActiveTab = (nextTab: ProblemPanelTab) => {
    if (onActiveTabChange) {
      onActiveTabChange(nextTab)
      return
    }

    setInternalActiveTab(nextTab)
  }

  const storedSelectedProblemIndex = problems.findIndex((problem) => problem.id === selectedProblemId)
  const selectedProblemIndex = storedSelectedProblemIndex >= 0 ? storedSelectedProblemIndex : problems.length > 0 ? 0 : -1
  const selectedProblem = selectedProblemIndex >= 0 ? problems[selectedProblemIndex] : null
  const currentProblemNumber = selectedProblemIndex >= 0 ? selectedProblemIndex + 1 : 0
  const selectProblemAtIndex = (nextIndex: number) => {
    const nextProblem = problems[nextIndex]

    if (nextProblem) {
      onSelectedProblemIdChange(nextProblem.id)
    }
  }

  const handleRailSelect = (tab: ProblemPanelTab) => {
    setActiveTab(tab)
    onExpandRequest?.(tab)
  }

  const panelTabs = (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as ProblemPanelTab)}
      className="flex min-h-0 min-w-0 flex-1 flex-col gap-0 overflow-hidden"
    >
      <div className="min-w-0 shrink-0 border-b border-white/10 bg-black/20 px-2 py-2">
        <TabsList variant="competing" className="grid h-9 w-full min-w-0 grid-cols-3 gap-0.5">
          <TabsTrigger
            value="problem"
            title="Problem"
            className="flex !min-w-0 !flex-1 min-w-0 w-full items-center justify-center gap-1 overflow-hidden px-1.5 text-xs border border-transparent data-[state=active]:!border-blue-500/40 data-[state=active]:!bg-blue-500/12 data-[state=active]:!text-white data-[state=active]:shadow-[0_0_10px_rgba(59,130,246,0.2)] transition-all duration-150"
          >
            <FileText size={14} className="shrink-0" aria-hidden="true" />
            <span className="hidden truncate @[17rem]:inline">Problem</span>
          </TabsTrigger>
          <TabsTrigger
            value="submissions"
            title="Submissions"
            className="flex !min-w-0 !flex-1 min-w-0 w-full items-center justify-center gap-1 overflow-hidden px-1.5 text-xs border border-transparent data-[state=active]:!border-emerald-500/40 data-[state=active]:!bg-emerald-500/12 data-[state=active]:!text-white data-[state=active]:shadow-[0_0_10px_rgba(16,185,129,0.2)] transition-all duration-150"
          >
            <ScrollText size={14} className="shrink-0" aria-hidden="true" />
            <span className="hidden truncate @[17rem]:inline">Submissions</span>
          </TabsTrigger>
          <TabsTrigger
            value="editorial"
            title="Editorial"
            className="flex !min-w-0 !flex-1 min-w-0 w-full items-center justify-center gap-1 overflow-hidden px-1.5 text-xs border border-transparent data-[state=active]:!border-amber-300/35 data-[state=active]:!bg-amber-400/10 data-[state=active]:!text-white data-[state=active]:shadow-[0_0_10px_rgba(245,158,11,0.25)] transition-all duration-150"
          >
            <BookOpen size={14} className="shrink-0" aria-hidden="true" />
            <span className="hidden truncate @[17rem]:inline">Editorial</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto pb-14 xl:pb-0">
        <TabsContent
          value="problem"
          className="m-0 min-w-0 max-w-full overflow-hidden p-3 @[20rem]:p-4"
        >
          <div className="min-w-0 max-w-full space-y-4 overflow-hidden @[20rem]:space-y-5">
            <section className="min-w-0 overflow-hidden border-b border-white/10 pb-3">
              <div
                className="flex max-w-full items-center gap-1 overflow-x-auto overscroll-x-contain pb-0.5 [scrollbar-width:thin] @[20rem]:justify-center"
                aria-label={`Problem ${currentProblemNumber} of ${problems.length}`}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={!selectedProblem || selectedProblemIndex <= 0}
                  onClick={() => selectProblemAtIndex(selectedProblemIndex - 1)}
                  aria-label="Previous problem"
                  className="size-8 shrink-0 border border-white/10 text-slate-300 bg-transparent hover:!border-blue-500/40 hover:!bg-transparent hover:!text-white hover:shadow-[0_0_12px_rgba(59,130,246,0.25)] active:!border-blue-500/50 active:shadow-[0_0_14px_rgba(59,130,246,0.35)] transition-all duration-200 cursor-pointer"
                >
                  <ChevronLeft size={14} aria-hidden="true" />
                </Button>
                {problems.map((problem) => {
                  const isSelected = selectedProblem ? problem.id === selectedProblem.id : false

                  let difficultyStyles = ''
                  if (isSelected) {
                    if (problem.difficulty === 'EASY') {
                      difficultyStyles = 'border-emerald-500/40 bg-transparent text-white shadow-none'
                    } else if (problem.difficulty === 'HARD') {
                      difficultyStyles = 'border-red-500/40 bg-transparent text-white shadow-none'
                    } else {
                      difficultyStyles = 'border-amber-500/40 bg-transparent text-white shadow-none'
                    }
                  } else {
                    if (problem.difficulty === 'EASY') {
                      difficultyStyles = 'border-white/10 text-slate-400 hover:border-emerald-500/30 hover:bg-transparent hover:text-white hover:shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                    } else if (problem.difficulty === 'HARD') {
                      difficultyStyles = 'border-white/10 text-slate-400 hover:border-red-500/30 hover:bg-transparent hover:text-white hover:shadow-[0_0_10px_rgba(239,68,68,0.15)]'
                    } else {
                      difficultyStyles = 'border-white/10 text-slate-400 hover:border-amber-500/30 hover:bg-transparent hover:text-white hover:shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                    }
                  }

                  return (
                    <Button
                      key={problem.id}
                      type="button"
                      variant={isSelected ? 'secondary' : 'ghost'}
                      size="sm"
                      className={[
                        'h-8 min-w-9 shrink-0 px-2 text-xs border transition-all duration-200',
                        difficultyStyles,
                      ].join(' ')}
                      onClick={() => onSelectedProblemIdChange(problem.id)}
                      aria-pressed={isSelected}
                      aria-label={`Problem ${problem.shortLabel}`}
                    >
                      {problem.shortLabel}
                    </Button>
                  )
                })}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={!selectedProblem || selectedProblemIndex >= problems.length - 1}
                  onClick={() => selectProblemAtIndex(selectedProblemIndex + 1)}
                  aria-label="Next problem"
                  className="size-8 shrink-0 border border-white/10 text-slate-300 bg-transparent hover:!border-blue-500/40 hover:!bg-transparent hover:!text-white hover:shadow-[0_0_12px_rgba(59,130,246,0.25)] active:!border-blue-500/50 active:shadow-[0_0_14px_rgba(59,130,246,0.35)] transition-all duration-200 cursor-pointer"
                >
                  <ChevronRight size={14} aria-hidden="true" />
                </Button>
              </div>
            </section>

            {isLoadingProblems ? (
              <div className="space-y-5 overflow-hidden" aria-label="Loading assigned problems">
                <section className="space-y-4 overflow-hidden">
                  <div className="flex flex-wrap items-center gap-2 overflow-hidden">
                    <div className="h-6 w-20 animate-pulse rounded-full bg-white/8" />
                    <div className="h-6 w-32 animate-pulse rounded-full bg-white/[0.06]" />
                    <div className="h-6 w-24 animate-pulse rounded-full bg-white/[0.06]" />
                  </div>
                  <div className="space-y-3 overflow-hidden">
                    <div className="h-7 w-3/5 animate-pulse rounded-md bg-white/8" />
                    <div className="h-4 w-full animate-pulse rounded bg-white/[0.06]" />
                    <div className="h-4 w-4/5 animate-pulse rounded bg-white/[0.06]" />
                  </div>
                </section>

                <section className="grid gap-3 overflow-hidden">
                  <div className="h-28 animate-pulse rounded-xl border border-white/8 bg-white/[0.035]" />
                  <div className="h-28 animate-pulse rounded-xl border border-white/8 bg-white/[0.035]" />
                </section>

                <section className="space-y-3 overflow-hidden">
                  <div className="h-5 w-24 animate-pulse rounded bg-white/8" />
                  <div className="grid gap-2 overflow-hidden">
                    <div className="h-10 animate-pulse rounded-lg border border-white/8 bg-black/25" />
                    <div className="h-10 animate-pulse rounded-lg border border-white/8 bg-black/25" />
                  </div>
                </section>
              </div>
            ) : problemLoadError ? (
              <Card className="border-red-300/20 bg-red-400/[0.06] py-8 text-center shadow-none">
                <CardContent className="px-5 text-sm text-red-100">
                  {problemLoadError}
                </CardContent>
              </Card>
            ) : !selectedProblem ? (
              <Card className="border-white/10 bg-white/[0.035] py-8 text-center shadow-none">
                <CardContent className="px-5 text-sm text-slate-400">
                  No problems are assigned to this room yet.
                </CardContent>
              </Card>
            ) : (
              <>
              <section className="min-w-0 space-y-4 overflow-hidden">
                <div className="flex flex-wrap items-center gap-1.5 overflow-hidden @[20rem]:gap-2">
                  <Badge className={difficultyClassName[selectedProblem.difficulty]}>
                    {formatDifficulty(selectedProblem.difficulty)}
                  </Badge>
                  {selectedProblem.topics.map((topic) => (
                    <Badge
                      key={topic}
                      className="max-w-full truncate border-zinc-500/20 bg-zinc-500/10 text-zinc-300"
                    >
                      {topic}
                    </Badge>
                  ))}
                </div>
                <div className="min-w-0 overflow-hidden">
                  <h2 className="wrap-break-word text-lg font-semibold tracking-tight text-white @[20rem]:text-xl">
                    {selectedProblem.title}
                  </h2>
                  <p className="mt-3 wrap-break-word text-sm leading-6 text-slate-400">
                    {selectedProblem.description}
                  </p>
                </div>
              </section>

              <section className="grid gap-3 overflow-hidden">
                <div className="overflow-hidden rounded-xl border border-white/8 bg-white/[0.025] p-4">
                  <h3 className="text-sm font-semibold text-white">Input</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {selectedProblem.inputExplanation}
                  </p>
                </div>
                <div className="overflow-hidden rounded-xl border border-white/8 bg-white/[0.025] p-4">
                  <h3 className="text-sm font-semibold text-white">Output</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {selectedProblem.outputExplanation}
                  </p>
                </div>
              </section>

              <section className="space-y-3 overflow-hidden">
                <h3 className="text-sm font-semibold text-white">Constraints</h3>
                <div className="grid gap-2 overflow-hidden">
                  {selectedProblem.constraints.map((constraint) => (
                    <code
                      key={constraint}
                      className="block overflow-hidden rounded-lg border border-white/8 bg-black/25 px-3 py-2 font-mono text-xs leading-5 wrap-break-word text-slate-300"
                    >
                      {constraint}
                    </code>
                  ))}
                </div>
              </section>

              <section className="space-y-3 overflow-hidden">
                <h3 className="text-sm font-semibold text-white">Example</h3>
                <div className="grid grid-cols-1 gap-3 overflow-hidden lg:grid-cols-2">
                  <div className="overflow-hidden rounded-xl border border-white/8 bg-black/25 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Input
                    </p>
                    <pre className="mt-3 whitespace-pre-wrap font-mono text-sm text-slate-200">
                      {selectedProblem.sampleInput}
                    </pre>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-white/8 bg-black/25 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Output
                    </p>
                    <pre className="mt-3 whitespace-pre-wrap font-mono text-sm text-slate-200">
                      {selectedProblem.sampleOutput}
                    </pre>
                  </div>
                </div>
              </section>

              <Accordion
                type="single"
                collapsible
                className="rounded-xl border border-white/8 bg-white/[0.035] px-4"
              >
                <AccordionItem value="hint" className="border-white/8">
                  <AccordionTrigger className="text-white hover:no-underline">
                    Hints
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2 text-sm leading-6 text-slate-400">
                      {selectedProblem.hints.map((hint) => (
                        <li key={hint}>{hint}</li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              </>
            )}
            </div>
          </TabsContent>

          <CompetingSubmissionsPanel problems={problems} submissions={submissions} />

          <TabsContent value="editorial" className="m-0 min-w-0 overflow-hidden p-4 sm:p-5">
            <Card className="border-white/10 bg-white/[0.035] py-8 text-center shadow-none">
              <CardHeader className="items-center px-5">
                <div className="grid size-12 place-items-center rounded-xl border border-white/10 bg-white/4 text-[#D6FFF6]">
                  <Trophy size={20} aria-hidden="true" />
                </div>
                <CardTitle className="text-lg text-white">Editorial locked</CardTitle>
                <CardDescription className="max-w-sm leading-6">
                  Editorial will be available after the session.
                </CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
  )

  if (isCollapsed) {
    return (
      <>
        <aside className="flex h-full min-h-0 min-w-0 overflow-hidden bg-[#080D14]/95 xl:border-r xl:border-white/10">
          <ProblemPanelRail activeTab={activeTab} onSelect={handleRailSelect} />
        </aside>
      </>
    )
  }

  return (
    <>
      <aside className="@container flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-[#080D14]/90 xl:border-r xl:border-white/10">
        {panelTabs}
      </aside>
    </>
  )
}
