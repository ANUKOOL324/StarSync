import { motion } from 'framer-motion'
import { ArrowRight, LogIn, Network, ShieldCheck, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'

const highlights = [
  { label: 'Native ws server', icon: Network },
  { label: 'Express ready', icon: ShieldCheck },
  { label: 'Room messaging', icon: Zap },
]

export function LandingPage() {
  return (
    <main className="neon-field flex min-h-dvh items-center px-5 py-10 sm:px-8 lg:px-12">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="mx-auto w-full max-w-5xl"
      >
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.24em] text-teal-300">
          WebSocket Chat
        </p>
        <h1 className="max-w-3xl text-3xl font-thin tracking-tight text-gray-new-50 text-gray-200 sm:text-5xl lg:text-6xl">
          A solid real‑time chat base for rooms, messages, and future features.
        </h1>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-teal-300 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-teal-200"
          >
            Create account
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-white/10 hover:text-white"
          >
            <LogIn size={17} aria-hidden="true" />
            Log in
          </Link>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {highlights.map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <item.icon className="mb-3 text-teal-300" size={20} aria-hidden="true" />
              <p className="text-sm font-medium text-white">{item.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </main>
  )
}
