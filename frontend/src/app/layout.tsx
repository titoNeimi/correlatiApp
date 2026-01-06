import type { Metadata } from "next";
import './globals.css'
import { UserProvider } from '@/context/UserContext'

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
      <UserProvider>
        {children}
      </UserProvider>
      </body>
    </html>
  );
}
