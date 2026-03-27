import { TopHeader } from "./top-header";
import { Sidebar } from "./sidebar";
import { SidebarProvider } from "./sidebar-context";
import { ContentSwitcher } from "./content-switcher";
import { Breadcrumb } from "./breadcrumb";
import { SidebarAwareMain } from "./sidebar-aware-main";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          본문으로 건너뛰기
        </a>
        <Sidebar />
        <TopHeader />
        <SidebarAwareMain>
          <main id="main-content" className="min-h-0 flex-1 overflow-y-auto pt-16">
            <div className="mx-auto max-w-[1600px] px-6 py-4">
              <Breadcrumb />
              <ContentSwitcher>{children}</ContentSwitcher>
            </div>
          </main>
        </SidebarAwareMain>
      </div>
    </SidebarProvider>
  );
}
