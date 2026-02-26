import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PortalTutoriaPublic() {
  const nav = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="p-8 rounded-md shadow-lg bg-white text-gray-900 max-w-xl">
        <h2 className="text-2xl font-bold mb-4">Portal de Tutoria</h2>
        <p className="mb-4">Área de gestão de erros e planos de ação. Faça login para aceder ao portal.</p>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={() => nav('/login')}>Entrar</button>
        </div>
      </div>
    </div>
  );
}
