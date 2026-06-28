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
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto hide-scrollbar bg-gradient-to-b from-brand-light/30 to-background dark:from-brand-primary/10 pb-[90px] md:pb-0">
          {children}
        </main>
        <MobileNav />
      </div>
      <Player />
    </div>
  );
}
