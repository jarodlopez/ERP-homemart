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

// --- 1. VERIFICAR SESIÓN ACTIVA (IGUAL QUE ANTES) ---
export async function checkActiveSession(userId: string) {
  try {
    const q = query(collection(db, 'cash_sessions'), where('userId', '==', userId), where('status', '==', 'open'));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const data = doc.data();
      // Aseguramos que se retornen todos los campos clave
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

// --- 2. ABRIR CAJA (LÓGICA ORIGINAL RESTAURADA) ---
// Esta es la versión correcta que usa transacciones y contadores
export async function openSessionAction(formData: FormData) {
  const userId = formData.get('userId') as string;
  const userName = formData.get('userName') as string;
  const initialCash = Number(formData.get('initialCash'));

  if (!userId) throw new Error("Usuario requerido");

  // Verificación previa (opcional, la transacción lo maneja mejor)
  const active = await checkActiveSession(userId);
  if (active) throw new Error("Ya tienes caja abierta");

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Obtener contador diario
      const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
      const counterRef = doc(db, 'counters', `sessions_${dateStr}`);
      const counterDoc = await transaction.get(counterRef);

      // 2. Calcular nuevo número
      let newCount = 1;
      if (counterDoc.exists()) {
        newCount = counterDoc.data().count + 1;
      }

      // 3. Generar ID legible
      const readableId = `CS${dateStr}-${String(newCount).padStart(3, '0')}`;

      // 4. Actualizar contador
      if (counterDoc.exists()) {
        transaction.update(counterRef, { count: increment(1) });
      } else {
        transaction.set(counterRef, { count: 1 });
      }

      // 5. Crear sesión con TODOS los datos correctos
      const sessionRef = doc(collection(db, 'cash_sessions'));
      transaction.set(sessionRef, {
        readableId,        // <-- ESTO FALTABA
        sessionNumber: newCount, // <-- ESTO FALTABA
        userId,
        userName,
        openedAt: Timestamp.now(),
        status: 'open',
        initialCash,
        salesCount: 0,
        totalSales: 0,
        finalCash: null,
        difference: null,
        notes: null,
        closedAt: null
      });
    });
    
    revalidatePath('/dashboard/sales');
  } catch (error) {
    console.error("Error abriendo sesión:", error);
    throw new Error("Error al abrir la caja");
  }
}

// --- 3. BUSCAR PRODUCTOS (SEGURA) ---
export async function searchProductsAction(term: string) {
  if (!term || term.length < 2) return [];

  try {
    const productsRef = collection(db, 'skus');
    const snapshot = await getDocs(productsRef);
    const termLower = term.toLowerCase();

    const results = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as any))
      .filter(item => {
        return (
          (item.name && item.name.toLowerCase().includes(termLower)) ||
          (item.sku && item.sku.toLowerCase().includes(termLower)) ||
          (item.barcode && item.barcode.includes(term)) ||
          // Protección contra nulos en campos nuevos
          (item.category && item.category.toLowerCase().includes(termLower)) ||
          (item.brand && item.brand.toLowerCase().includes(termLower))
        );
      })
      .slice(0, 15);

    return results;
  } catch (error) {
    console.error("Error buscando productos:", error);
    return [];
  }
}

// --- 4. PROCESAR VENTA (LÓGICA ORIGINAL) ---
export async function processSaleAction(data: any) {
  const { session, cart, totals, customer, payment } = data;
  if (!session?.id || cart.length === 0) throw new Error("Datos inválidos");

  try {
    const saleResult = await runTransaction(db, async (transaction) => {
      // A. Lecturas
      const itemReads = cart.map((item:any) => transaction.get(doc(db, 'skus', item.id)));
      const itemDocs = await Promise.all(itemReads);
      
      const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
      const counterRef = doc(db, 'counters', `sales_${dateStr}`);
      const counterDoc = await transaction.get(counterRef);

      // B. Validaciones
      itemDocs.forEach((docSnap, index) => {
        if (!docSnap.exists()) throw new Error(`Producto ${cart[index].name} no existe`);
        if ((docSnap.data().stock || 0) < cart[index].quantity) {
          throw new Error(`Stock insuficiente para ${cart[index].name}`);
        }
      });

      // C. Cálculos
      let newCount = 1;
      if (counterDoc.exists()) newCount = counterDoc.data().count + 1;
      const readableId = `HM${dateStr}-${String(newCount).padStart(3, '0')}`;

      // D. Escrituras
      cart.forEach((item: any) => {
        transaction.update(doc(db, 'skus', item.id), { stock: increment(-item.quantity) });
      });

      if (counterDoc.exists()) transaction.update(counterRef, { count: increment(1) });
      else transaction.set(counterRef, { count: 1 });

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

      transaction.update(doc(db, 'cash_sessions', session.id), {
        salesCount: increment(1),
        totalSales: increment(totals.total)
      });

      return { success: true, saleId: readableId, dbId: saleRef.id };
    });
    return saleResult;
  } catch (error: any) {
    console.error("Error venta:", error);
    return { success: false, error: error.message };
  }
}

// --- 5. CERRAR CAJA (LÓGICA ORIGINAL) ---
export async function closeSessionAction(formData: FormData) {
  const sessionId = formData.get('sessionId') as string;
  const finalCash = Number(formData.get('finalCash'));
  const notes = formData.get('notes') as string;

  if (!sessionId) throw new Error("Sesión requerida");

  const sessionRef = doc(db, 'cash_sessions', sessionId);
  const sessionDoc = await getDoc(sessionRef);

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
 
