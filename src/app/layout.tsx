import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Consommation des crédits · Unitalk",
  description:
    "Tableau de bord de démonstration de la consommation des collaborateurs IA.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
