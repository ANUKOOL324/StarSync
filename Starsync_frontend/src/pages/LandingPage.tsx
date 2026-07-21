import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import {
  Code2,
  Menu,
  PenTool,
  Trophy,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { AppPreview, FooterBackdrop, GitHubIcon, HeroBackdrop, LinkedInIcon } from '../components/landing/LandingVisuals'
import { useAuth } from '../hooks/useAuth'

const features = [
  {
    title: 'Integrated Editor',
    mobileDescription: 'Code together with live editor and presence.',
    desktopDescription:
      'Code together in real time with Monaco, Liveblocks Yjs, autosave snapshots, and active collaborator presence.',
    icon: Code2,
  },
  {
    title: 'Infinite Whiteboard',
    mobileDescription: 'Sketch flows, systems, and ideas visually.',
    desktopDescription:
      'Map architectures, flows, and system ideas on a low-latency canvas designed for technical planning.',
    icon: PenTool,
  },
  {
    title: 'Teaching & Contests',
    mobileDescription: 'Run focused rooms, contests, and sessions.',
    desktopDescription:
      'Host focused study rooms, internal hackathons, and coding sessions with chat, execution, and shared context.',
    icon: Trophy,
  },
]

const githubUrl = 'https://github.com/ANUKOOL324/webSocket---ChatApplication'
const linkedinUrl = 'https://www.linkedin.com/in/anukoolbhul324/'

export function LandingPage() {
  const { isAuthenticated, isLoading, logout } = useAuth()
  const [activeSection, setActiveSection] = useState<'product' | 'features'>('product')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
        document.documentElement.classList.add('scrollbar-green')
        document.documentElement.classList.remove('scrollbar-silver')
        return
      }

      setActiveSection('product')
      document.documentElement.classList.add('scrollbar-silver')
      document.documentElement.classList.remove('scrollbar-green')
    }

    updateActiveSection()
    window.addEventListener('scroll', updateActiveSection, { passive: true })

    return () => {
      window.removeEventListener('scroll', updateActiveSection)
      document.documentElement.classList.remove('scrollbar-silver', 'scrollbar-green')
    }
  }, [])

  return (
    <main className="min-h-dvh overflow-x-hidden bg-[#131315] text-[#E5E1E4] selection:bg-[#57F1DB]/20 selection:text-[#D6FFF6]">
      <header className="fixed top-0 z-50 w-full">
        <nav className="mx-auto flex h-16 w-[calc(100%-1rem)] max-w-[1380px] items-center justify-between rounded-b-2xl border-b border-white/8 bg-black/15 px-3 py-3 shadow-lg shadow-black/10 backdrop-blur-xl sm:h-[72px] sm:w-[calc(100%-2rem)] sm:px-5 md:grid md:grid-cols-3">
          <Link to="/" className="flex items-center justify-self-start" aria-label="StarSync home">
            <img
              src="/starsync-logo.png"
              alt=""
              className="h-9 w-9 rounded-full object-cover sm:h-10 sm:w-10"
            />
          </Link>

          <div className="hidden items-center justify-center gap-10 text-[15px] font-medium md:flex">
            <a
              className={`flex items-center gap-3 transition ${
                activeSection === 'product'
                  ? 'bg-linear-to-b from-[#F8F8FA] via-[#DCDDDF] to-[#A7A8AE] bg-clip-text text-transparent'
                  : 'text-[#9B9EA6] hover:text-[#DCDDDF]'
              }`}
              href="#product"
              aria-current={activeSection === 'product' ? 'page' : undefined}
            >
              <span
                className={`h-2 w-2 rotate-45 transition ${
                  activeSection === 'product'
                    ? 'bg-linear-to-br from-white via-[#DCDDDF] to-[#9FA1A8] shadow-[0_0_12px_rgba(255,255,255,0.55)]'
                    : 'bg-white/20'
                }`}
              />
              Product
            </a>
            <a
              className={`flex items-center gap-3 transition ${
                activeSection === 'features'
                  ? 'bg-linear-to-b from-[#F8F8FA] via-[#DCDDDF] to-[#A7A8AE] bg-clip-text text-transparent'
                  : 'text-[#9B9EA6] hover:text-[#DCDDDF]'
              }`}
              href="#features"
              aria-current={activeSection === 'features' ? 'page' : undefined}
            >
              <span
                className={`h-2 w-2 rotate-45 transition ${
                  activeSection === 'features'
                    ? 'bg-linear-to-br from-white via-[#DCDDDF] to-[#9FA1A8] shadow-[0_0_12px_rgba(255,255,255,0.55)]'
                    : 'bg-white/20'
                }`}
              />
              Features
            </a>
          </div>

          <div className="flex items-center gap-4 justify-self-end">
            {!isLoading && isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="hidden rounded-full border-2 border-white/18 bg-white/5 px-5 py-2 text-sm font-semibold text-white transition-all duration-300 hover:border-white/30 hover:bg-white/10 md:inline-flex active:scale-[0.98] cursor-pointer"
                >
                  Open app
                </Link>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="hidden rounded-full border-2 border-white/18 bg-white/5 px-5 py-2 text-sm font-semibold text-white transition-all duration-300 hover:border-white/30 hover:bg-white/10 md:inline-flex active:scale-[0.98] cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : null}
            {!isLoading && !isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="hidden rounded-full border-2 border-white/18 bg-white/5 px-5 py-2 text-sm font-semibold text-white transition-all duration-300 hover:border-white/30 hover:bg-white/10 md:inline-flex active:scale-[0.98] cursor-pointer"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="hidden rounded-full border-2 border-white/18 bg-white/5 px-5 py-2 text-sm font-semibold text-white transition-all duration-300 hover:border-white/30 hover:bg-white/10 md:inline-flex active:scale-[0.98] cursor-pointer"
                >
                  Sign up
                </Link>
              </>
            ) : null}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/18 bg-white/5 text-white transition-all duration-300 hover:border-white/30 hover:bg-white/10 md:hidden cursor-pointer"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </nav>

        {isMobileMenuOpen && (
          <div className="absolute left-1/2 top-16 w-[calc(100%-1rem)] -translate-x-1/2 rounded-b-2xl border border-white/8 bg-[#0D0D0F]/95 px-5 py-5 shadow-2xl backdrop-blur-2xl sm:top-[72px] sm:w-[calc(100%-2rem)] md:hidden">
            <div className="flex flex-col gap-5">
              <a
                href="#product"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-lg font-medium text-[#9B9EA6] transition hover:text-white"
              >
                Product
              </a>
              <a
                href="#features"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-lg font-medium text-[#9B9EA6] transition hover:text-white"
              >
                Features
              </a>
              <div className="my-1 h-px bg-white/5" />
              {!isLoading && isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex h-11 w-full max-w-[200px] mx-auto items-center justify-center rounded-full border-2 border-white/18 bg-white/5 text-sm font-semibold text-white transition-all duration-300 hover:border-white/30 hover:bg-white/10 active:scale-[0.98]"
                  >
                    Open app
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      void logout()
                    }}
                    className="flex h-11 w-full max-w-[200px] mx-auto items-center justify-center rounded-full border-2 border-white/18 bg-white/5 text-sm font-semibold text-white transition-all duration-300 hover:border-white/30 hover:bg-white/10 active:scale-[0.98]"
                  >
                    Logout
                  </button>
                </>
              ) : null}
              {!isLoading && !isAuthenticated ? (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex h-11 w-full max-w-[200px] mx-auto items-center justify-center rounded-full border-2 border-white/18 bg-white/5 text-sm font-semibold text-white transition-all duration-300 hover:border-white/30 hover:bg-white/10 active:scale-[0.98]"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex h-11 w-full max-w-[200px] mx-auto items-center justify-center rounded-full border-2 border-white/18 bg-white/5 text-sm font-semibold text-white transition-all duration-300 hover:border-white/30 hover:bg-white/10 active:scale-[0.98]"
                  >
                    Sign up
                  </Link>
                </>
              ) : null}
            </div>
          </div>
        )}
      </header>

      <section
        id="product"
        className="relative scroll-mt-16 overflow-hidden bg-black px-2 pb-6 pt-16 sm:scroll-mt-[72px] sm:px-4 sm:pb-8 sm:pt-[72px] md:px-5 lg:px-10 lg:pb-12"
      >
        <div
          className="landing-hero-frame relative mx-auto w-full max-w-[1380px] overflow-hidden rounded-t-[18px] border-x border-t border-white/10 bg-black px-3 pb-6 shadow-2xl shadow-black/60 sm:px-4 sm:pb-8 md:px-5 lg:pb-12"
       >
          <HeroBackdrop />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-1 h-24 bg-linear-to-b from-transparent to-[#0E0E10] sm:h-36" />

          <div className="landing-hero-content relative mx-auto w-full min-w-0 max-w-[1200px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.75, ease: [0.23, 1, 0.32, 1] }}
              className="landing-hero-stage mx-auto flex w-full min-w-0 max-w-4xl flex-col items-center text-center"
            >
              <div className="landing-hero-badge inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#D2D3D8] shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-xl sm:px-4 sm:text-[11px] sm:tracking-[0.18em]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#95FF4F]" />
                Early access
              </div>
              <p className="mt-5 text-[clamp(1.25rem,6vw,1.875rem)] font-semibold uppercase tracking-[-0.03em] text-[#F1F1F3] sm:mt-6">
                Welcome to
              </p>
              <h1 className="mt-1 max-w-full wrap-break-word bg-linear-to-b from-[#F8F8FA] via-[#DCDDDF] to-[#A7A8AE] bg-clip-text pb-[0.15em] text-[clamp(3.4rem,17vw,8rem)] font-normal leading-[0.98] tracking-[-0.06em] text-transparent lg:tracking-[-0.075em]">
                StarSync
              </h1>
              <p className="mt-3 text-[clamp(0.875rem,4vw,1.125rem)] font-normal tracking-[0.03em] text-[#C8C9CE] sm:mt-4">
                A collaboration hub
              </p>

              <div className="mt-5 flex justify-center sm:mt-6">
                <Link
                  to={isAuthenticated ? '/dashboard' : '/signup'}
                  className="rounded-full border border-white/15 bg-linear-to-b from-[#5A5A5C] to-[#28282A] px-8 py-2.5 text-sm font-semibold text-[#F7F7F8] shadow-[inset_0_1px_0_rgba(255,255,255,0.20),0_12px_36px_rgba(0,0,0,0.45)] transition hover:from-[#666668] hover:to-[#303033] active:scale-[0.98] sm:px-10 sm:py-3"
                >
                  {isAuthenticated ? 'Open app' : 'Get Started'}
                </Link>
              </div>
            </motion.div>

            <AppPreview />
          </div>
        </div>
      </section>

      <section
        id="features"
        className="features-section relative scroll-mt-16 overflow-hidden py-12 sm:scroll-mt-[72px] sm:py-20 lg:py-24"
      >
        <div className="features-backdrop" aria-hidden="true" />
        <div className="relative mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="mb-6 max-w-3xl sm:mb-10">
            <h2 className="wrap-break-word bg-linear-to-b from-[#F8F8FA] via-[#DCDDDF] to-[#A7A8AE] bg-clip-text text-3xl font-normal leading-tight tracking-[-0.04em] text-transparent sm:text-4xl lg:text-5xl lg:tracking-[-0.055em]">
              <span className="md:hidden">Features</span>
              <span className="hidden md:inline">Features for high-output engineers</span>
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#BACAC5] sm:text-base sm:leading-7 md:text-sm md:leading-6">
              <span className="md:hidden">Build, chat, and compete in one room.</span>
              <span className="hidden md:inline">
                Chat, code, run, and sketch ideas inside focused realtime rooms.
              </span>
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
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
                className="group rounded-xl bg-linear-to-b from-[#5A5A5C]/80 via-white/15 to-[#28282A]/85 p-[2px] shadow-[0_18px_60px_rgba(0,0,0,0.22)]"
              >
                <div className="h-full rounded-[10px] bg-[#18181B]/80 p-5 backdrop-blur-2xl transition duration-300 group-hover:bg-[#1F1F23]/85 sm:p-6">
                  <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg border border-white/15 bg-linear-to-b from-[#5A5A5C]/35 to-[#28282A]/35 text-[#F7F7F8] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition duration-300 group-hover:scale-110 sm:mb-5 sm:h-12 sm:w-12">
                    <feature.icon size={20} aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-medium tracking-[-0.02em] text-[#E5E1E4] sm:text-xl">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#BACAC5] md:hidden">{feature.mobileDescription}</p>
                  <p className="mt-3 hidden text-sm leading-6 text-[#BACAC5] md:block">{feature.desktopDescription}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <footer
        className="footer-bg-container relative overflow-hidden border-t border-white/10 py-8 sm:py-6"
      >
        <FooterBackdrop />
        <div className="relative mx-auto flex w-full max-w-[1200px] flex-col items-center justify-between gap-6 px-4 pb-8 text-center sm:flex-row sm:items-center sm:gap-4 sm:px-6 sm:pb-0 sm:text-left lg:px-8">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center justify-center gap-2.5 sm:justify-start">
              <img
                src="/starsync-logo.png"
                alt=""
                className="h-9 w-9 rounded-full object-cover ring-1 ring-white/10 sm:h-8 sm:w-8"
              />
              <p className="bg-linear-to-b from-[#EAFFF9] via-[#D6FFF6] to-[#9FD8C9] bg-clip-text text-lg font-semibold tracking-[-0.01em] text-transparent">
                StarSync
              </p>
            </div>
            <p className="mt-2 text-xs leading-5 text-[#7B8582] sm:mt-1">&copy; 2026 StarSync. All rights reserved.</p>
          </div>

          <div className="flex shrink-0 items-center justify-center gap-3 sm:justify-end">
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/3 text-[#BACAC5] transition hover:border-[#57F1DB]/35 hover:text-[#D6FFF6]"
              aria-label="Open StarSync GitHub repository"
            >
              <GitHubIcon />
            </a>
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/3 text-[#BACAC5] transition hover:border-[#57F1DB]/35 hover:text-[#D6FFF6]"
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
