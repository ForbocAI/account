import type { Metadata } from "next";
import Image from "next/image";
import Script from "next/script";
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
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-D7LDJHNM26" strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-D7LDJHNM26');`}
      </Script>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 text-zinc-100 selection:bg-red-900 selection:text-white`}
      >
        <div className="relative min-h-screen flex flex-col">
          {/* Subtle Grid Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

          <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Image src="/logo.png" alt="Forboc AI" width={32} height={32} className="object-contain" />
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
