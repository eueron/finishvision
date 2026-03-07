export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-900 text-white flex-col justify-center px-16">
        <h1 className="text-4xl font-bold mb-4">FinishVision</h1>
        <p className="text-lg text-brand-200 leading-relaxed">
          The easiest takeoff platform for finish carpentry contractors.
          AI-powered blueprint reading, instant door and window counts,
          and professional estimates in minutes.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
