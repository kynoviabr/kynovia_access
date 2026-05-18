import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kynovia Admin",
  description: "Kynovia Access administration console"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
