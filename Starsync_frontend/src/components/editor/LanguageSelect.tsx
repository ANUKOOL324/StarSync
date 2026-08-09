import type { EditorLanguage } from '../../types/editor'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'

type LanguageSelectProps = {
  className?: string
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

export function LanguageSelect({ className, disabled, language, onChange }: LanguageSelectProps) {
  return (
    <Select
      value={language}
      disabled={disabled}
      onValueChange={(value) => onChange(value as EditorLanguage)}
    >
      <SelectTrigger
        aria-label="Programming language"
        className={[
          'h-8 min-w-[7.25rem] cursor-pointer border-white/10 bg-black/35 text-slate-100 shadow-none sm:h-9 sm:min-w-32',
          'hover:bg-white/[0.055] focus-visible:border-[#18D6A3]/40 focus-visible:ring-[#18D6A3]/15',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent
        position="popper"
        align="start"
        className="border-white/10 bg-[#090D10]/98 text-slate-100 shadow-2xl shadow-black/60 backdrop-blur-xl"
      >
        {languages.map((item) => (
          <SelectItem
            key={item.value}
            value={item.value}
            className="cursor-pointer focus:bg-[#18D6A3]/12 focus:text-[#D6FFF6]"
          >
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}