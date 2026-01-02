'use server'

import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  Timestamp, 
  runTransaction, 
  doc, 
  increment,
  updateDoc,
  getDoc,
  addDoc
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

// --- 1. VERIFICAR SESIÓN ACTIVA (Con Fix de Fechas) ---
export async function checkActiveSession(userId: string) {
  try {
    const q = query(collection(db, 'cash_sessions'), where('userId', '==', userId), where('status', '==', 'open'));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const d = snapshot.docs[0];
      const data = d.data();
      
      return { 
        id: d.id, 
        ...data, 
        // FIX: Convertimos Timestamp a milisegundos para evitar error de serialización
        openedAt: data.openedAt instanceof Timestamp ? data.openedAt.toMillis() : Date.now() 
      };
    }
    return null;
  } catch (error) {
    console.error("Error checking session:", error);
    return null;
  }
}

// --- 2. ABRIR CAJA (LÓGICA ORIGINAL) ---
export async function openSessionAction(formData: FormData) {
  const userId = formData.get('userId') as string;
  const userName = formData.get('userName') as string;
  const initialCash = Number(formData.get('initialCash'));

  if (!userId) throw new Error("Usuario requerido");

  const active = await checkActiveSession(userId);
  if (active) throw new Error("Ya tienes caja abierta");

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Contador Diario
      const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, ''); 
      const counterRef = doc(db, 'counters', `sessions_${dateStr}`);
      const counterDoc = await transaction.get(counterRef);

      let newCount = 1;
      if (counterDoc.exists()) {
        newCount = counterDoc.data().count + 1;
      }

      // 2. ID Legible (CS250102-001)
      const readableId = `CS${dateStr}-${String(newCount).padStart(3, '0')}`;

      // 3. Actualizar Contador
      if (counterDoc.exists()) {
        transaction.update(counterRef, { count: increment(1) });
      } else {
        transaction.set(counterRef, { count: 1 });
      }

      // 4. Crear Sesión
      const sessionRef = doc(collection(db, 'cash_sessions'));
      transaction.set(sessionRef, {
        readableId,
        sessionNumber: newCount,
        userId,
        userName,
        initialCash,
        openedAt: Timestamp.now(),
        status: 'open',
        salesCount: 0,
        totalSales: 0,
        finalCash: null,
        difference: null,
        notes: null,
        closedAt: null
      });
    });

    revalidatePath('/dashboard/sales');
    return { success: true };

  } catch (error) {
    console.error("Error opening session:", error);
    throw new Error("No se pudo abrir la caja");
  }
}

// --- 3. BUSCAR PRODUCTOS (FIX: TIPO EXPLÍCITO) ---
export async function searchProductsAction(term: string) {
  if (!term || term.length < 2) return [];
  try {
    const snapshot = await getDocs(collection(db, 'skus'));
    const termLower = term.toLowerCase();
    
    // Mapeamos explícitamente las propiedades para que TypeScript no se queje
    const allProducts = snapshot.docs.map(doc => {
      const d = doc.data();
      return { 
        id: doc.id, 
        name: String(d.name || ''),    // <-- Definimos que es string
        sku: String(d.sku || ''),      // <-- Definimos que es string
        barcode: String(d.barcode || ''),
        brand: String(d.brand || ''),
        category: String(d.category || ''),
        image: d.image || null,
        
        // Convertimos números
        price: Number(d.price) || 0,
        stock: Number(d.stock) || 0
      };
    });

    // Filtramos
    const results = allProducts.filter(item => (
        (item.name.toLowerCase().includes(termLower)) ||
        (item.sku.toLowerCase().includes(termLower)) ||
        (item.barcode.includes(term)) ||
        (item.brand.toLowerCase().includes(termLower)) || 
        (item.category.toLowerCase().includes(termLower))
    )).slice(0, 20);

    return results;

  } catch (e) {
    console.error(e);
    return [];
  }
}

// --- 4. PROCESAR VENTA (SIN CAMBIOS) ---
export async function processSaleAction(data: any) {
  const { session, cart, totals, customer, payment } = data;
  
  if (!session?.id || cart.length === 0) return { success: false, error: "Datos incompletos" };

  try {
    const res = await runTransaction(db, async (transaction) => {
      const itemReads = cart.map((i:any) => transaction.get(doc(db, 'skus', i.id)));
      const itemDocs = await Promise.all(itemReads);
      
      const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
      const counterRef = doc(db, 'counters', `sales_${dateStr}`);
      const counterDoc = await transaction.get(counterRef);

      itemDocs.forEach((d, idx) => {
        if (!d.exists() || (d.data().stock || 0) < cart[idx].quantity) {
          throw new Error(`Stock insuficiente: ${cart[idx].name}`);
        }
      });

      let newCount = 1;
      if (counterDoc.exists()) newCount = counterDoc.data().count + 1;
      const readableId = `HM${dateStr}-${String(newCount).padStart(3, '0')}`;

      cart.forEach((i:any) => transaction.update(doc(db, 'skus', i.id), { stock: increment(-i.quantity) }));
      
      if (counterDoc.exists()) transaction.update(counterRef, { count: increment(1) });
      else transaction.set(counterRef, { count: 1 });

      const saleRef = doc(collection(db, 'sales'));
      transaction.set(saleRef, {
        readableId,
        sessionId: session.id,
        userId: session.userId,
        userName: session.userName,
        customer, items: cart, totals, payment,
        status: 'completed',
        createdAt: Timestamp.now()
      });

      transaction.update(doc(db, 'cash_sessions', session.id), {
        salesCount: increment(1),
        totalSales: increment(totals.total)
      });

      return { success: true, saleId: readableId };
    });
    return res;
  } catch (e: any) {
    console.error("Error processing sale:", e);
    return { success: false, error: e.message };
  }
}

// --- 5. CERRAR CAJA ---
export async function closeSessionAction(formData: FormData) {
  const sessionId = formData.get('sessionId') as string;
  const finalCash = Number(formData.get('finalCash'));
  const notes = formData.get('notes');

  const ref = doc(db, 'cash_sessions', sessionId);
  const snap = await getDoc(ref);
  
  if (snap.exists()) {
    const data = snap.data();
    const expected = (data.initialCash || 0) + (data.totalSales || 0);
    await updateDoc(ref, {
      finalCash,
      difference: finalCash - expected,
      notes,
      status: 'closed',
      closedAt: Timestamp.now()
    });
    revalidatePath('/dashboard/sales');
  }
}

