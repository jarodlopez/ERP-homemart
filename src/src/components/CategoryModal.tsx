'use client';

import { useState } from 'react';
import { createCategoryAction } from '@/app/actions/inventory';

interface Props {
  onClose: () => void;
  onSuccess: (newCategoryName: string) => void;
}

export default function CategoryModal({ onClose, onSuccess }: Props) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    
    const formData = new FormData();
    formData.append('name', name);
    
    await createCategoryAction(formData);
    
    setLoading(false);
    onSuccess(name);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-xs rounded-2xl p-6 shadow-2xl animate-in zoom-in duration-200">
        <h3 className="font-bold text-gray-800 text-lg mb-4 text-center">Nueva Categoría</h3>
        
        <input 
          autoFocus
          type="text" 
          placeholder="Ej: Termos, Hogar..." 
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        />

        <div className="grid grid-cols-2 gap-2">
          <button onClick={onClose} className="py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100">Cancelar</button>
          <button onClick={handleSubmit} disabled={loading || !name} className="bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg active:scale-95 disabled:opacity-50">
            {loading ? '...' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  );
}
