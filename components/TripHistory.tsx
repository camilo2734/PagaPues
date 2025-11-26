import React, { useState } from 'react';
import { Session } from '../types';
import { Button } from './Button';
import { Plus, Archive, Copy, Trash2, Calendar, FolderOpen, ArrowRight, RotateCcw, Users, Home } from 'lucide-react';
import { formatCurrency } from '../services/finance';

interface TripHistoryProps {
  sessions: Session[];
  onSelect: (id: string) => void;
  onCreate: (name: string, type: 'family' | 'friends') => void;
  onDuplicate: (id: string) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
}

interface SessionCardProps {
  session: Session;
  onSelect: (id: string) => void;
  onDuplicate: (id: string) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
}

const SessionCard: React.FC<SessionCardProps> = ({ 
  session, 
  onSelect, 
  onDuplicate, 
  onArchive, 
  onRestore, 
  onDelete 
}) => {
  const total = session.expenses.reduce((sum, e) => sum + e.amount, 0);
  const date = new Date(session.dateCreated).toLocaleDateString('es-CO', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  });
  
  const isFriends = session.type === 'friends';

  return (
    <div className={`bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow relative group ${isFriends ? 'border-purple-200' : 'border-gray-200'}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-lg text-gray-900 line-clamp-1 flex items-center gap-2">
            {session.name}
            {session.type && (
              <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded border ${isFriends ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                {isFriends ? 'Amigos' : 'Familia'}
              </span>
            )}
          </h3>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
            <Calendar size={12} /> {date}
          </p>
        </div>
        <div className="flex gap-1">
           <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); onDuplicate(session.id); }}
              className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
              title="Duplicar viaje"
           >
             <Copy size={16} />
           </button>
           {session.status === 'active' ? (
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); onArchive(session.id); }}
                className="p-1.5 text-gray-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition-colors"
                title="Archivar"
              >
                <Archive size={16} />
              </button>
           ) : (
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); onRestore(session.id); }}
                className="p-1.5 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                title="Restaurar"
              >
                <RotateCcw size={16} />
              </button>
           )}
           <button 
              type="button"
              onClick={(e) => { 
                e.preventDefault();
                e.stopPropagation(); 
                onDelete(session.id); 
              }}
              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              title="Eliminar permanentemente"
           >
             <Trash2 size={16} />
           </button>
        </div>
      </div>
      
      <div className="flex items-end justify-between mt-4">
         <div>
           <span className="text-xs text-gray-500 uppercase font-semibold">Total Gastado</span>
           <div className={`text-xl font-bold ${isFriends ? 'text-purple-600' : 'text-indigo-600'}`}>{formatCurrency(total)}</div>
           <div className="text-xs text-gray-400 mt-1">
             {session.participants.length} participantes • {session.expenses.length} gastos
           </div>
         </div>
         
         <Button onClick={() => onSelect(session.id)} size="sm" className={isFriends ? "!bg-purple-600 hover:!bg-purple-700" : ""}>
           Abrir <ArrowRight size={16} className="ml-1" />
         </Button>
      </div>
    </div>
  );
};

export const TripHistory: React.FC<TripHistoryProps> = ({ 
  sessions, 
  onSelect, 
  onCreate, 
  onDuplicate, 
  onArchive, 
  onRestore, 
  onDelete 
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newTripName, setNewTripName] = useState('');
  const [tripType, setTripType] = useState<'family' | 'friends'>('family');
  const [viewArchived, setViewArchived] = useState(false);

  const activeSessions = sessions.filter(s => s.status === 'active').sort((a, b) => b.dateCreated - a.dateCreated);
  const archivedSessions = sessions.filter(s => s.status === 'archived').sort((a, b) => b.dateCreated - a.dateCreated);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTripName.trim()) {
      onCreate(newTripName.trim(), tripType);
      setNewTripName('');
      setTripType('family');
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      
      {/* Header & Create Action */}
      <div className="bg-indigo-600 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Historial de Viajes</h1>
          <p className="text-indigo-100 mb-6 max-w-lg">
            Gestiona tus eventos, viajes y cuentas compartidas.
            Elige entre modo Familia (serio) o Amigos (divertido).
          </p>
          
          {!isCreating ? (
            <button 
              type="button"
              onClick={() => setIsCreating(true)} 
              className="bg-white text-indigo-600 font-bold px-6 py-3 rounded-lg shadow-lg hover:bg-gray-50 transition-transform hover:scale-105 flex items-center"
            >
              <Plus size={20} className="mr-2" />
              Crear Nuevo Viaje
            </button>
          ) : (
            <form onSubmit={handleCreateSubmit} className="bg-white/20 p-4 rounded-xl border border-white/20 animate-in fade-in zoom-in duration-200">
              <div className="mb-4">
                <label className="block text-sm font-bold text-white mb-2">Nombre del viaje</label>
                <input 
                  autoFocus
                  type="text" 
                  value={newTripName}
                  onChange={(e) => setNewTripName(e.target.value)}
                  placeholder="Ej. Cartagena 2025"
                  className="w-full rounded-lg border border-indigo-500 bg-indigo-800 px-4 py-2 text-white placeholder-indigo-300 focus:ring-2 focus:ring-white outline-none"
                />
              </div>

              <div className="mb-4">
                 <label className="block text-sm font-bold text-white mb-2">Tipo de Viaje</label>
                 <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTripType('family')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition-all ${tripType === 'family' ? 'bg-white text-indigo-600 border-white' : 'bg-indigo-800/50 text-indigo-200 border-indigo-500 hover:bg-indigo-800'}`}
                    >
                      <Home size={18} /> Familiar
                    </button>
                    <button
                      type="button"
                      onClick={() => setTripType('friends')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition-all ${tripType === 'friends' ? 'bg-purple-500 text-white border-purple-400 shadow-lg' : 'bg-indigo-800/50 text-indigo-200 border-indigo-500 hover:bg-indigo-800'}`}
                    >
                      <Users size={18} /> Amigos
                    </button>
                 </div>
                 <p className="text-xs text-indigo-200 mt-2">
                   {tripType === 'family' ? 'Diseño limpio y clásico.' : 'Incluye medallas, estadísticas divertidas y colores vibrantes.'}
                 </p>
              </div>

              <div className="flex gap-2">
                <button 
                  type="submit" 
                  className="flex-1 bg-white text-indigo-700 font-bold px-4 py-2 rounded-lg hover:bg-gray-100 shadow-md transition-colors"
                >
                  Crear
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsCreating(false)} 
                  className="text-white hover:bg-white/20 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
        {/* Decorative circle */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500 rounded-full opacity-50 blur-3xl pointer-events-none"></div>
      </div>

      {/* Active Sessions List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FolderOpen size={24} className="text-indigo-600" />
            Viajes Activos
          </h2>
        </div>

        {activeSessions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">No tienes viajes activos.</p>
            <button type="button" onClick={() => setIsCreating(true)} className="text-indigo-600 font-medium hover:underline mt-2">
              Crea el primero ahora
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSessions.map(session => (
              <SessionCard 
                key={session.id} 
                session={session}
                onSelect={onSelect}
                onDuplicate={onDuplicate}
                onArchive={onArchive}
                onRestore={onRestore}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Archived Sessions Toggle */}
      {archivedSessions.length > 0 && (
        <div className="pt-8 border-t border-gray-200">
          <button 
            type="button"
            onClick={() => setViewArchived(!viewArchived)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 font-medium mb-4 transition-colors"
          >
            <Archive size={20} />
            {viewArchived ? 'Ocultar viajes archivados' : `Ver viajes archivados (${archivedSessions.length})`}
          </button>
          
          {viewArchived && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-4 duration-300">
              {archivedSessions.map(session => (
                <SessionCard 
                  key={session.id} 
                  session={session}
                  onSelect={onSelect}
                  onDuplicate={onDuplicate}
                  onArchive={onArchive}
                  onRestore={onRestore}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};