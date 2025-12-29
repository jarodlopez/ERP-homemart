'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

// Definimos la estructura de nuestros usuarios
interface UserData {
  uid: string;
  email: string;
  role: 'admin' | 'vendedor' | 'bodeguero';
  name: string;
}

interface AuthContextType {
  user: User | null;         // Usuario técnico de Firebase
  userData: UserData | null; // Datos de negocio (Rol, Nombre)
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      
      if (currentUser) {
        setUser(currentUser);
        // Al detectar login, buscamos el rol en Firestore
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setUserData(docSnap.data() as UserData);
          } else {
            // Usuario autenticado pero sin registro en DB (Caso raro)
            console.error("Usuario sin datos en Firestore");
            setUserData(null);
          }
        } catch (error) {
          console.error("Error buscando rol:", error);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    router.push('/'); // Redirige al login
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

