import type { Metadata } from "next";
import { Inter } from "next/font/google";
import QueryProvider from "@/providers/QueryProvider";
import Navbar from "@/components/Navbar";
import Toast from "@/components/Toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AI Interview Prep Kit | Research & Practice Workspace",
  description: "Generate automated company research, question banks, flashcards and study schedules for your job interviews.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} dark h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500 selection:text-white">
        <QueryProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <Toast />
        </QueryProvider>
      </body>
    </html>
  );
}
