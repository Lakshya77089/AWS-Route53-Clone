import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/lib/toast-context";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Route 53 Console",
  description: "Route 53 hosted zone management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full flex overflow-hidden">
        <AuthProvider>
          <ToastProvider>
            <Sidebar />
            <main className="flex-1 overflow-y-auto bg-[var(--aws-bg)]">
              {children}
            </main>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
