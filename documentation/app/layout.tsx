import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yadra Spec-to-Code Binder",
  description: "Reference documentation for Yadra, the Spec-to-Code Binder, and its CLI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
