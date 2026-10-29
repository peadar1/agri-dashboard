import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Brand } from "@/components/app-shell/brand";
import { MobileNav } from "@/components/app-shell/mobile-nav";
import { SidebarNav } from "@/components/app-shell/sidebar-nav";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "AgriDesk", template: "%s · AgriDesk" },
  description: "Client, grant application and invoice management for agricultural consultants.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IE" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <TooltipProvider>
          <div className="flex min-h-screen">
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar px-3 py-5 lg:flex">
              <div className="mb-8">
                <Brand />
              </div>
              <SidebarNav />
              <p className="mt-auto px-3 text-xs text-sidebar-foreground/50">Demo data only</p>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
              <header className="sticky top-0 z-20 flex h-14 items-center gap-2 bg-sidebar px-3 lg:hidden">
                <MobileNav />
                <Brand />
              </header>
              <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
            </div>
          </div>
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </body>
    </html>
  );
}
