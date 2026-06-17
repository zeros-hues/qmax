import type { Metadata } from "next";
import { Oxanium, Geist_Mono } from "next/font/google";
import "./globals.css";

const oxanium = Oxanium({
  variable: "--font-oxanium",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Qmax | Concept to Manufacturing",
  description: "End-to-end hardware and software development.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${oxanium.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className={`${oxanium.className} min-h-full flex flex-col bg-white`}>
        {children}
      </body>
    </html>
  );
}