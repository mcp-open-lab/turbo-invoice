import { DesktopNav } from "@/components/desktop-nav";
import { MobileHeader } from "@/components/layouts/mobile-header";
import { MobileBottomNav } from "@/components/layouts/mobile-bottom-nav";
import { QuickActions } from "@/components/quick-actions";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Desktop Navigation - Top (hidden on mobile/tablet) */}
      <DesktopNav />
      
      {/* Mobile Header - Top (visible only on mobile/tablet) */}
      <MobileHeader />
      
      {/* Main Content Area */}
      <main className="flex-1 pb-20 md:pb-0 md:pt-16">
        {/* pb-20 accounts for mobile bottom nav, md:pt-16 accounts for desktop fixed nav */}
        {children}
      </main>
      
      {/* Mobile Bottom Navigation (visible only on mobile/tablet) */}
      <MobileBottomNav />
      
      {/* Quick Actions FAB (visible only on mobile/tablet for secondary actions) */}
      <QuickActions />
    </div>
  );
}

