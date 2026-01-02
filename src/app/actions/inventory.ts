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
  limit 
} from 'firebase/firestore';
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

// --- ACCIÓN 1: CREAR PRODUCTO (ROBUSTA + CATEGORÍAS) ---
export async function createProductAction(formData: FormData) {
  const batch = writeBatch(db);
  const productRef = doc(collection(db, 'products')); // Padre
  const skuRef = doc(collection(db, 'skus'));         // Hijo (Variante)

  // 1. Procesar Imágenes (ImgBB)
  const files = formData.getAll('images') as File[];
  const imageUrls: string[] = [];

  for (const file of files) {
    if (file.size > 0 && file.name !== 'undefined') {
      const url = await uploadToImgBB(file);
      if (url) imageUrls.push(url);
    }
  }

  // 2. Extraer Datos
  const name = formData.get('name') as string;
  const brand = formData.get('brand') as string;
  const category = formData.get('category') as string; // Ahora viene del Select
  const description = formData.get('description') as string;
  
  const price = parseFloat(formData.get('price') as string);
  const cost = parseFloat(formData.get('cost') as string);
  const stock = parseInt(formData.get('initialStock') as string);
  const sku = formData.get('sku') as string;
  const barcode = formData.get('barcode') as string;
  const variantDetail = formData.get('variantDetail') as string;

  // 3. Preparar Documento Padre (Producto General)
  batch.set(productRef, {
    name,
    brand,
    category,
    description,
    images: imageUrls, // Todas las fotos
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // 4. Preparar Documento Hijo (SKU/Variante para el POS)
  // NOTA: Guardamos category y brand aquí también (denormalización) para facilitar el POS
  batch.set(skuRef, {
    productId: productRef.id,
    name: variantDetail ? `${name} - ${variantDetail}` : name, // Nombre completo
    shortName: name,
    variantName: variantDetail,
    sku,
    barcode,
    price,
    cost,
    stock,
    category, // Importante para filtros
    brand,
    image: imageUrls.length > 0 ? imageUrls[0] : null, // Foto principal para el POS
    attributes: { variant: variantDetail },
    createdAt: new Date()
  });

  await batch.commit();
  
  redirect('/dashboard/inventory');
}

// --- ACCIÓN 2: ACTUALIZAR PRODUCTO (EDICIÓN) ---
export async function updateProductAction(formData: FormData) {
  const id = formData.get('id') as string;     // ID del SKU
  const productId = formData.get('productId') as string; // ID del Padre
  
  const skuRef = doc(db, 'skus', id);
  const productRef = productId ? doc(db, 'products', productId) : null;

  // 1. Manejo de Nueva Imagen (Si se sube una nueva)
  const files = formData.getAll('images') as File[];
  let newImageUrl = '';

  if (files.length > 0 && files[0].size > 0 && files[0].name !== 'undefined') {
    newImageUrl = await uploadToImgBB(files[0]);
  }

  // 2. Datos
  const name = formData.get('name') as string;
  const price = Number(formData.get('price'));
  const cost = Number(formData.get('cost'));
  const barcode = formData.get('barcode') as string;
  const variant = formData.get('variantDetail') as string;
  
  // Datos que van al padre y al hijo
  const category = formData.get('category') as string;
  const brand = formData.get('brand') as string;
  const description = formData.get('description') as string;

  // 3. Actualizar SKU
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

  // 4. Actualizar Padre (Si existe)
  if (productRef) {
    const productUpdateData: any = {
      name,
      brand,
      category,
      description
    };
    if (newImageUrl) {
        // Lógica simple: agregamos la nueva al array o reemplazamos
        // Para este caso, simplificamos reemplazando la primera o agregando
        // En un sistema real gestionarías el array de fotos completo
    }
    await updateDoc(productRef, productUpdateData);
  }

  redirect(`/dashboard/inventory`);
}

// --- ACCIÓN 3: ELIMINAR ---
export async function deleteProductAction(formData: FormData) {
  const id = formData.get('id') as string;
  if (!id) return;
  await deleteDoc(doc(db, 'skus', id));
  // Nota: Deberíamos borrar el padre también si no tiene más hijos, 
  // pero por seguridad en este MVP solo borramos el SKU de venta.
  redirect('/dashboard/inventory');
}

// --- ACCIÓN 4: CREAR CATEGORÍA (NUEVO) ---
export async function createCategoryAction(formData: FormData) {
  const name = formData.get('name') as string;
  if (!name) return;
  await addDoc(collection(db, 'categories'), {
    name: name.trim(),
    createdAt: new Date()
  });
  return { success: true };
}

// --- ACCIÓN 5: OBTENER CATEGORÍAS (NUEVO) ---
export async function getCategoriesAction() {
  try {
    const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
  } catch (error) {
    console.error("Error cat:", error);
    return [];
  }
}

// --- ACCIÓN 6: OBTENER INVENTARIO (LISTADO) ---
export async function getInventoryAction() {
  try {
    // Leemos la colección de SKUs que son los ítems vendibles
    const q = query(collection(db, 'skus'), orderBy('createdAt', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name, // "Termo Owala - Rojo"
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

