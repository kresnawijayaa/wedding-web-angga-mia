import type { Metadata } from "next";
import "@fontsource-variable/instrument-sans";
import "@fontsource-variable/playfair-display";
import "./globals.css";
import "./fixes.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://togetherforever.id"),
  title: "Airlangga & Mia — 27.12.2026",
  description: "A life made together. Join us in celebrating our wedding in Muntilan.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Airlangga & Mia — 27.12.2026",
    description: "A life made together. Join us in celebrating our wedding in Muntilan.",
    url: "/",
    siteName: "Together Forever",
    locale: "en_ID",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
