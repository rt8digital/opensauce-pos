import { NavSidebar } from './nav-sidebar';
import { MobileTabBar } from '@/components/mobile/mobile-tab-bar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden safe-area-inset-top">
      <NavSidebar />
      <main className="flex-1 overflow-auto pt-16 pb-24 md:pt-0 md:pb-0 safe-area-inset-bottom">
        {children}
      </main>
      <MobileTabBar />
    </div>
  );
}
