import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Client Demo Generator",
  description: "Generate customized client demo websites from your entered details and the existing master template.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full dark">
      <body className="min-h-full bg-gray-950 text-gray-100 antialiased flex flex-col">
        {children}
      </body>
    </html>
  );
}
