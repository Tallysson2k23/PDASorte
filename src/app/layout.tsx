import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "PDA DA SORTE — Demonstração",
  description: "Protótipo sem compras ou premiações reais.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="pt-BR" className="h-full antialiased"><body className="min-h-full">{children}</body></html>;
}
