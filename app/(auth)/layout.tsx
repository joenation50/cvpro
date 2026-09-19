export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <a
            href="/"
            className="inline-flex items-center gap-2 transition hover:opacity-80"
          >
            <img
              src="/favicon-192.png"
              alt="CVPro"
              className="h-10 w-10 rounded-xl"
            />
            <span className="font-grotesk text-2xl font-bold tracking-tight">
              <span className="text-white">CV</span>
              <span className="text-cyan">Pro</span>
            </span>
          </a>
        </div>

        {children}
      </div>
    </div>
  );
}
