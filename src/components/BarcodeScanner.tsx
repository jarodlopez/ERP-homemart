'use client';

import { Html5QrcodeScanner } from 'html5-qrcode';
import { useEffect } from 'react';

interface Props {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScanSuccess, onClose }: Props) {
  useEffect(() => {
    // Configuración del scanner
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 150 }, // Más rectangular para códigos de barras
        aspectRatio: 1.0
      },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        onScanSuccess(decodedText);
        // Limpiamos el scanner tras el éxito para evitar lecturas múltiples
        scanner.clear().catch(err => console.error(err));
      },
      (errorMessage) => {
        // Ignorar errores de "no se detectó código en este frame"
      }
    );

    // Limpieza al cerrar el componente
    return () => {
      scanner.clear().catch(error => console.error("Error clearing scanner", error));
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-4 rounded-2xl w-full max-w-sm relative">
        <button 
          onClick={onClose}
          type="button"
          className="absolute -top-12 right-0 text-white font-bold bg-gray-800/50 rounded-full w-10 h-10 flex items-center justify-center border border-white/20"
        >
          ✕
        </button>
        <h3 className="text-center font-bold mb-2 text-gray-800">Escaneando...</h3>
        
        {/* Aquí se renderiza la cámara */}
        <div id="reader" className="w-full overflow-hidden rounded-lg"></div>
        
        <p className="text-xs text-center text-gray-500 mt-4">Apunta la cámara al código de barras</p>
      </div>
    </div>
  );
}
