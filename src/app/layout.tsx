import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ERP HomeMart",
  description: "Sistema de gestión interna",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {/* Envolvemos toda la app para que la sesión funcione en todas partes */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

