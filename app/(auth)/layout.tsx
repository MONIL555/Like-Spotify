export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black selection:bg-brand-primary/30">
      {/* Animated Mesh Gradient Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-brand-secondary/20 blur-[120px] animate-pulse pointer-events-none" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-brand-primary/20 blur-[150px] animate-pulse pointer-events-none" style={{ animationDuration: '12s' }} />
      
      {/* Glass overlay to smooth gradients */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[30px] pointer-events-none z-0" />
      
      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
}
