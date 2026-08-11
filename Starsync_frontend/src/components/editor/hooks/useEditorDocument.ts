import { useCallback, useEffect, useRef, useState } from 'react'

import { editorService } from '../../../services/editorService'
import type { EditorLanguage, SaveStatus } from '../../../types/editor'
import type { EditorToolbarMode } from '../editorConfig'
import {
  DEFAULT_EDITOR_LANGUAGE,
  isSupportedEditorLanguage,
  starterCodeByLanguage,
} from '../editorConfig'

const AUTOSAVE_DELAY_MS = 1500

type UseEditorDocumentOptions = {
  competingProblemId: string | null
  roomId: string
  toolbarMode: EditorToolbarMode
}

/**
 * Owns the editor document: what the code and language are, where they are
 * persisted, and when they are saved.
 *
 * Collaborative rooms persist to the backend; competing rooms keep a private
 * per-problem draft in localStorage so competitors never share their solution.
 */
export function useEditorDocument({ competingProblemId, roomId, toolbarMode }: UseEditorDocumentOptions) {
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState<EditorLanguage>(DEFAULT_EDITOR_LANGUAGE)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [editorError, setEditorError] = useState<string | null>(null)
  const [loadRetryCount, setLoadRetryCount] = useState(0)

  // Yjs collaboration reads these once, after its first sync. Refs keep the
  // values current without re-running the collaboration effect on every edit.
  const languageRef = useRef<EditorLanguage>(language)
  const loadedContentRef = useRef('')
  const loadedLanguageRef = useRef<EditorLanguage>(DEFAULT_EDITOR_LANGUAGE)

  const competingDraftKey = `competing_draft_${roomId}_${competingProblemId || 'default'}`

  useEffect(() => {
    languageRef.current = language
  }, [language])

  const markUnsaved = useCallback(() => {
    setSaveStatus('unsaved')
  }, [])

  const retryLoad = useCallback(() => {
    setLoadRetryCount((currentCount) => currentCount + 1)
  }, [])

  const applyLoadedDocument = useCallback((nextLanguage: EditorLanguage, nextContent: string) => {
    loadedContentRef.current = nextContent
    loadedLanguageRef.current = nextLanguage
    setLanguage(nextLanguage)
    setCode(nextContent)
  }, [])

  const saveDocument = useCallback(async () => {
    setSaveStatus('saving')

    if (toolbarMode === 'competing') {
      try {
        localStorage.setItem(competingDraftKey, JSON.stringify({ code, language, updatedAt: new Date().toISOString() }))
        setLastSavedAt(new Date())
        setSaveStatus('saved')
      } catch {
        setSaveStatus('error')
        setEditorError('Editor document could not be saved locally.')
      }
      return
    }

    try {
      const document = await editorService.saveDocument(roomId, code, language)

      setLastSavedAt(new Date(document.updatedAt))
      setSaveStatus('saved')
    } catch {
      setSaveStatus('error')
      setEditorError('Editor document could not be saved.')
    }
  }, [code, competingDraftKey, language, roomId, toolbarMode])

  const loadDocument = useCallback(async (isCurrentRequest: () => boolean) => {
    setIsLoading(true)
    setEditorError(null)

    if (toolbarMode === 'competing') {
      if (!isCurrentRequest()) return
      try {
        const saved = localStorage.getItem(competingDraftKey)
        if (saved) {
          const parsed = JSON.parse(saved)
          const draftLanguage: EditorLanguage = isSupportedEditorLanguage(parsed.language)
            ? (parsed.language as EditorLanguage)
            : DEFAULT_EDITOR_LANGUAGE

          applyLoadedDocument(draftLanguage, parsed.code || starterCodeByLanguage[draftLanguage])
          setLastSavedAt(new Date(parsed.updatedAt))
          setSaveStatus('saved')
        } else {
          applyLoadedDocument(DEFAULT_EDITOR_LANGUAGE, starterCodeByLanguage[DEFAULT_EDITOR_LANGUAGE])
          setSaveStatus('saved')
        }
      } catch {
        setEditorError('Could not load editor document')
        setSaveStatus('error')
      } finally {
        setIsLoading(false)
      }
      return
    }

    try {
      const document = await editorService.getDocument(roomId)

      if (!isCurrentRequest()) return

      const documentLanguage = isSupportedEditorLanguage(document.language)
        ? document.language
        : DEFAULT_EDITOR_LANGUAGE

      applyLoadedDocument(documentLanguage, document.content || starterCodeByLanguage[documentLanguage])
      setLastSavedAt(new Date(document.updatedAt))
      setSaveStatus('saved')
    } catch {
      if (isCurrentRequest()) {
        setEditorError('Could not load editor document')
        setSaveStatus('error')
      }
    } finally {
      if (isCurrentRequest()) {
        setIsLoading(false)
      }
    }
  }, [applyLoadedDocument, competingDraftKey, roomId, toolbarMode])

  useEffect(() => {
    let isCurrentRequest = true

    void loadDocument(() => isCurrentRequest)

    return () => {
      isCurrentRequest = false
    }
  }, [loadDocument, loadRetryCount])

  useEffect(() => {
    const documentHasLocalChanges = saveStatus === 'unsaved' || saveStatus === 'syncing'

    if (isLoading || !documentHasLocalChanges) return

    const saveTimer = window.setTimeout(() => {
      void saveDocument()
    }, AUTOSAVE_DELAY_MS)

    return () => window.clearTimeout(saveTimer)
  }, [isLoading, saveDocument, saveStatus])

  return {
    code,
    editorError,
    isLoading,
    language,
    languageRef,
    lastSavedAt,
    loadedContentRef,
    loadedLanguageRef,
    markUnsaved,
    retryLoad,
    saveDocument,
    saveStatus,
    setCode,
    setLanguage,
  }
}
