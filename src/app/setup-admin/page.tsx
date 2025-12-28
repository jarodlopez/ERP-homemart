'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { UserProfile } from '@/types/user';

export default function SetupAdminPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [secretKey, setSecretKey] = useState(''); // Candado de seguridad
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const router = useRouter();

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    // 1. Candado de seguridad simple (Cámbialo si quieres)
    if (secretKey !== 'NICARAGUA2025') {
      setMsg('⛔ Código secreto incorrecto. No tienes permiso.');
      setLoading(false);
      return;
    }

    try {
      // 2. Crear usuario en Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 3. Preparar datos del Super Admin
      const adminProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName: name,
        role: 'admin', // <--- AQUÍ ESTÁ LA CLAVE
        permissions: {
          canManageInventory: true,
          canViewReports: true,
          canSell: true,
        },
        createdAt: new Date(),
      };

      // 4. Guardar en Firestore
      await setDoc(doc(db, 'users', user.uid), adminProfile);

      setMsg('✅ ¡Super Admin creado con éxito! Redirigiendo...');
      setTimeout(() => router.push('/dashboard'), 2000);

    } catch (error: any) {
      console.error(error);
      setMsg(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border-t-4 border-red-500">
        <h1 className="text-2xl font-bold text-red-600 mb-2">⚙️ Setup Inicial</h1>
        <p className="text-sm text-gray-500 mb-6">Herramienta de un solo uso para crear el Super Admin.</p>

        <form onSubmit={handleCreateAdmin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Código Secreto</label>
            <input 
              type="text" 
              required 
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="Ingresa la clave temporal"
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
          </div>

          <hr className="border-gray-200 my-4" />

          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre del Admin</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
          </div>

          {msg && <p className={`text-center font-medium ${msg.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>{msg}</p>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition disabled:opacity-50"
          >
            {loading ? 'Creando...' : 'Crear Super Admin'}
          </button>
        </form>
      </div>
    </div>
  );
}
