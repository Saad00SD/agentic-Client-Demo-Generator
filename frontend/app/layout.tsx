import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Client Demo Generator Agent",
  description: "Chat with the Groq-powered demo agent, upload client images, and preview and edit your branded website.",
  icons: {
    icon: { url: "/icon.svg", type: "image/svg+xml" },
  },
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
