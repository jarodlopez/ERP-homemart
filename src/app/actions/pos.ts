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
  updateDoc,
  getDoc
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

// --- 1. VERIFICAR SESIÓN ACTIVA ---
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

  const active = await checkActiveSession(userId);
  if (active) {
    throw new Error("Ya tienes una caja abierta");
  }

  await addDoc(collection(db, 'cash_sessions'), {
    userId,
    userName,
    openedAt: Timestamp.now(),
    status: 'open',
    initialCash: initialCash || 0,
    salesCount: 0,
    totalSales: 0
  });

  revalidatePath('/dashboard/sales');
}

// --- 3. BUSCAR PRODUCTOS (ACTUALIZADO: BUSCA POR CATEGORÍA Y MARCA) ---
export async function searchProductsAction(term: string) {
  if (!term || term.length < 2) return [];

  try {
    const productsRef = collection(db, 'skus');
    const snapshot = await getDocs(productsRef);
    
    const termLower = term.toLowerCase();

    // Filtramos en memoria
    const results = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as any))
      .filter(item => {
        return (
          (item.name && item.name.toLowerCase().includes(termLower)) ||
          (item.sku && item.sku.toLowerCase().includes(termLower)) ||
          (item.barcode && item.barcode.includes(term)) ||
          (item.category && item.category.toLowerCase().includes(termLower)) || // Nuevo
          (item.brand && item.brand.toLowerCase().includes(termLower))          // Nuevo
        );
      })
      .slice(0, 15); // Aumenté un poco el límite de resultados

    return results;
  } catch (error) {
    console.error("Error buscando productos:", error);
    return [];
  }
}

// --- 4. PROCESAR VENTA (TRANSACCIÓN ROBUSTA) ---
export async function processSaleAction(data: any) {
  const { session, cart, totals, customer, payment } = data;

  if (!session?.id || cart.length === 0) throw new Error("Datos de venta inválidos");

  try {
    const saleResult = await runTransaction(db, async (transaction) => {
      
      // --- FASE 1: LECTURAS (READS) ---
      const itemReads = [];
      for (const item of cart) {
        const itemRef = doc(db, 'skus', item.id);
        itemReads.push(transaction.get(itemRef));
      }
      const itemDocs = await Promise.all(itemReads);

      const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
      const counterRef = doc(db, 'counters', `sales_${dateStr}`);
      const counterDoc = await transaction.get(counterRef);

      // --- FASE 2: VALIDACIONES ---
      itemDocs.forEach((docSnap, index) => {
        if (!docSnap.exists()) throw new Error(`Producto ${cart[index].name} no existe`);
        
        const currentStock = docSnap.data().stock || 0;
        const requestedQty = cart[index].quantity;
        
        if (currentStock < requestedQty) {
          throw new Error(`Stock insuficiente para ${cart[index].name}. Disponible: ${currentStock}`);
        }
      });

      // Calcular ID
      let newCount = 1;
      if (counterDoc.exists()) {
        newCount = counterDoc.data().count + 1;
      }
      const readableId = `HM${dateStr}-${String(newCount).padStart(3, '0')}`;


      // --- FASE 3: ESCRITURAS (WRITES) ---
      
      // 3.1 Descontar Stock
      cart.forEach((item: any) => {
        const itemRef = doc(db, 'skus', item.id);
        transaction.update(itemRef, { stock: increment(-item.quantity) });
      });

      // 3.2 Actualizar Contador
      if (counterDoc.exists()) {
        transaction.update(counterRef, { count: increment(1) });
      } else {
        transaction.set(counterRef, { count: 1 });
      }

      // 3.3 Crear Venta
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

      // 3.4 Actualizar Caja (Sumar venta al turno)
      const sessionRef = doc(db, 'cash_sessions', session.id);
      transaction.update(sessionRef, {
        salesCount: increment(1),
        totalSales: increment(totals.total)
      });

      return { success: true, saleId: readableId, dbId: saleRef.id };
    });

    return saleResult;

  } catch (error: any) {
    console.error("Error en transacción de venta:", error);
    return { success: false, error: error.message };
  }
}

// --- 5. CERRAR CAJA (ARQUEO) ---
export async function closeSessionAction(formData: FormData) {
  const sessionId = formData.get('sessionId') as string;
  const finalCash = Number(formData.get('finalCash'));
  const notes = formData.get('notes') as string;

  if (!sessionId) throw new Error("ID de sesión requerido");

  const sessionRef = doc(db, 'cash_sessions', sessionId);
  const sessionDoc = await getDoc(sessionRef);

  if (!sessionDoc.exists()) throw new Error("Sesión no encontrada");
  
  const data = sessionDoc.data();
  
  // Cálculo básico de diferencia
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
