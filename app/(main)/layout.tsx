import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { MobileNav } from '@/components/layout/MobileNav';
import { Player } from '@/components/player/Player';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col h-screen overflow-hidden bg-background text-foreground">
      {/* Animated Glowing Background */}
      {/* Background - Clean Light Theme */}
      <div className="absolute inset-0 bg-background pointer-events-none z-0" />

      <div className="relative z-10 flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 overflow-y-auto hide-scrollbar pb-[100px] md:pb-[120px] px-4 md:px-8 py-6">
            <div className="max-w-[1600px] mx-auto w-full">
              {children}
            </div>
          </main>
          <MobileNav />
        </div>
      </div>
      <Player />
    </div>
  );
}
