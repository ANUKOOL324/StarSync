import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import {
  Code2,
  MessageSquare,
  PenTool,
  Play,
  Trophy,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const features = [
  {
    title: 'Integrated Editor',
    description:
      'Code together in real time with Monaco, Liveblocks Yjs, autosave snapshots, and active collaborator presence.',
    icon: Code2,
  },
  {
    title: 'Infinite Whiteboard',
    description:
      'Map architectures, flows, and system ideas on a low-latency canvas designed for technical planning.',
    icon: PenTool,
  },
  {
    title: 'Teaching & Contests',
    description:
      'Host focused study rooms, internal hackathons, and coding sessions with chat, execution, and shared context.',
    icon: Trophy,
  },
]

const githubUrl = 'https://github.com/ANUKOOL324/webSocket---ChatApplication'
const linkedinUrl = 'https://www.linkedin.com/in/anukoolbhul324/'

function GitHubIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.5v-1.9c-2.78.62-3.37-1.22-3.37-1.22-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.36 1.12 2.94.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.31.1-2.72 0 0 .84-.28 2.75 1.05A9.34 9.34 0 0 1 12 6.95c.85 0 1.7.12 2.5.34 1.9-1.33 2.74-1.05 2.74-1.05.55 1.41.2 2.46.1 2.72.64.72 1.03 1.64 1.03 2.76 0 3.94-2.34 4.8-4.57 5.06.36.32.68.95.68 1.92v2.79c0 .28.18.6.69.5A10.08 10.08 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6.94 8.98H3.75V20h3.19V8.98ZM5.35 4a1.85 1.85 0 1 0 0 3.7 1.85 1.85 0 0 0 0-3.7Zm15.15 9.68c0-3.05-1.63-4.47-3.8-4.47-1.75 0-2.54.96-2.98 1.64V8.98h-3.06V20h3.19v-5.45c0-1.44.27-2.84 2.06-2.84 1.76 0 1.79 1.65 1.79 2.93V20h3.19v-6.32h-.39Z" />
    </svg>
  )
}

function AppPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18, duration: 0.65, ease: 'easeOut' }}
      className="relative mx-auto mt-12 w-full max-w-4xl"
    >
      <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-white/10 to-[#A7A8AE]/15 opacity-30 blur-2xl" />
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#18181B]/70 p-3 shadow-2xl shadow-black/50 backdrop-blur-2xl">
        <div className="mb-3 flex items-center gap-2 border-b border-white/5 pb-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F56]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#27C93F]" />
          <span className="ml-2 font-mono text-[11px] text-zinc-500">
            StarSync Desktop - session_04.flow
          </span>
        </div>

        <div className="grid min-h-[19rem] gap-3 lg:grid-cols-12">
          <div className="relative overflow-hidden rounded-lg border border-white/5 bg-[#0D0D0F] p-5 font-mono text-[12px] leading-5 text-zinc-400 lg:col-span-7">
            <div className="absolute right-3 top-3 flex gap-2">
              <span className="grid h-7 w-7 place-items-center rounded bg-white/10 text-[#F8F8FA] shadow-[0_0_18px_rgba(255,255,255,0.10)]">
                <Play size={13} fill="currentColor" aria-hidden="true" />
              </span>
            </div>

            <div className="flex gap-5">
              <div className="select-none text-zinc-700">
                1<br />2<br />3<br />4<br />5<br />6
              </div>
              <div>
                <p>
                  <span className="text-[#BDC2FF]">async function</span>{' '}
                  <span className="text-[#F8F8FA]">syncEngine</span>() {'{'}
                </p>
                <p>
                  &nbsp;&nbsp;<span className="text-[#BDC2FF]">const</span> session ={' '}
                  <span className="text-[#BDC2FF]">await</span> Flow.
                  <span className="text-[#DCDDDF]">connect</span>();
                </p>
                <p className="text-zinc-600">&nbsp;&nbsp;// Initializing realtime buffer...</p>
                <p>
                  &nbsp;&nbsp;session.<span className="text-[#DCDDDF]">broadcast</span>({'{'}
                </p>
                <p>
                  &nbsp;&nbsp;&nbsp;&nbsp;state: <span className="text-[#F8F8FA]">&apos;ACTIVE&apos;</span>,
                </p>
                <p>&nbsp;&nbsp;{'}'});</p>
                <p>{'}'}</p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-lg border border-white/5 bg-[#111214]/90 p-4 lg:col-span-5">
            <div className="absolute inset-0 bg-[radial-gradient(#57f1db12_1px,transparent_1px)] bg-[size:18px_18px]" />
            <div className="relative flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <p className="bg-gradient-to-b from-[#F8F8FA] via-[#DCDDDF] to-[#A7A8AE] bg-clip-text text-sm font-semibold tracking-[-0.02em] text-transparent">Launch Room</p>
                <p className="mt-1 text-xs text-[#859490]">3 members online</p>
              </div>
              <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/15 bg-white/10 text-[#F8F8FA]">
                <MessageSquare size={15} aria-hidden="true" />
              </span>
            </div>

            <div className="relative mt-4 space-y-3">
              <div className="mr-10 rounded-xl rounded-tl-sm border border-white/8 bg-white/[0.04] p-3">
                <div className="mb-1 flex items-center gap-2 text-xs">
                  <span className="font-semibold text-[#F8F8FA]">Maya</span>
                  <span className="text-[#5F6B68]">10:42</span>
                </div>
                <p className="text-sm leading-5 text-[#BACAC5]">Can we review the editor sync before demo?</p>
              </div>

              <div className="ml-12 rounded-xl rounded-tr-sm bg-gradient-to-b from-[#F8F8FA] via-[#DCDDDF] to-[#A7A8AE] p-3 text-[#08080A]">
                <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold">You</span>
                  <span className="text-[#45464A]">10:43</span>
                </div>
                <p className="text-sm leading-5">Yes, chat and code room are stable now.</p>
              </div>

              <div className="mr-16 rounded-xl rounded-tl-sm border border-white/8 bg-white/[0.04] p-3">
                <div className="mb-1 flex items-center gap-2 text-xs">
                  <span className="font-semibold text-[#F8F8FA]">Rahul</span>
                  <span className="text-[#5F6B68]">10:44</span>
                </div>
                <p className="text-sm leading-5 text-[#BACAC5]">Board notes are synced too.</p>
              </div>
            </div>

            <div className="relative mt-4 flex items-center gap-2 rounded-xl border border-white/8 bg-[#0D0D0F] px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-gradient-to-b from-[#F8F8FA] to-[#A7A8AE]" />
              <span className="text-xs text-[#859490]">
                Message Launch Room
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function LandingPage() {
  const [activeSection, setActiveSection] = useState<'product' | 'features'>('product')

  useEffect(() => {
    const updateActiveSection = () => {
      const productSection = document.getElementById('product')
      const featuresSection = document.getElementById('features')

      if (!productSection || !featuresSection) {
        return
      }

      const scrollCheckpoint = window.scrollY + 160
      const featuresStart = featuresSection.offsetTop

      if (scrollCheckpoint >= featuresStart) {
        setActiveSection('features')
        return
      }

      setActiveSection('product')
    }

    updateActiveSection()
    window.addEventListener('scroll', updateActiveSection, { passive: true })

    return () => {
      window.removeEventListener('scroll', updateActiveSection)
    }
  }, [])

  return (
    <main className="min-h-dvh bg-[#131315] text-[#E5E1E4] selection:bg-[#57F1DB]/20 selection:text-[#D6FFF6]">
      <header className="fixed top-0 z-50 w-full">
        <nav className="mx-auto grid h-[72px] max-w-[1380px] grid-cols-3 items-center rounded-b-2xl border-b border-white/8 bg-black/15 px-5 py-3 shadow-lg shadow-black/10 backdrop-blur-xl">
          <Link to="/" className="flex items-center justify-self-start" aria-label="StarSync home">
            <img
              src="/starsync-logo.png"
              alt=""
              className="h-10 w-10 rounded-full object-cover"
            />
          </Link>

          <div className="hidden items-center justify-center gap-10 text-[15px] font-medium md:flex">
            <a
              className={`flex items-center gap-3 transition ${
                activeSection === 'product'
                  ? 'bg-gradient-to-b from-[#F8F8FA] via-[#DCDDDF] to-[#A7A8AE] bg-clip-text text-transparent'
                  : 'text-[#9B9EA6] hover:text-[#DCDDDF]'
              }`}
              href="#product"
              aria-current={activeSection === 'product' ? 'page' : undefined}
            >
              <span
                className={`h-2 w-2 rotate-45 transition ${
                  activeSection === 'product'
                    ? 'bg-gradient-to-br from-white via-[#DCDDDF] to-[#9FA1A8] shadow-[0_0_12px_rgba(255,255,255,0.55)]'
                    : 'bg-white/20'
                }`}
              />
              Product
            </a>
            <a
              className={`flex items-center gap-3 transition ${
                activeSection === 'features'
                  ? 'bg-gradient-to-b from-[#F8F8FA] via-[#DCDDDF] to-[#A7A8AE] bg-clip-text text-transparent'
                  : 'text-[#9B9EA6] hover:text-[#DCDDDF]'
              }`}
              href="#features"
              aria-current={activeSection === 'features' ? 'page' : undefined}
            >
              <span
                className={`h-2 w-2 rotate-45 transition ${
                  activeSection === 'features'
                    ? 'bg-gradient-to-br from-white via-[#DCDDDF] to-[#9FA1A8] shadow-[0_0_12px_rgba(255,255,255,0.55)]'
                    : 'bg-white/20'
                }`}
              />
              Features
            </a>
          </div>

          <div className="flex items-center gap-4 justify-self-end">
            <Link
              to="/login"
              className="rounded-full border border-white/10 bg-[#171717]/35 px-5 py-2.5 text-sm font-semibold text-[#F1F1F3] backdrop-blur-xl transition hover:border-white/20 hover:bg-[#171717]/55"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="hidden rounded-full border border-white/15 bg-[#171717]/55 px-5 py-2.5 text-sm font-semibold text-[#F1F1F3] backdrop-blur-xl transition hover:border-[#57F1DB]/40 hover:text-[#D6FFF6] sm:inline-flex"
            >
              Sign up
            </Link>
          </div>
        </nav>
      </header>

      <section
        id="product"
        className="relative overflow-hidden bg-black px-5 pb-16 pt-[72px] sm:px-10"
      >
        <div
          className="relative mx-auto flex min-h-[calc(100vh-4.75rem)] max-w-[1380px] items-center overflow-hidden rounded-t-[18px] border-x border-t border-white/10 bg-black bg-no-repeat px-5 pb-16 pt-20 shadow-2xl shadow-black/60"
          style={{
            backgroundImage: "url('/hero-bg.png')",
            backgroundPosition: 'calc(50% - 22px) -18px',
            backgroundSize: 'calc(100% + 48px) auto',
          }}
        >
          <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-b from-transparent to-[#0E0E10]" />

          <div className="relative mx-auto w-full max-w-[1200px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.75, ease: [0.23, 1, 0.32, 1] }}
              className="mx-auto flex max-w-4xl flex-col items-center text-center"
            >
              <div className="mt-16 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#D2D3D8] shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-xl">
                <span className="h-1.5 w-1.5 rounded-full bg-[#95FF4F]" />
                Early access
              </div>
              <p className="mt-5 text-2xl font-semibold uppercase tracking-[-0.03em] text-[#F1F1F3] sm:text-3xl">
                Welcome to
              </p>
              <h1 className="mt-0 bg-gradient-to-b from-[#F8F8FA] via-[#DCDDDF] to-[#A7A8AE] bg-clip-text text-7xl font-normal leading-[1.06] tracking-[-0.075em] text-transparent sm:text-8xl lg:text-9xl">
                StarSync
              </h1>
              <p className="mt-4 text-base font-normal tracking-[0.03em] text-[#C8C9CE] sm:text-lg">
                A collaboration hub
              </p>

              <div className="mt-8 flex justify-center">
                <Link
                  to="/signup"
                  className="rounded-full border border-white/15 bg-gradient-to-b from-[#5A5A5C] to-[#28282A] px-10 py-3 text-sm font-semibold text-[#F7F7F8] shadow-[inset_0_1px_0_rgba(255,255,255,0.20),0_12px_36px_rgba(0,0,0,0.45)] transition hover:from-[#666668] hover:to-[#303033] active:scale-[0.98]"
                >
                  Get Started
                </Link>
              </div>
            </motion.div>

            <AppPreview />
          </div>
        </div>
      </section>

      <section
        id="features"
        className="relative overflow-hidden bg-[#050807] py-24"
      >
        <div className="absolute inset-0 bg-[radial-gradient(rgba(87,241,219,0.14)_1px,transparent_1px)] bg-[size:18px_18px] opacity-35" />
        <div className="absolute left-0 top-0 h-full w-[55%] bg-[radial-gradient(circle_at_20%_20%,rgba(87,241,219,0.18),transparent_34%),linear-gradient(90deg,rgba(7,36,35,0.46),transparent)]" />
        <div className="absolute bottom-0 right-0 h-[75%] w-[42%] bg-[radial-gradient(circle_at_80%_80%,rgba(139,83,23,0.24),transparent_42%)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/35" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#0E0E10] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#09090B]" />
        <div className="relative mx-auto max-w-[1200px] px-5">
          <div className="mb-10">
            <h2 className="bg-gradient-to-b from-[#F8F8FA] via-[#DCDDDF] to-[#A7A8AE] bg-clip-text text-4xl font-normal leading-tight tracking-[-0.055em] text-transparent sm:text-5xl">
              Features for high-output engineers
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#BACAC5]">
              Chat, code, run, and sketch ideas inside focused realtime rooms.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature, index) => (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 44 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.28, margin: '-80px' }}
                transition={{
                  delay: index * 0.08,
                  duration: 1.05,
                  ease: 'easeOut',
                }}
                className="group rounded-xl bg-gradient-to-b from-[#5A5A5C]/80 via-white/15 to-[#28282A]/85 p-[2px] shadow-[0_18px_60px_rgba(0,0,0,0.22)]"
              >
                <div className="h-full rounded-[10px] bg-[#18181B]/80 p-6 backdrop-blur-2xl transition duration-300 group-hover:bg-[#1F1F23]/85">
                  <div className="mb-5 grid h-12 w-12 place-items-center rounded-lg border border-white/15 bg-gradient-to-b from-[#5A5A5C]/35 to-[#28282A]/35 text-[#F7F7F8] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition duration-300 group-hover:scale-110">
                    <feature.icon size={20} aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-medium tracking-[-0.02em] text-[#E5E1E4]">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#BACAC5]">{feature.description}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <footer
        className="relative overflow-hidden border-t border-white/10 bg-[#09090B] bg-cover bg-center bg-no-repeat py-6"
        style={{ backgroundImage: "url('/footer-bg.png')" }}
      >
        <div className="absolute inset-0 bg-black/35" />
        <div className="relative mx-auto flex max-w-[1200px] flex-col gap-4 px-5 md:flex-row md:items-center md:justify-between">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center gap-3 md:justify-start">
              <img
                src="/starsync-logo.png"
                alt=""
                className="h-8 w-8 rounded-full object-cover"
              />
              <p className="text-lg font-semibold tracking-[-0.02em] text-[#D6FFF6]">StarSync</p>
            </div>
            <p className="mt-1 text-xs text-[#5F6B68]">© 2026 StarSync. All rights reserved.</p>
          </div>

          <div className="flex items-center justify-center gap-3 md:justify-end">
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-[#BACAC5] transition hover:border-[#57F1DB]/35 hover:text-[#D6FFF6]"
              aria-label="Open StarSync GitHub repository"
            >
              <GitHubIcon />
            </a>
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-[#BACAC5] transition hover:border-[#57F1DB]/35 hover:text-[#D6FFF6]"
              aria-label="Open LinkedIn profile"
            >
              <LinkedInIcon />
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}
