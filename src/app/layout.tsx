import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "Monichs Gestionale",
  description: "Gestionale interno Monichs - Project Management con AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" className="dark" suppressHydrationWarning>
      <body className="font-inter">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
