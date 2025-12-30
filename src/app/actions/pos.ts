'use server'

import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

// --- VERIFICAR SI HAY TURNO ABIERTO ---
export async function checkActiveSession(userId: string) {
  try {
    const q = query(
      collection(db, 'cash_sessions'),
      where('userId', '==', userId),
      where('status', '==', 'open')
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      // Retornamos el ID de la sesión y la fecha de apertura
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error("Error verificando sesión:", error);
    return null;
  }
}

// --- ABRIR CAJA (NUEVO TURNO) ---
export async function openSessionAction(formData: FormData) {
  const userId = formData.get('userId') as string;
  const userName = formData.get('userName') as string;
  const initialCash = Number(formData.get('initialCash'));

  if (!userId) throw new Error("Usuario no identificado");

  // Doble seguridad: Verificar que no tenga una abierta ya
  const active = await checkActiveSession(userId);
  if (active) {
    throw new Error("Ya tienes una caja abierta");
  }

  // Crear la sesión en Firestore
  await addDoc(collection(db, 'cash_sessions'), {
    userId,
    userName,
    openedAt: Timestamp.now(),
    closedAt: null,
    initialCash: initialCash || 0, // Fondo de caja
    finalCash: null,
    difference: 0,
    status: 'open',
    storeId: 'sucursal_principal' // Hardcodeado por ahora, útil para el futuro
  });

  // Recargamos la ruta para que la UI detecte el cambio
  revalidatePath('/dashboard/sales');
}
