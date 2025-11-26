import React, { useState } from 'react';
import { Participant } from '../types';
import { Button } from './Button';
import { Trash2, Plus, User } from 'lucide-react';

interface ParticipantManagerProps {
  participants: Participant[];
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
}

export const ParticipantManager: React.FC<ParticipantManagerProps> = ({ participants, onAdd, onRemove }) => {
  const [newName, setNewName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onAdd(newName.trim());
      setNewName('');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <User className="text-indigo-600" size={24} />
        Participantes
      </h2>
      
      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nombre (ej. Juan)"
          className="flex-1 rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
        />
        <Button type="submit" size="md" disabled={!newName.trim()}>
          <Plus size={18} />
          <span className="hidden sm:inline ml-1">Agregar</span>
        </Button>
      </form>

      <div className="flex flex-wrap gap-3">
        {participants.length === 0 && (
          <p className="text-gray-500 text-sm italic">Aún no hay participantes. ¡Agrega a alguien para empezar!</p>
        )}
        {participants.map((participant) => (
          <div 
            key={participant.id} 
            className="group flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 transition-all hover:border-indigo-200 hover:bg-indigo-50"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-xs">
              {participant.name.slice(0, 2).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-gray-700">{participant.name}</span>
            <button 
              onClick={() => onRemove(participant.id)}
              className="ml-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Eliminar participante"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};