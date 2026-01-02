'use server'

import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  writeBatch, 
  updateDoc, 
  deleteDoc, 
  query, 
  getDocs, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// --- CONFIGURACIÓN IMGBB ---
const IMGBB_API_KEY = 'b922654effe3a1ab5ac85cc4c23f97b8'; // Tu API Key

async function uploadToImgBB(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  
  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    return data.data?.url || '';
  } catch (error) {
    console.error("Error subiendo imagen:", error);
    return '';
  }
}

// --- 1. OBTENER INVENTARIO (LISTADO) ---
export async function getInventoryAction() {
  try {
    // Ordenamos por creación descendente para ver lo más nuevo primero
    const q = query(collection(db, 'skus'), orderBy('createdAt', 'desc'), limit(100));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name, // Nombre compuesto: "Producto - Variante"
        sku: data.sku,
        price: data.price,
        stock: data.stock,
        category: data.category || 'General',
        brand: data.brand || '',
        image: data.image || null, // URL de ImgBB
      };
    });
  } catch (error) {
    console.error("Error inventario:", error);
    return [];
  }
}

// --- 2. CREAR PRODUCTO (ROBUSTA + IMGBB + CATEGORÍAS) ---
export async function createProductAction(formData: FormData) {
  const batch = writeBatch(db);
  const productRef = doc(collection(db, 'products')); // Padre
  const skuRef = doc(collection(db, 'skus'));         // Hijo (Variante)

  // A. Procesar Imágenes (ImgBB)
  const files = formData.getAll('images') as File[];
  const imageUrls: string[] = [];

  for (const file of files) {
    if (file.size > 0 && file.name !== 'undefined') {
      const url = await uploadToImgBB(file);
      if (url) imageUrls.push(url);
    }
  }

  // B. Extraer Datos
  const name = formData.get('name') as string;
  const brand = formData.get('brand') as string;
  const category = formData.get('category') as string;
  const description = formData.get('description') as string;
  
  const price = parseFloat(formData.get('price') as string);
  const cost = parseFloat(formData.get('cost') as string);
  const stock = parseInt(formData.get('initialStock') as string);
  const sku = formData.get('sku') as string;
  const barcode = formData.get('barcode') as string;
  const variantDetail = formData.get('variantDetail') as string;

  // C. Guardar Documento Padre
  batch.set(productRef, {
    name,
    brand,
    category,
    description,
    images: imageUrls,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });

  // D. Guardar Documento Hijo (SKU)
  batch.set(skuRef, {
    productId: productRef.id,
    name: variantDetail ? `${name} - ${variantDetail}` : name,
    shortName: name,
    variantName: variantDetail,
    sku,
    barcode,
    price,
    cost,
    stock,
    category, // Importante para filtros en POS
    brand,
    image: imageUrls.length > 0 ? imageUrls[0] : null,
    attributes: { variant: variantDetail },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });

  await batch.commit();
  
  revalidatePath('/dashboard/inventory');
  redirect('/dashboard/inventory');
}

// --- 3. ACTUALIZAR PRODUCTO (EDICIÓN COMPLETA) ---
export async function updateProductAction(formData: FormData) {
  const id = formData.get('id') as string;     // ID del SKU
  const productId = formData.get('productId') as string; // ID del Padre
  
  const skuRef = doc(db, 'skus', id);
  const productRef = productId ? doc(db, 'products', productId) : null;

  // A. Imagen nueva (si la hay)
  const files = formData.getAll('images') as File[];
  let newImageUrl = '';
  if (files.length > 0 && files[0].size > 0 && files[0].name !== 'undefined') {
    newImageUrl = await uploadToImgBB(files[0]);
  }

  // B. Datos
  const name = formData.get('name') as string;
  const price = Number(formData.get('price'));
  const cost = Number(formData.get('cost'));
  const barcode = formData.get('barcode') as string;
  const variant = formData.get('variantDetail') as string;
  
  const category = formData.get('category') as string;
  const brand = formData.get('brand') as string;
  const description = formData.get('description') as string;

  // C. Actualizar SKU
  const skuUpdateData: any = {
    name: variant ? `${name} - ${variant}` : name,
    price,
    cost,
    barcode,
    category,
    brand,
    attributes: { variant }
  };
  
  if (newImageUrl) skuUpdateData.image = newImageUrl;

  await updateDoc(skuRef, skuUpdateData);

  // D. Actualizar Padre
  if (productRef) {
    const productUpdateData: any = {
      name,
      brand,
      category,
      description
    };
    await updateDoc(productRef, productUpdateData);
  }

  revalidatePath('/dashboard/inventory');
  redirect(`/dashboard/inventory`);
}

// --- 4. ACTUALIZAR STOCK RÁPIDO (LA FUNCIÓN QUE FALTABA) ---
export async function updateStockAction(formData: FormData) {
  const id = formData.get('id') as string;
  const newStock = parseInt(formData.get('newStock') as string);
  
  if (!id) return;
  
  const productRef = doc(db, 'skus', id);
  await updateDoc(productRef, { stock: newStock });
  
  revalidatePath('/dashboard/inventory');
  redirect('/dashboard/inventory');
}

// --- 5. ELIMINAR PRODUCTO ---
export async function deleteProductAction(formData: FormData) {
  const id = formData.get('id') as string;
  if (!id) return;
  
  await deleteDoc(doc(db, 'skus', id));
  // Opcional: Borrar padre si no tiene más hijos (Lógica avanzada para V2)
  
  revalidatePath('/dashboard/inventory');
}

// --- 6. CATEGORÍAS: CREAR ---
export async function createCategoryAction(formData: FormData) {
  const name = formData.get('name') as string;
  if (!name) return;

  await addDoc(collection(db, 'categories'), {
    name: name.trim(),
    createdAt: Timestamp.now()
  });
  
  return { success: true };
}

// --- 7. CATEGORÍAS: OBTENER ---
export async function getCategoriesAction() {
  try {
    const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
  } catch (error) {
    console.error("Error obteniendo categorías:", error);
    return [];
  }
}

