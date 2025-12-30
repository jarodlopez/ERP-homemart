'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { checkActiveSession } from '@/app/actions/pos'; // Importamos la acción, pero la llamaremos con cuidado
import OpenSession from '@/components/pos/OpenSession';
import PosInterface from '@/components/pos/PosInterface';

export default function SalesPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const [session, setSession] = useState<any>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Efecto para buscar sesión activa en Firestore
  useEffect(() => {
    async function verify() {
      if (user) {
        // Llamamos a la acción del servidor
        const activeSession = await checkActiveSession(user.uid);
        setSession(activeSession);
      }
      setCheckingSession(false);
    }

    if (!authLoading) {
      verify();
    }
  }, [user, authLoading]);

  // Estados de carga
  if (authLoading || checkingSession) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-gray-400 gap-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Verificando turno de caja...</p>
      </div>
    );
  }

  // LÓGICA DE DECISIÓN:
  
  // 1. Si hay sesión activa -> Muestra el POS
  if (session) {
    return <PosInterface session={session} />;
  }

  // 2. Si NO hay sesión -> Muestra formulario de apertura
  return <OpenSession />;
}
