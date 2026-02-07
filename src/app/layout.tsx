import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Console | Forboc AI",
  description: "Developer Account Portal for Forboc AI SDK",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 text-zinc-100 selection:bg-red-900 selection:text-white`}
      >
        <div className="relative min-h-screen flex flex-col">
          {/* Subtle Grid Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

          <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-red-950 border border-red-900 flex items-center justify-center">
                  <span className="text-red-500 font-mono text-xl">F</span>
                </div>
                <span className="font-mono text-sm tracking-[0.3em] uppercase">Forboc Console</span>
              </div>
              <nav className="flex items-center gap-8">
                <a href="/dashboard" className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors">Dashboard</a>
                <a href="/keys" className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors">API Keys</a>
                <a href="/billing" className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors">Billing</a>
              </nav>
            </div>
          </header>

          <main className="relative flex-1 container mx-auto px-6 py-12">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
