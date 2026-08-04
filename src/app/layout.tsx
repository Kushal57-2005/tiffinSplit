import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TiffinSplit — Roommate Tiffin Billing & Audit",
  description: "Roommate tiffin billing web application with meal entry, monthly settlements, payment tracking, and audit metrics.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.className} dark h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 selection:bg-amber-500/30 selection:text-amber-200">
        <Navigation />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
          TiffinSplit &copy; {new Date().getFullYear()} — Structured Roommate Billing System
        </footer>
      </body>
    </html>
  );
}
