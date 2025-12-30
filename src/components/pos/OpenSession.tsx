'use client';

import { openSessionAction } from '@/app/actions/pos';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function OpenSession() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cash, setCash] = useState('');

  if (!userData) return null;

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 w-full max-w-md text-center">
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
          🔐
        </div>
        
        <h2 className="text-2xl font-black text-gray-800 mb-2">Apertura de Caja</h2>
        <p className="text-gray-500 text-sm mb-8">
          Hola <strong>{userData.name}</strong>. Para comenzar a vender, ingresa el monto de efectivo inicial en caja (Fondo).
        </p>

        <form action={async (formData) => {
          setLoading(true);
          await openSessionAction(formData);
          // No necesitamos setLoading(false) porque la página se recargará y cambiará de vista
        }}>
          {/* Datos ocultos necesarios para la lógica */}
          <input type="hidden" name="userId" value={userData.uid} />
          <input type="hidden" name="userName" value={userData.name} />

          <div className="mb-6 text-left">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">
              Fondo de Caja (C$)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-4 text-gray-400 font-bold">C$</span>
              <input 
                name="initialCash"
                type="number" 
                step="0.01"
                required
                value={cash}
                onChange={(e) => setCash(e.target.value)}
                placeholder="0.00"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-2xl font-bold text-gray-800 focus:border-blue-500 focus:bg-white outline-none transition"
              />
            </div>
            {/* Botones rápidos */}
            <div className="flex gap-2 mt-3 overflow-x-auto hide-scrollbar">
              {[0, 500, 1000, 2000, 5000].map(amount => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setCash(amount.toString())}
                  className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-bold text-gray-600 hover:bg-blue-100 hover:text-blue-600 transition"
                >
                  {amount === 0 ? 'Vacío' : `C$ ${amount}`}
                </button>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition flex items-center justify-center gap-2"
          >
            {loading ? 'Abriendo Turno...' : (
              <>
                <span>Abrir Caja y Vender</span>
                <span>➡️</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
