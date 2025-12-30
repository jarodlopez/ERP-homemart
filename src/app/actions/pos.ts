'use server'

import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  Timestamp, 
  runTransaction, 
  doc, 
  increment,
  updateDoc // Importante agregar este import
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

// --- 1. VERIFICAR SESIÓN ---
export async function checkActiveSession(userId: string) {
  try {
    const q = query(collection(db, 'cash_sessions'), where('userId', '==', userId), where('status', '==', 'open'));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const data = doc.data();
      return { id: doc.id, ...data, openedAt: data.openedAt ? data.openedAt.toMillis() : Date.now() };
    }
    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

// --- 2. ABRIR CAJA ---
export async function openSessionAction(formData: FormData) {
  const userId = formData.get('userId') as string;
  const userName = formData.get('userName') as string;
  const initialCash = Number(formData.get('initialCash'));
  if (!userId) throw new Error("Usuario requerido");

  const active = await checkActiveSession(userId);
  if (active) throw new Error("Ya tienes caja abierta");

  await addDoc(collection(db, 'cash_sessions'), {
    userId,
    userName,
    openedAt: Timestamp.now(),
    status: 'open',
    initialCash,
    salesCount: 0,
    totalSales: 0
  });
  revalidatePath('/dashboard/sales');
}

// --- 3. BUSCAR PRODUCTOS ---
export async function searchProductsAction(term: string) {
  if (!term || term.length < 2) return [];
  try {
    const productsRef = collection(db, 'skus');
    const snapshot = await getDocs(productsRef);
    const termLower = term.toLowerCase();
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as any))
      .filter(item => (
        (item.name?.toLowerCase().includes(termLower)) ||
        (item.sku?.toLowerCase().includes(termLower)) ||
        (item.barcode?.includes(term))
      ))
      .slice(0, 10);
  } catch (error) {
    return [];
  }
}

// --- 4. PROCESAR VENTA ---
export async function processSaleAction(data: any) {
  const { session, cart, totals, customer, payment } = data;

  if (!session?.id || cart.length === 0) throw new Error("Datos inválidos");

  try {
    const saleResult = await runTransaction(db, async (transaction) => {
      
      // FASE 1: LECTURAS
      const itemReads = [];
      for (const item of cart) {
        const itemRef = doc(db, 'skus', item.id);
        itemReads.push(transaction.get(itemRef));
      }
      const itemDocs = await Promise.all(itemReads);

      const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, ''); 
      const counterRef = doc(db, 'counters', `sales_${dateStr}`);
      const counterDoc = await transaction.get(counterRef);

      // FASE 2: VALIDACIÓN
      itemDocs.forEach((docSnap, index) => {
        if (!docSnap.exists()) throw new Error(`Producto ${cart[index].name} no existe`);
        const currentStock = docSnap.data().stock || 0;
        if (currentStock < cart[index].quantity) {
          throw new Error(`Stock insuficiente para ${cart[index].name}. Disponible: ${currentStock}`);
        }
      });

      let newCount = 1;
      if (counterDoc.exists()) {
        newCount = counterDoc.data().count + 1;
      }
      const readableId = `HM${dateStr}-${String(newCount).padStart(3, '0')}`;

      // FASE 3: ESCRITURAS
      cart.forEach((item: any) => {
        const itemRef = doc(db, 'skus', item.id);
        transaction.update(itemRef, { stock: increment(-item.quantity) });
      });

      if (counterDoc.exists()) {
        transaction.update(counterRef, { count: increment(1) });
      } else {
        transaction.set(counterRef, { count: 1 });
      }

      const saleRef = doc(collection(db, 'sales'));
      transaction.set(saleRef, {
        readableId,
        sessionId: session.id,
        userId: session.userId,
        userName: session.userName,
        customer: customer || { name: 'Cliente General' },
        items: cart,
        totals,
        payment,
        status: 'completed',
        createdAt: Timestamp.now()
      });

      const sessionRef = doc(db, 'cash_sessions', session.id);
      transaction.update(sessionRef, {
        salesCount: increment(1),
        totalSales: increment(totals.total)
      });

      return { success: true, saleId: readableId, dbId: saleRef.id };
    });

    return saleResult;

  } catch (error: any) {
    console.error("Error en transacción:", error);
    return { success: false, error: error.message };
  }
}

// --- 5. CERRAR CAJA (ARQUEO) ---
export async function closeSessionAction(formData: FormData) {
  const sessionId = formData.get('sessionId') as string;
  const finalCash = Number(formData.get('finalCash'));
  const notes = formData.get('notes') as string;

  if (!sessionId) throw new Error("Sesión requerida");

  const sessionRef = doc(db, 'cash_sessions', sessionId);
  const sessionDoc = await import('firebase/firestore').then(mod => mod.getDoc(sessionRef)); 

  if (!sessionDoc.exists()) throw new Error("Sesión no encontrada");
  
  const data = sessionDoc.data();
  const expectedCash = (data.initialCash || 0) + (data.totalSales || 0); 
  const difference = finalCash - expectedCash;

  await updateDoc(sessionRef, {
    finalCash,
    difference,
    notes,
    status: 'closed',
    closedAt: Timestamp.now()
  });

  revalidatePath('/dashboard/sales');
}
 
