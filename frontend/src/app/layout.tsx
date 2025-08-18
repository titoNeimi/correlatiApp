import type { Metadata } from "next";
import './globals.css'

export const metadata: Metadata = {
  title: "Corralati App",
  description: "Una aplicacion en para tu carrera",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
