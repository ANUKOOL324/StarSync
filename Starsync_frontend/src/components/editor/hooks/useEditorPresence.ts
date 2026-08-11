import { useOthers, useUpdateMyPresence } from '@liveblocks/react'
import { useEffect, useRef } from 'react'

import { useAuth } from '../../../hooks/useAuth'
import type { EditorToolbarMode, MonacoEditorInstance } from '../editorConfig'
import { getUserColor } from '../editorConfig'

const CURSOR_STYLE_TAG_ID = 'collab-cursor-styles'

type UseEditorPresenceOptions = {
  monacoEditor: MonacoEditorInstance | null
  toolbarMode: EditorToolbarMode
}

/**
 * Publishes this user's cursor to Liveblocks and paints every collaborator's
 * cursor and selection inside Monaco.
 *
 * Remote cursors are drawn with Monaco decorations plus one generated <style>
 * tag, because each collaborator needs their own colour and name label.
 *
 * Competing rooms are private, so nothing is published or drawn there.
 */
export function useEditorPresence({ monacoEditor, toolbarMode }: UseEditorPresenceOptions) {
  const { user } = useAuth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateMyPresence = useUpdateMyPresence() as (data: any) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const others = useOthers() as ReadonlyArray<any>

  const cursorDecorationsRef = useRef<string[]>([])
  const cursorStyleTagRef = useRef<HTMLStyleElement | null>(null)

  useEffect(() => {
    const editor = monacoEditor
    if (!editor || !user || toolbarMode === 'competing') return

    updateMyPresence({
      user: {
        name: user.username,
        color: getUserColor(user.id ?? user.username ?? 'default'),
      },
      cursor: null,
    })

    const disposable = editor.onDidChangeCursorSelection(() => {
      const model = editor.getModel()
      if (!model) return
      const sel = editor.getSelection()
      if (!sel) return
      updateMyPresence({
        cursor: {
          anchor: model.getOffsetAt(sel.getStartPosition()),
          head: model.getOffsetAt(sel.getEndPosition()),
        },
      })
    })

    return () => disposable.dispose()
  }, [monacoEditor, updateMyPresence, user, toolbarMode])

  useEffect(() => {
    const editor = monacoEditor
    const model = editor?.getModel()
    if (!editor || !model || toolbarMode === 'competing') return

    if (!cursorStyleTagRef.current) {
      const el = document.createElement('style')
      el.id = CURSOR_STYLE_TAG_ID
      document.head.appendChild(el)
      cursorStyleTagRef.current = el
    }

    const cssRules: string[] = []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newDecorations: any[] = []

    others.forEach((other) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const presence = other.presence as any
      const cursor = presence?.cursor
      if (!cursor) return

      const cid = other.connectionId as number
      const remoteUser = presence?.user
      const color: string = remoteUser?.color ?? getUserColor(String(cid))
      const name: string = remoteUser?.name ?? `User ${cid}`

      // The name is injected into CSS content, so quotes and escapes must go.
      const safeName = name.replace(/"/g, '').replace(/\\/g, '')

      cssRules.push(
        `.yRemoteSelection-${cid}{background-color:${color}33;}` +
        `.yRemoteSelectionHead-${cid}{border-color:${color};border-left:2px solid ${color};}` +
        `.yRemoteSelectionHead-${cid}::after{` +
          `content:"${safeName}";` +
          `background:${color};color:#05080a;` +
          `position:absolute;top:-1.5em;left:-2px;` +
          `padding:1px 6px;border-radius:4px 4px 4px 0;` +
          `font-size:11px;font-weight:700;white-space:nowrap;pointer-events:none;z-index:100;` +
        `}`
      )

      try {
        const anchorPos = model.getPositionAt(cursor.anchor as number)
        const headPos = model.getPositionAt(cursor.head as number)
        const isForward =
          anchorPos.lineNumber < headPos.lineNumber ||
          (anchorPos.lineNumber === headPos.lineNumber && anchorPos.column <= headPos.column)
        const start = isForward ? anchorPos : headPos
        const end = isForward ? headPos : anchorPos

        newDecorations.push({
          range: { startLineNumber: start.lineNumber, startColumn: start.column, endLineNumber: end.lineNumber, endColumn: end.column },
          options: {
            className: `yRemoteSelection yRemoteSelection-${cid}`,
            afterContentClassName: isForward ? `yRemoteSelectionHead yRemoteSelectionHead-${cid}` : undefined,
            beforeContentClassName: isForward ? undefined : `yRemoteSelectionHead yRemoteSelectionHead-${cid}`,
          },
        })
      } catch {
        void 0;
      }
    })

    if (cursorStyleTagRef.current) {
      cursorStyleTagRef.current.textContent = cssRules.join('\n')
    }

    cursorDecorationsRef.current = editor.deltaDecorations(cursorDecorationsRef.current, newDecorations)
  }, [monacoEditor, others, toolbarMode])

  useEffect(() => {
    return () => {
      cursorStyleTagRef.current?.remove()
      cursorStyleTagRef.current = null
    }
  }, [])
}
