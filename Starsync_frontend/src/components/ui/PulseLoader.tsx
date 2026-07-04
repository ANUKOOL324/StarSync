type PulseLoaderProps = {
  className?: string
  fullscreen?: boolean
}

export function PulseLoader({ className = '', fullscreen = false }: PulseLoaderProps) {
  return (
    <div
      className={[
        'grid place-items-center bg-[#0B0D10]',
        fullscreen ? 'min-h-dvh' : 'min-h-36 rounded-2xl border border-white/8',
        className,
      ].join(' ')}
      aria-label="Loading"
      role="status"
    >
      <div className="pulse-loader" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <style>{`
        .pulse-loader {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          height: 48px;
          padding: 8px 10px;
        }

        .pulse-loader span {
          position: relative;
          width: 14px;
          height: 14px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.28);
          box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.35);
          animation: pulse-loader-dot 1.25s ease-in-out infinite;
        }

        .pulse-loader span::after {
          content: '';
          position: absolute;
          inset: -7px;
          border-radius: inherit;
          border: 2px solid rgba(255, 255, 255, 0.2);
          opacity: 0;
          transform: scale(0.7);
          animation: pulse-loader-ring 1.25s ease-in-out infinite;
        }

        .pulse-loader span:nth-child(2),
        .pulse-loader span:nth-child(2)::after {
          animation-delay: 0.14s;
        }

        .pulse-loader span:nth-child(3),
        .pulse-loader span:nth-child(3)::after {
          animation-delay: 0.28s;
        }

        .pulse-loader span:nth-child(4),
        .pulse-loader span:nth-child(4)::after {
          animation-delay: 0.42s;
        }

        @keyframes pulse-loader-dot {
          0%, 100% {
            transform: scale(0.78);
            background: rgba(255, 255, 255, 0.18);
            box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.28);
          }

          42% {
            transform: scale(1.08);
            background: rgba(255, 255, 255, 0.92);
            box-shadow:
              inset 0 0 0 2px rgba(255, 255, 255, 0.95),
              0 0 18px rgba(255, 255, 255, 0.22);
          }
        }

        @keyframes pulse-loader-ring {
          0%, 100% {
            opacity: 0;
            transform: scale(0.68);
          }

          42% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  )
}