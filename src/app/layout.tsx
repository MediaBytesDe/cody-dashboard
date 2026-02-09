import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { Breadcrumb } from "@/components/breadcrumb";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cody Dashboard",
  description: "Aufgaben & Projekte Tracking",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="dark">
      <body className={inter.className}>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Breadcrumb />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </div>
        <Toaster richColors position="bottom-right" />
        <KeyboardShortcuts />
      </body>
    </html>
  );
}
