import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tandresai.online"),
  title: "Tandres Simplicity AI Studio",
  description: "Next-gen AI media tools for content creators.",
  icons: {
    icon: "/favicon.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="f2110ff8b7e09f689d7c62b6eafa38a0be90efcf" content="f2110ff8b7e09f689d7c62b6eafa38a0be90efcf" />
        <link rel="stylesheet" href="https://cdn.fluidplayer.com/v3/current/fluidplayer.min.css" type="text/css" />
      </head>
      <Script 
        src="https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js"
        strategy="beforeInteractive"
      />
      <body
        className={`${inter.variable} ${outfit.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
