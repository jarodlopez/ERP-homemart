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
  increment 
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

// --- 4. PROCESAR VENTA (CORREGIDO: LECTURAS ANTES DE ESCRITURAS) ---
export async function processSaleAction(data: any) {
  const { session, cart, totals, customer, payment } = data;

  if (!session?.id || cart.length === 0) throw new Error("Datos inválidos");

  try {
    const saleResult = await runTransaction(db, async (transaction) => {
      
      // --- FASE 1: LECTURAS (READS) ---
      // Leemos TODO lo necesario antes de escribir nada.
      
      // 1.1 Leer todos los productos del carrito para verificar stock
      const itemReads = [];
      for (const item of cart) {
        const itemRef = doc(db, 'skus', item.id);
        itemReads.push(transaction.get(itemRef));
      }
      const itemDocs = await Promise.all(itemReads);

      // 1.2 Leer el contador de ventas
      const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, ''); // 251229
      const counterRef = doc(db, 'counters', `sales_${dateStr}`);
      const counterDoc = await transaction.get(counterRef);

      // --- FASE 2: LÓGICA Y VALIDACIÓN ---
      
      // 2.1 Validar existencia y stock
      itemDocs.forEach((docSnap, index) => {
        if (!docSnap.exists()) throw new Error(`Producto ${cart[index].name} no existe`);
        
        const currentStock = docSnap.data().stock || 0;
        const requestedQty = cart[index].quantity;
        
        if (currentStock < requestedQty) {
          throw new Error(`Stock insuficiente para ${cart[index].name}. Disponible: ${currentStock}`);
        }
      });

      // 2.2 Calcular nuevo ID
      let newCount = 1;
      if (counterDoc.exists()) {
        newCount = counterDoc.data().count + 1;
      }
      const readableId = `HM${dateStr}-${String(newCount).padStart(3, '0')}`;


      // --- FASE 3: ESCRITURAS (WRITES) ---
      // Ahora sí, ejecutamos todos los cambios en la DB
      
      // 3.1 Descontar Stock
      cart.forEach((item: any) => {
        const itemRef = doc(db, 'skus', item.id);
        transaction.update(itemRef, { stock: increment(-item.quantity) });
      });

      // 3.2 Actualizar/Crear Contador
      if (counterDoc.exists()) {
        transaction.update(counterRef, { count: increment(1) });
      } else {
        transaction.set(counterRef, { count: 1 });
      }

      // 3.3 Crear la Venta
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

      // 3.4 Actualizar la Caja (Session)
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

