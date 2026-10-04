import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://novapdf.example"),
  title: {
    default: "NovaPDF — Every PDF task in one calm workspace",
    template: "%s | NovaPDF",
  },
  description:
    "Organize, convert, edit, and secure PDF documents in a modern, privacy-first workspace.",
  applicationName: "NovaPDF",
  icons: { icon: "/icon.svg", shortcut: "/icon.svg" },
  keywords: ["PDF tools", "merge PDF", "split PDF", "compress PDF", "convert PDF"],
  openGraph: {
    title: "NovaPDF — Every PDF task in one calm workspace",
    description: "A modern, privacy-first workspace for everyday PDF tasks.",
    type: "website",
    siteName: "NovaPDF",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body>{children}</body>
    </html>
  );
}
