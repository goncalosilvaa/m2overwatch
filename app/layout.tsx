import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "M2Overwatch",
  description: "Anti-cheat server-side para Metin2",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className="bg-bg text-white min-h-screen antialiased">{children}</body>
    </html>
  );
}
