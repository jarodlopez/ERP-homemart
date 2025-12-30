
'use server'

import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

// --- 1. VERIFICAR SI HAY TURNO ABIERTO ---
export async function checkActiveSession(userId: string) {
  try {
    const q = query(
      collection(db, 'cash_sessions'),
      where('userId', '==', userId),
      where('status', '==', 'open')
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      // Retornamos el ID de la sesión y sus datos
      const doc = snapshot.docs[0];
      const data = doc.data();
      
      // Convertimos timestamps a string/number para evitar error de serialización en Client Components
      return { 
        id: doc.id, 
        ...data,
        openedAt: data.openedAt ? data.openedAt.toMillis() : Date.now() 
      };
    }
    return null;
  } catch (error) {
    console.error("Error verificando sesión:", error);
    return null;
  }
}

// --- 2. ABRIR CAJA (NUEVO TURNO) ---
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
    storeId: 'sucursal_principal'
  });

  // Recargamos la ruta para que la UI detecte el cambio
  revalidatePath('/dashboard/sales');
}

// --- 3. BUSCAR PRODUCTOS (POS) ---
export async function searchProductsAction(term: string) {
  if (!term || term.length < 2) return [];

  try {
    const productsRef = collection(db, 'skus');
    const snapshot = await getDocs(productsRef);
    
    const termLower = term.toLowerCase();

    // Filtramos en memoria (eficiente para inventarios pequeños/medianos)
    const results = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as any))
      .filter(item => {
        // Buscamos coincidencia en Nombre, SKU o Código de Barras
        return (
          (item.name && item.name.toLowerCase().includes(termLower)) ||
          (item.sku && item.sku.toLowerCase().includes(termLower)) ||
          (item.barcode && item.barcode.includes(term))
        );
      })
      .slice(0, 10); // Máximo 10 resultados para no saturar la vista

    return results;
  } catch (error) {
    console.error("Error buscando:", error);
    return [];
  }
}
