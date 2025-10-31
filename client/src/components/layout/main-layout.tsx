import { NavSidebar } from './nav-sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <NavSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
