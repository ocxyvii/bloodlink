export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-between bg-[hsl(346,77%,49%)] p-12 text-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full border-[40px] border-white" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full border-[60px] border-white" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border-[30px] border-white" />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C12 2 5 9.5 5 14a7 7 0 0 0 14 0c0-4.5-7-12-7-12z" fill="white"/>
            </svg>
          </div>
          <span className="text-xl font-semibold tracking-tight">BloodLink</span>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-2">
            <div className="flex gap-2 mb-6">
              {['A+', 'O-', 'B+', 'AB+'].map((type) => (
                <span key={type} className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-medium">
                  {type}
                </span>
              ))}
            </div>
            <h1 className="text-4xl font-bold leading-tight">
              Every drop counts.<br />Every life matters.
            </h1>
            <p className="text-white/75 text-lg leading-relaxed">
              Kenya's most trusted blood donation and booking platform. Connecting donors with those in need — fast, safe, and reliable.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { value: '12,400+', label: 'Donations' },
              { value: '5 Cities', label: 'Centers' },
              { value: '98%', label: 'Match Rate' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur rounded-2xl p-4">
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-white/70 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10 text-white/50 text-sm">
          © 2025 BloodLink Kenya. Saving lives together.
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C12 2 5 9.5 5 14a7 7 0 0 0 14 0c0-4.5-7-12-7-12z" fill="white"/>
              </svg>
            </div>
            <span className="text-lg font-semibold">BloodLink</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}