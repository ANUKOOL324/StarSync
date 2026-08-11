import { useRoom } from '@liveblocks/react'
import { getYjsProviderForRoom } from '@liveblocks/yjs'
import { useCallback, useEffect, useRef } from 'react'
import { MonacoBinding } from 'y-monaco'
import type * as Y from 'yjs'

import type { EditorLanguage } from '../../../types/editor'
import type { EditorToolbarMode, MonacoEditorInstance, MonacoEditorModel } from '../editorConfig'
import { isSupportedEditorLanguage } from '../editorConfig'

const SHARED_CODE_NAME = 'monaco'
const SHARED_META_NAME = 'editor-meta'
const SHARED_LANGUAGE_KEY = 'language'

type UseYjsEditorCollaborationOptions = {
  isLoading: boolean
  languageRef: { current: EditorLanguage }
  loadedContentRef: { current: string }
  loadedLanguageRef: { current: EditorLanguage }
  markUnsaved: () => void
  monacoEditor: MonacoEditorInstance | null
  roomId: string
  setCode: (code: string) => void
  setLanguage: (language: EditorLanguage) => void
  toolbarMode: EditorToolbarMode
}

const replaceSharedTextContent = (sharedText: Y.Text, content: string) => {
  sharedText.doc?.transact(() => {
    sharedText.delete(0, sharedText.length)
    sharedText.insert(0, content)
  })
}

/**
 * Connects Monaco to the shared Yjs document behind Liveblocks:
 *
 *   Monaco <-> Y.Text('monaco') <-> Yjs <-> Liveblocks
 *
 * The selected language travels alongside the code in Y.Map('editor-meta'),
 * so collaborators can never run the same shared code as different languages.
 *
 * Competing rooms are private drafts and never take part in this.
 */
export function useYjsEditorCollaboration({
  isLoading,
  languageRef,
  loadedContentRef,
  loadedLanguageRef,
  markUnsaved,
  monacoEditor,
  roomId,
  setCode,
  setLanguage,
  toolbarMode,
}: UseYjsEditorCollaborationOptions) {
  const liveblocksRoom = useRoom()
  const sharedTextRef = useRef<Y.Text | null>(null)
  const sharedMetaRef = useRef<Y.Map<string> | null>(null)

  // Guards the local write -> observer -> local write feedback loop when this
  // user is the one changing the shared language.
  const isApplyingSharedLanguageRef = useRef(false)

  useEffect(() => {
    if (isLoading || toolbarMode === 'competing') return

    const editor = monacoEditor
    const model = editor?.getModel()

    if (!editor || !model) return

    let binding: MonacoBinding | null = null
    let hasCreatedBinding = false
    let shouldIgnoreChanges = false

    const provider = getYjsProviderForRoom(liveblocksRoom, undefined, true)
    const yDocument = provider.getYDoc()
    const sharedText = yDocument.getText(SHARED_CODE_NAME)
    const sharedMeta = yDocument.getMap<string>(SHARED_META_NAME)
    sharedTextRef.current = sharedText
    sharedMetaRef.current = sharedMeta

    const handleSharedTextChange = () => {
      if (shouldIgnoreChanges) return

      setCode(sharedText.toString())
      markUnsaved()
    }

    const applyRemoteLanguage = () => {
      if (isApplyingSharedLanguageRef.current) return

      const rawLanguage = sharedMeta.get(SHARED_LANGUAGE_KEY)
      if (!rawLanguage || !isSupportedEditorLanguage(rawLanguage)) return
      if (rawLanguage === languageRef.current) return

      isApplyingSharedLanguageRef.current = true
      setLanguage(rawLanguage)
      markUnsaved()
      isApplyingSharedLanguageRef.current = false
    }

    // An already published language wins, so a late joiner adopts the room's
    // choice instead of resetting everyone to their own saved language.
    const initializeSharedLanguage = () => {
      const existingLanguage = sharedMeta.get(SHARED_LANGUAGE_KEY)

      if (existingLanguage && isSupportedEditorLanguage(existingLanguage)) {
        if (existingLanguage !== languageRef.current) {
          setLanguage(existingLanguage)
        }
        return
      }

      isApplyingSharedLanguageRef.current = true
      sharedMeta.set(SHARED_LANGUAGE_KEY, loadedLanguageRef.current)
      isApplyingSharedLanguageRef.current = false
    }

    sharedMeta.observe(applyRemoteLanguage)

    const createBindingAfterFirstSync = () => {
      if (hasCreatedBinding) return

      hasCreatedBinding = true

      const savedSnapshot = loadedContentRef.current

      // The first collaborator to arrive seeds the empty shared document with
      // whatever was last persisted for this room.
      if (sharedText.length === 0 && savedSnapshot.length > 0) {
        shouldIgnoreChanges = true
        replaceSharedTextContent(sharedText, savedSnapshot)
        shouldIgnoreChanges = false
      }

      const sharedCode = sharedText.toString()

      if (sharedCode !== model.getValue()) {
        shouldIgnoreChanges = true
        model.setValue(sharedCode)
        shouldIgnoreChanges = false
      }

      setCode(sharedCode)
      initializeSharedLanguage()

      binding = new MonacoBinding(sharedText, model as NonNullable<MonacoEditorModel>, new Set([editor]))
      sharedText.observe(handleSharedTextChange)
    }

    const handleProviderSync = (isSynced: boolean) => {
      if (isSynced) {
        createBindingAfterFirstSync()
      }
    }

    provider.on('sync', handleProviderSync)

    if (provider.synced) {
      createBindingAfterFirstSync()
    }

    return () => {
      provider.off('sync', handleProviderSync)
      sharedText.unobserve(handleSharedTextChange)
      sharedMeta.unobserve(applyRemoteLanguage)
      binding?.destroy()
      provider.destroy()

      if (sharedTextRef.current === sharedText) {
        sharedTextRef.current = null
      }

      if (sharedMetaRef.current === sharedMeta) {
        sharedMetaRef.current = null
      }
    }
  }, [
    isLoading,
    languageRef,
    liveblocksRoom,
    loadedContentRef,
    loadedLanguageRef,
    markUnsaved,
    monacoEditor,
    roomId,
    setCode,
    setLanguage,
    toolbarMode,
  ])

  const publishSharedLanguage = useCallback((nextLanguage: EditorLanguage) => {
    const sharedMeta = sharedMetaRef.current

    if (!sharedMeta) return

    isApplyingSharedLanguageRef.current = true
    sharedMeta.set(SHARED_LANGUAGE_KEY, nextLanguage)
    isApplyingSharedLanguageRef.current = false
  }, [])

  const replaceSharedCode = useCallback((nextCode: string) => {
    const sharedText = sharedTextRef.current

    if (!sharedText) return

    replaceSharedTextContent(sharedText, nextCode)
  }, [])

  return { publishSharedLanguage, replaceSharedCode }
}
