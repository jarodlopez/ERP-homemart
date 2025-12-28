import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Asegúrate de que este archivo exista por defecto en Next.js
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ERP Inventory Mobile",
  description: "Sistema de gestión integral",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {/* Envolvemos la app en el AuthProvider, pero OJO:
            El AuthProvider tiene lógica de redirección cliente.
            Para rutas públicas (login) esto se maneja internamente. */}
        <div className="bg-gray-50 min-h-screen text-gray-900">
           {children}
        </div>
      </body>
    </html>
  );
}
