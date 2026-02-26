import React, { useEffect, useState } from 'react';
import axios from '../lib/axios';

type ErrorItem = { id: number; title: string; description?: string; status: string };

export default function PortalTutoria() {
  const [errors, setErrors] = useState<ErrorItem[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const load = async () => {
    const res = await axios.get('/api/tutoria/errors');
    setErrors(res.data || []);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    await axios.post('/api/tutoria/errors', { title, description });
    setTitle(''); setDescription('');
    load();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Portal de Tutoria</h1>
      <div className="mb-6">
        <h2 className="font-semibold">Criar Erro</h2>
        <input className="border p-2 w-full mb-2" placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} />
        <textarea className="border p-2 w-full mb-2" placeholder="Descrição" value={description} onChange={e => setDescription(e.target.value)} />
        <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={create}>Criar</button>
      </div>

      <div>
        <h2 className="font-semibold mb-2">Erros</h2>
        <ul className="space-y-2">
          {errors.map(e => (
            <li key={e.id} className="border p-3 rounded">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold">{e.title}</div>
                  <div className="text-sm text-gray-600">{e.description}</div>
                </div>
                <div className="text-sm">{e.status}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
