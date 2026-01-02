'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { checkActiveSession } from '@/app/actions/pos'; 
import OpenSession from '@/components/pos/OpenSession';
import PosInterface from '@/components/pos/PosInterface';

export default function SalesPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const [session, setSession] = useState<any>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Función reutilizable para buscar sesión
  const fetchSession = useCallback(async () => {
    if (!user) return;
    try {
      const activeSession = await checkActiveSession(user.uid);
      setSession(activeSession);
    } catch (error) {
      console.error("Error buscando sesión:", error);
    } finally {
      setCheckingSession(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchSession();
    }
  }, [authLoading, fetchSession]);

  if (authLoading || checkingSession) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-gray-400 gap-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Verificando turno...</p>
      </div>
    );
  }

  // Si hay sesión -> POS
  if (session) {
    return <PosInterface session={session} />;
  }

  // Si no -> Apertura (Pasando la función de recarga)
  return (
    <OpenSession 
      userData={userData} 
      userId={user?.uid || ''}
      onSessionStart={fetchSession} // <--- Vital
    />
  );
}
 
