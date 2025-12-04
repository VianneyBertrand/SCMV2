import { LayoutWrapper } from "@/components/layout/layout-wrapper";
import type { Metadata } from "next";
import { Ubuntu } from "next/font/google";
import "./globals.css";

const ubuntu = Ubuntu({ subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "Application d'Analyse de Valeur",
  description: "Analysez et comparez vos données de marché",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={ubuntu.className}>
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
