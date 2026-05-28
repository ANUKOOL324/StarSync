import { LayoutDashboard, LogIn, MessageCircle, Radio, Sparkles, UserPlus } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { label: 'Overview', to: '/', icon: Sparkles },
  { label: 'Chat', to: '/chat', icon: MessageCircle },
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Login', to: '/login', icon: LogIn },
  { label: 'Signup', to: '/signup', icon: UserPlus },
]

export function Sidebar() {
  return (
    <aside className="flex w-full flex-col border-b border-white/10 bg-black/50 p-4 shadow-2xl shadow-black/30 backdrop-blur-xl md:h-dvh md:w-72 md:border-b-0 md:border-r">
      <div className="flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-lg border border-teal-200/40 bg-teal-300 text-zinc-950 shadow-lg shadow-teal-500/20">
          <Radio size={20} aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">WS Chat</p>
          <p className="text-xs text-zinc-400">Realtime rooms</p>
        </div>
      </div>

      <nav className="mt-6 grid gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition',
                isActive
                  ? 'bg-white text-zinc-950 shadow-lg shadow-white/10'
                  : 'text-zinc-300 hover:bg-white/10 hover:text-white',
              ].join(' ')
            }
          >
            <item.icon size={17} aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
