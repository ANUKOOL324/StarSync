import { motion } from 'framer-motion'
import { MessageSquare, Play } from 'lucide-react'

export function HeroBackdrop() {
  return (
    <div className="hero-backdrop" aria-hidden="true">
      <svg
        className="hero-backdrop-frame"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path d="M0 50 L15 50 L45 79" vectorEffect="non-scaling-stroke" />
        <path d="M100 50 L85 50 L55 79" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="hero-backdrop-lines hero-backdrop-lines--top">
        {Array.from({ length: 6 }, (_, index) => (
          <span key={index} />
        ))}
      </div>
      <div className="hero-backdrop-lines hero-backdrop-lines--bottom">
        {Array.from({ length: 6 }, (_, index) => (
          <span key={index} />
        ))}
      </div>
    </div>
  )
}

export function FooterBackdrop() {
  return (
    <div className="footer-backdrop" aria-hidden="true">
      <div className="footer-backdrop-glow" />
      <div className="footer-backdrop-lines">
        {Array.from({ length: 7 }, (_, index) => (
          <span key={index} />
        ))}
      </div>
    </div>
  )
}

export function GitHubIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.5v-1.9c-2.78.62-3.37-1.22-3.37-1.22-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.36 1.12 2.94.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.31.1-2.72 0 0 .84-.28 2.75 1.05A9.34 9.34 0 0 1 12 6.95c.85 0 1.7.12 2.5.34 1.9-1.33 2.74-1.05 2.74-1.05.55 1.41.2 2.46.1 2.72.64.72 1.03 1.64 1.03 2.76 0 3.94-2.34 4.8-4.57 5.06.36.32.68.95.68 1.92v2.79c0 .28.18.6.69.5A10.08 10.08 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z" />
    </svg>
  )
}

export function LinkedInIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6.94 8.98H3.75V20h3.19V8.98ZM5.35 4a1.85 1.85 0 1 0 0 3.7 1.85 1.85 0 0 0 0-3.7Zm15.15 9.68c0-3.05-1.63-4.47-3.8-4.47-1.75 0-2.54.96-2.98 1.64V8.98h-3.06V20h3.19v-5.45c0-1.44.27-2.84 2.06-2.84 1.76 0 1.79 1.65 1.79 2.93V20h3.19v-6.32h-.39Z" />
    </svg>
  )
}

export function AppPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18, duration: 0.65, ease: 'easeOut' }}
      className="landing-app-preview relative mx-auto w-full min-w-0 max-w-4xl px-0"
    >
      <div className="pointer-events-none absolute -inset-1 rounded-xl bg-linear-to-r from-white/10 to-[#A7A8AE]/15 opacity-30 blur-2xl" />
      <div className="relative w-full min-w-0 rounded-xl bg-linear-to-b from-[#5A5A5C] via-white/15 to-[#28282A] p-px shadow-2xl shadow-black/50">
        <div className="relative w-full min-w-0 overflow-hidden rounded-[11px] bg-[#18181B]/80 p-2 backdrop-blur-2xl sm:p-3">
        <div className="mb-3 flex items-center gap-2 border-b border-white/5 pb-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F56]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#27C93F]" />
          <span className="ml-2 font-mono text-[11px] text-zinc-500">
            StarSync
          </span>
        </div>

        <div className="grid w-full min-w-0 grid-cols-1 gap-2 sm:gap-3 lg:min-h-76 lg:grid-cols-12">
          <div className="relative min-w-0 overflow-hidden rounded-lg border border-white/5 bg-[#0D0D0F] p-2.5 font-mono text-[10px] leading-4 text-zinc-400 sm:p-4 sm:text-[11px] sm:leading-5 lg:col-span-7 lg:p-5 lg:text-[12px]">
            <div className="absolute right-3 top-3 flex gap-2">
              <span className="grid h-7 w-7 place-items-center rounded bg-white/10 text-[#F8F8FA] shadow-[0_0_18px_rgba(255,255,255,0.10)]">
                <Play size={13} fill="currentColor" aria-hidden="true" />
              </span>
            </div>

            <div className="flex min-w-0 gap-3 sm:gap-5">
              <div className="select-none text-zinc-700">
                1<br />2<br />3<br />4<br />5<br />6
              </div>
              <div className="min-w-0 overflow-x-auto pb-1">
                <p>
                  <span className="text-[#BDC2FF]">async function</span>{' '}
                  <span className="text-[#F8F8FA]">syncEngine</span>() {'{'}
                </p>
                <p>
                  &nbsp;&nbsp;<span className="text-[#BDC2FF]">const</span> session ={' '}
                  <span className="text-[#BDC2FF]">await</span> Flow.
                  <span className="text-[#DCDDDF]">connect</span>();
                </p>
                <p className="text-zinc-600">&nbsp;&nbsp;{'// Initializing realtime buffer...'}</p>
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

            {/* Console Panel */}
            <div className="mt-5 hidden border-t border-white/5 pt-4 sm:block">
              <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                <span>Console</span>
              </div>
              <div className="space-y-1.5 wrap-break-word font-mono text-[10px] leading-relaxed text-zinc-500 sm:text-[11px]">
                <p>
                  <span className="text-zinc-600">system &gt;</span> connecting to StarSync node...
                </p>
                <p>
                  <span className="text-zinc-600">system &gt;</span> buffer synced. session active.
                </p>
                <p className="text-zinc-300">
                  <span className="text-zinc-600">engine &gt;</span> broadcast success: state=&apos;ACTIVE&apos; (12ms)
                </p>
              </div>
            </div>
          </div>

          <div className="relative min-w-0 overflow-hidden rounded-lg border border-white/5 bg-[#111214]/90 p-2.5 sm:p-4 lg:col-span-5">
            <div className="absolute inset-0 bg-[radial-gradient(#57f1db12_1px,transparent_1px)] bg-size-[18px_18px]" />
            <div className="relative flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <p className="bg-linear-to-b from-[#F8F8FA] via-[#DCDDDF] to-[#A7A8AE] bg-clip-text text-sm font-semibold tracking-[-0.02em] text-transparent">Launch Room</p>
                <p className="mt-1 text-xs text-[#859490]">3 members online</p>
              </div>
              <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/15 bg-white/10 text-[#F8F8FA]">
                <MessageSquare size={15} aria-hidden="true" />
              </span>
            </div>

            <div className="relative mt-4 space-y-3">
              <div className="mr-2 rounded-xl rounded-tl-sm border border-white/8 bg-white/4 p-3 sm:mr-6 lg:mr-10">
                <div className="mb-1 flex items-center gap-2 text-xs">
                  <span className="font-semibold text-[#F8F8FA]">Maya</span>
                  <span className="text-[#5F6B68]">10:42</span>
                </div>
                <p className="text-sm leading-5 text-[#BACAC5]">Can we review the editor sync before demo?</p>
              </div>

              <div className="ml-3 rounded-xl rounded-tr-sm bg-linear-to-b from-[#F8F8FA] via-[#DCDDDF] to-[#A7A8AE] p-3 text-[#08080A] sm:ml-6 lg:ml-12">
                <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold">You</span>
                  <span className="text-[#45464A]">10:43</span>
                </div>
                <p className="text-sm leading-5">Yes, chat and code room are stable now.</p>
              </div>

              <div className="mr-2 rounded-xl rounded-tl-sm border border-white/8 bg-white/4 p-3 sm:mr-6 lg:mr-16">
                <div className="mb-1 flex items-center gap-2 text-xs">
                  <span className="font-semibold text-[#F8F8FA]">Rahul</span>
                  <span className="text-[#5F6B68]">10:44</span>
                </div>
                <p className="text-sm leading-5 text-[#BACAC5]">Board notes are synced too.</p>
              </div>
            </div>

            <div className="relative mt-4 flex items-center gap-2 rounded-xl border border-white/8 bg-[#0D0D0F] px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-linear-to-b from-[#F8F8FA] to-[#A7A8AE]" />
              <span className="text-xs text-[#859490]">
                Message Launch Room
              </span>
            </div>
          </div>
        </div>
        </div>
      </div>
    </motion.div>
  )
}
