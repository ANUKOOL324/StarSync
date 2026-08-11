import { useCallback, useEffect, useState } from 'react'

import { editorService } from '../../../services/editorService'
import type {
  CodeRunResult,
  EditorLanguage,
  RoomProblemRunResult,
  RoomProblemSubmitResult,
} from '../../../types/editor'
import type { EditorToolbarMode } from '../editorConfig'

type UseCodeExecutionOptions = {
  code: string
  competingProblemId: string | null
  language: EditorLanguage
  onSubmitSuccess?: (() => void) | undefined
  roomId: string
  toolbarMode: EditorToolbarMode
}

/**
 * Owns running and submitting code, plus every result the output panel shows.
 *
 * Collaborative rooms run free-form code against custom stdin, while competing
 * rooms run the problem's visible testcases and submit against all of them.
 */
export function useCodeExecution({
  code,
  competingProblemId,
  language,
  onSubmitSuccess,
  roomId,
  toolbarMode,
}: UseCodeExecutionOptions) {
  const [isRunning, setIsRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)
  const [runResult, setRunResult] = useState<CodeRunResult | null>(null)
  const [testcaseResult, setTestcaseResult] = useState<RoomProblemRunResult | null>(null)
  const [submitResult, setSubmitResult] = useState<RoomProblemSubmitResult | null>(null)
  const [stdin, setStdin] = useState('')

  const codeIsEmpty = code.trim().length === 0

  // The output panel's "clear" keeps the last submission visible on purpose.
  const clearOutput = useCallback(() => {
    setRunError(null)
    setRunResult(null)
    setTestcaseResult(null)
  }, [])

  const clearAllResults = useCallback(() => {
    setRunError(null)
    setRunResult(null)
    setTestcaseResult(null)
    setSubmitResult(null)
  }, [])

  useEffect(() => {
    clearAllResults()
  }, [clearAllResults, competingProblemId])

  const runCode = async () => {
    if (codeIsEmpty || isRunning) return

    setIsRunning(true)
    clearAllResults()

    try {
      if (toolbarMode === 'competing') {
        if (!competingProblemId) {
          throw new Error('Select a problem before running code')
        }

        const result = await editorService.runProblemVisibleTestcases(roomId, competingProblemId, language, code)
        setTestcaseResult(result)
        return
      }

      const result = await editorService.runCode(roomId, language, code, stdin)
      setRunResult(result)
    } catch (error) {
      const safeMessage = error instanceof Error ? error.message : 'Could not run code'
      setRunError(safeMessage)
    } finally {
      setIsRunning(false)
    }
  }

  const submitCode = async () => {
    if (codeIsEmpty || isSubmitting) return

    setIsSubmitting(true)
    clearAllResults()

    try {
      if (!competingProblemId) {
        throw new Error('Select a problem before submitting code')
      }

      const result = await editorService.submitProblemCode(roomId, competingProblemId, language, code)
      setSubmitResult(result)

      if (onSubmitSuccess) {
        onSubmitSuccess()
      }
    } catch (error) {
      const safeMessage = error instanceof Error ? error.message : 'Could not submit code'
      setRunError(safeMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    clearAllResults,
    clearOutput,
    isRunning,
    isSubmitting,
    runCode,
    runError,
    runResult,
    setStdin,
    stdin,
    submitCode,
    submitResult,
    testcaseResult,
  }
}
