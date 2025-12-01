import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FitCoin Challenge",
  description: "Internal betting app for a group of colleagues participating in a physique and fitness challenge",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        {children}
      </body>
    </html>
  );
}
