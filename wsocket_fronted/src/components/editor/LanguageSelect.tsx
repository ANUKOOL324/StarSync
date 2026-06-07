import type { EditorLanguage } from '../../types/editor'

type LanguageSelectProps = {
  disabled?: boolean
  language: EditorLanguage
  onChange: (language: EditorLanguage) => void
}

const languages: Array<{ label: string; value: EditorLanguage }> = [
  { label: 'C', value: 'c' },
  { label: 'C++', value: 'cpp' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'Python', value: 'python' },
]

export function LanguageSelect({ disabled, language, onChange }: LanguageSelectProps) {
  return (
    <label className="flex min-w-0 items-center gap-2 text-xs text-slate-500">
      <span className="hidden sm:inline">Language</span>
      <select
        value={language}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as EditorLanguage)}
        className="h-9 min-w-32 rounded-xl border border-white/10 bg-[#0B1114]/90 px-3 text-sm font-medium text-slate-100 outline-none transition focus:border-[#18D6A3]/45 focus:ring-2 focus:ring-[#18D6A3]/15 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {languages.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  )
}
