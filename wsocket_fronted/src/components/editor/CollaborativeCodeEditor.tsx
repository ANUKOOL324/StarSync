import Editor, { type BeforeMount, type OnMount } from '@monaco-editor/react'

import type { EditorLanguage } from '../../types/editor'

type CollaborativeCodeEditorProps = {
  code: string
  isLoading: boolean
  language: EditorLanguage
  onChange: (value: string) => void
  onMount?: OnMount
}

const monacoLanguageMap: Record<EditorLanguage, string> = {
  c: 'c',
  cpp: 'cpp',
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
}

const defineEditorTheme: BeforeMount = (monaco) => {
  monaco.editor.defineTheme('ws-chat-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6B7280' },
      { token: 'keyword', foreground: '7FFFE0' },
      { token: 'string', foreground: 'A7F3D0' },
      { token: 'number', foreground: 'FBBF24' },
    ],
    colors: {
      'editor.background': '#05080A',
      'editor.foreground': '#E5E7EB',
      'editor.lineHighlightBackground': '#11182788',
      'editorCursor.foreground': '#18D6A3',
      'editorLineNumber.foreground': '#475569',
      'editor.selectionBackground': '#18D6A333',
    },
  })
}

export function CollaborativeCodeEditor({
  code,
  isLoading,
  language,
  onChange,
  onMount,
}: CollaborativeCodeEditorProps) {
  return (
    <div className="h-full min-h-0 min-w-0 flex-1 overflow-hidden bg-[#05080A]">
      <Editor
        defaultValue={code}
        height="100%"
        loading={isLoading ? 'Loading editor...' : 'Preparing editor...'}
        language={monacoLanguageMap[language]}
        theme="ws-chat-dark"
        beforeMount={defineEditorTheme}
        onMount={onMount}
        onChange={(value) => onChange(value ?? '')}
        options={{
          automaticLayout: true,
          fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
          fontSize: 14,
          minimap: { enabled: false },
          padding: { top: 16, bottom: 16 },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          wordWrap: 'on',
          wrappingIndent: 'same',
          tabSize: 2,
        }}
      />
    </div>
  )
}
