import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sorteios da Turma",
  description: "Sorteios gratuitos e internos do grupo da faculdade.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="pt-BR" className="h-full antialiased"><body className="min-h-full">{children}</body></html>;
}
