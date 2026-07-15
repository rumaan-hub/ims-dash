// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import TokenFromUrl from "./components/TokenFromUrl";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Dentistry99",
  description: "Complete Clinic Management",
};






export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          BLOCKING SCRIPT — runs synchronously before React loads.
          Reads the persisted sidebar state from localStorage and applies
          the correct CSS class to <html> before the first pixel is painted.
          This guarantees zero flicker on hard reload.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  if (localStorage.getItem('sidebar_expanded') === 'true') {
                    document.documentElement.classList.add('sidebar-initially-expanded');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
        {/*
          One-shot service-worker cleanup. The site doesn't ship a PWA, but a
          previous SW (from an older build, another project on the same port,
          or a browser extension) may still be registered in users' browsers
          and produces repeated /sw.js 404s in the dev server log.
          This unregisters anything found and clears its caches; it's a no-op
          on browsers without a stale SW.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
                try {
                  navigator.serviceWorker.getRegistrations().then(function(regs) {
                    regs.forEach(function(reg) { reg.unregister(); });
                  }).catch(function() {});
                  if (typeof caches !== 'undefined') {
                    caches.keys().then(function(keys) {
                      keys.forEach(function(key) { caches.delete(key); });
                    }).catch(function() {});
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} antialiased`} suppressHydrationWarning>
        <TokenFromUrl />
        <Toaster position="top-right" />
        {children}
      </body>
    </html>
  );
}