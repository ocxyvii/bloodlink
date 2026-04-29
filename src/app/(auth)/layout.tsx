export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">

      {/* ── Left Panel ─────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between bg-[#1a0a0d] p-12 text-white relative overflow-hidden">

        {/* Ambient glows */}
        <div className="absolute -top-20 -right-24 w-[380px] h-[380px] rounded-full bg-[#a01423]/[0.18] pointer-events-none" />
        <div className="absolute bottom-16 -left-16 w-[200px] h-[200px] rounded-full bg-[#a01423]/[0.10] pointer-events-none" />

        {/* Subtle rings */}
        <div className="absolute -top-20 -left-20 w-[320px] h-[320px] rounded-full border border-white/[0.05] pointer-events-none" />
        <div className="absolute -bottom-28 -right-28 w-[420px] h-[420px] rounded-full border border-white/[0.05] pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-[9px] bg-[#a01423]/55 border border-white/[0.12] flex items-center justify-center">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C12 2 5 9.5 5 14a7 7 0 0 0 14 0c0-4.5-7-12-7-12z" fill="rgba(255,255,255,0.85)" />
            </svg>
          </div>
          <span className="text-[17px] font-medium text-white/92 tracking-tight">BloodLink</span>
        </div>

        {/* Hero content */}
        <div className="relative z-10 space-y-4">

          {/* Eyebrow */}
          <div className="flex items-center gap-2">
            <span className="w-[5px] h-[5px] rounded-full bg-[#a01423]" />
            <p className="text-[11px] font-medium uppercase tracking-[0.11em] text-white/35">
              Somalia's trusted platform
            </p>
          </div>

          {/* Accent line */}
          <div className="w-7 h-[2px] bg-[#a01423]/80 rounded-full" />

          {/* Blood type pills */}
          <div className="flex gap-1.5 flex-wrap">
            {['A+', 'O−', 'B+', 'AB+'].map((type) => (
              <span
                key={type}
                className="px-2.5 py-0.5 text-[11px] font-medium bg-white/[0.05] border border-white/10 rounded-full text-white/50"
              >
                {type}
              </span>
            ))}
          </div>

          {/* Headline */}
          <h1
            className="text-[1.9rem] font-bold leading-[1.22] text-white/93"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Every drop saves<br />
            <em className="italic text-[#c94055]">a life</em> that matters.
          </h1>

          {/* Subheading */}
          <p className="text-[13px] font-light leading-[1.8] text-white/42 max-w-[300px]">
            Connecting donors with patients in need —{' '}
            <strong className="font-medium text-white/65">fast, safe, and reliable.</strong>{' '}
            Join thousands of Somalis making a difference.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            {[
              { value: '120+', label: 'Donations' },
              { value: '5 Cities', label: 'Centers' },
              { value: '98%', label: 'Match rate' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/[0.04] border border-white/[0.08] rounded-[10px] px-2.5 py-3"
              >
                <div className="text-[1.15rem] font-medium text-white/82">{stat.value}</div>
                <div className="text-[10.5px] text-white/32 mt-0.5 tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-[11px] text-white/20">
          © 2026 BloodLink · Saving lives together
        </p>
      </div>

      {/* ── Right Panel ────────────────────────────────── */}
      <div className="flex items-center justify-center p-6 lg:p-12 bg-background border-l border-black/[0.06]">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-[#8a1020] flex items-center justify-center">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C12 2 5 9.5 5 14a7 7 0 0 0 14 0c0-4.5-7-12-7-12z" fill="white" />
              </svg>
            </div>
            <span className="text-[17px] font-medium">BloodLink</span>
          </div>

          {children}
        </div>
      </div>

    </div>
  )
}