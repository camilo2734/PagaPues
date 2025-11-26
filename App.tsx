import React, { useState, useEffect, useMemo } from 'react';
import { PlusCircle, RotateCcw, Activity, ArrowLeft, Trash2, Archive, Home, Users } from 'lucide-react';
import { Participant, Expense, Session } from './types';
import { calculateBalances, calculateSettlements, formatCurrency } from './services/finance';
import { Button } from './components/Button';
import { ParticipantManager } from './components/ParticipantManager';
import { Modal } from './components/Modal';
import { ExpenseList } from './components/ExpenseList';
import { SettlementPlan } from './components/SettlementPlan';
import { TripHistory } from './components/TripHistory';
import { TripVisualization } from './components/TripVisualization';
import { FriendsProfile } from './components/FriendsProfile';

// Helper for safe UUID generation in all environments
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // Fallback if randomUUID fails
    }
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export default function App() {
  // --- Global State: Sessions ---
  const [sessions, setSessions] = useState<Session[]>(() => {
    const savedSessions = localStorage.getItem('fs_sessions');
    if (savedSessions) return JSON.parse(savedSessions);

    // MIGRATION: Check for old single-session data
    const oldParticipants = localStorage.getItem('fs_participants');
    const oldExpenses = localStorage.getItem('fs_expenses');
    
    if (oldParticipants || oldExpenses) {
      const migratedSession: Session = {
        id: generateUUID(),
        name: 'Mi Primer Viaje (Recuperado)',
        dateCreated: Date.now(),
        status: 'active',
        participants: oldParticipants ? JSON.parse(oldParticipants) : [],
        expenses: oldExpenses ? JSON.parse(oldExpenses) : []
      };
      return [migratedSession];
    }
    return [];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  // State for legacy trip type selection
  const [showTypeSelectionModal, setShowTypeSelectionModal] = useState(false);

  // Persistence for Sessions
  useEffect(() => {
    localStorage.setItem('fs_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Derived State: Current Active Session Data
  const currentSession = useMemo(() => 
    sessions.find(s => s.id === currentSessionId), 
    [sessions, currentSessionId]
  );

  // Check if current session needs type assignment (Legacy support)
  useEffect(() => {
    if (currentSessionId && currentSession && !currentSession.type) {
      setShowTypeSelectionModal(true);
    } else {
      setShowTypeSelectionModal(false);
    }
  }, [currentSessionId, currentSession]);

  const participants = currentSession?.participants || [];
  const expenses = currentSession?.expenses || [];

  const balances = useMemo(() => calculateBalances(participants, expenses), [participants, expenses]);
  const settlements = useMemo(() => calculateSettlements(balances), [balances]);
  const totalSpent = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);

  // --- UI State ---
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [payer, setPayer] = useState('');
  const [involved, setInvolved] = useState<string[]>([]);

  // --- Session Management Handlers ---

  const handleCreateSession = (name: string, type: 'family' | 'friends') => {
    const newSession: Session = {
      id: generateUUID(),
      name,
      dateCreated: Date.now(),
      status: 'active',
      type: type,
      participants: [],
      expenses: []
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };

  const handleDuplicateSession = (id: string) => {
    const sessionToCopy = sessions.find(s => s.id === id);
    if (!sessionToCopy) return;

    const newSession: Session = {
      ...sessionToCopy,
      id: generateUUID(),
      name: `${sessionToCopy.name} (copia)`,
      dateCreated: Date.now(),
      status: 'active' // Always activate copy
    };
    setSessions(prev => [newSession, ...prev]);
  };

  const handleArchiveSession = (id: string) => {
    setSessions(prev => prev.map(s => 
      s.id === id ? { ...s, status: 'archived' } : s
    ));
    if (currentSessionId === id) setCurrentSessionId(null);
  };

  const handleRestoreSession = (id: string) => {
    setSessions(prev => prev.map(s => 
      s.id === id ? { ...s, status: 'active' } : s
    ));
  };

  const handleDeleteSession = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este viaje y todos sus datos permanentemente?')) {
      setSessions(prev => prev.filter(s => s.id !== id));
      if (currentSessionId === id) setCurrentSessionId(null);
    }
  };

  const updateCurrentSession = (updatedFields: Partial<Session>) => {
    if (!currentSessionId) return;
    setSessions(prev => prev.map(s => 
      s.id === currentSessionId ? { ...s, ...updatedFields } : s
    ));
  };

  const assignTypeToCurrentSession = (type: 'family' | 'friends') => {
    updateCurrentSession({ type });
    setShowTypeSelectionModal(false);
  };

  // --- Inner App Handlers (operate on currentSession) ---

  const addParticipant = (name: string) => {
    const newId = generateUUID();
    const newParticipant = { id: newId, name };
    updateCurrentSession({ 
      participants: [...participants, newParticipant] 
    });
  };

  const removeParticipant = (id: string) => {
    const hasExpenses = expenses.some(e => e.payerId === id || e.involvedIds.includes(id));
    if (hasExpenses) {
      alert("No puedes eliminar a esta persona porque es parte de gastos existentes.");
      return;
    }
    updateCurrentSession({ 
      participants: participants.filter(p => p.id !== id) 
    });
  };

  const openExpenseModal = () => {
    if (participants.length < 2) {
      alert("Necesitas al menos 2 participantes para agregar un gasto compartido.");
      return;
    }
    setDesc('');
    setAmount('');
    setPayer(participants[0]?.id || '');
    setInvolved(participants.map(p => p.id));
    setIsExpenseModalOpen(true);
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount || !payer || involved.length === 0) return;

    const newExpense: Expense = {
      id: generateUUID(),
      description: desc,
      amount: parseFloat(amount),
      payerId: payer,
      involvedIds: involved,
      date: Date.now()
    };

    updateCurrentSession({
      expenses: [...expenses, newExpense]
    });
    setIsExpenseModalOpen(false);
  };

  const deleteExpense = (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este gasto?')) {
      updateCurrentSession({
        expenses: expenses.filter(e => e.id !== id)
      });
    }
  };

  const toggleInvolved = (id: string) => {
    if (involved.includes(id)) {
      setInvolved(involved.filter(i => i !== id));
    } else {
      setInvolved([...involved, id]);
    }
  };

  // --- Render ---

  // View: Trip History (If no session selected)
  if (!currentSessionId || !currentSession) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
              <Activity size={20} />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">PagaPues</h1>
          </div>
        </header>
        <TripHistory 
          sessions={sessions}
          onSelect={setCurrentSessionId}
          onCreate={handleCreateSession}
          onDuplicate={handleDuplicateSession}
          onArchive={handleArchiveSession}
          onRestore={handleRestoreSession}
          onDelete={handleDeleteSession}
        />
      </div>
    );
  }

  // View: Active Session (Calculator)
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCurrentSessionId(null)}
              className="text-gray-500 hover:text-indigo-600 transition-colors p-1"
              title="Volver a mis viajes"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900 leading-tight">{currentSession.name}</h1>
                {currentSession.type === 'friends' && (
                  <span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded border border-purple-200 uppercase font-bold tracking-wide">Amigos</span>
                )}
              </div>
              <p className="text-xs text-gray-500">PagaPues</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={() => handleArchiveSession(currentSession.id)}
              className="text-gray-400 hover:text-amber-600 p-2 rounded-full hover:bg-amber-50 transition-colors"
              title="Archivar / Finalizar Viaje"
            >
              <Archive size={20} />
            </button>
            <button 
              onClick={() => handleDeleteSession(currentSession.id)}
              className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
              title="Eliminar Viaje Permanentemente"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        
        {/* Friends Mode Profile Section */}
        {currentSession.type === 'friends' && (
          <FriendsProfile participants={participants} expenses={expenses} balances={balances} />
        )}

        {/* Stats Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={`rounded-2xl p-6 text-white shadow-lg ${currentSession.type === 'friends' ? 'bg-gradient-to-br from-purple-600 to-indigo-600' : 'bg-gradient-to-br from-indigo-500 to-indigo-700'}`}>
             <span className="text-indigo-100 text-sm font-medium">Gasto Total del Evento</span>
             <div className="text-4xl font-bold mt-1">{formatCurrency(totalSpent)}</div>
             <div className="mt-4 text-xs bg-white/20 inline-block px-2 py-1 rounded">
                {expenses.length} transacción{expenses.length !== 1 && 'es'}
             </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col justify-center items-start">
             <h3 className="text-gray-500 font-medium text-sm uppercase tracking-wider">Acción Rápida</h3>
             <p className="text-gray-900 font-semibold mb-4 mt-1">Registrar un nuevo gasto</p>
             <Button onClick={openExpenseModal} className="w-full sm:w-auto">
               <PlusCircle size={18} className="mr-2" />
               Agregar Gasto
             </Button>
          </div>
        </div>

        {/* Charts Visualization Section */}
        {participants.length > 0 && (
          <TripVisualization 
            participants={participants} 
            expenses={expenses} 
            balances={balances} 
          />
        )}

        {/* Main Content Area */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Left Column: Input & Management */}
          <div className="md:col-span-6 space-y-8">
            <ParticipantManager 
              participants={participants} 
              onAdd={addParticipant} 
              onRemove={removeParticipant}
            />
            <ExpenseList 
              expenses={expenses} 
              participants={participants}
              onDelete={deleteExpense}
            />
          </div>

          {/* Right Column: Results */}
          <div className="md:col-span-6 space-y-8">
             <div className="sticky top-24">
               <SettlementPlan 
                  settlements={settlements} 
                  balances={balances}
                  participants={participants}
                  expenses={expenses}
               />
             </div>
          </div>

        </div>
      </main>

      {/* Modal for Legacy Trips: Assign Type */}
      <Modal
        isOpen={showTypeSelectionModal}
        onClose={() => {}} // Can't close without selecting
        title="¿Qué tipo de viaje es este?"
      >
        <div className="text-center space-y-4">
          <p className="text-gray-600">
            Estamos mejorando PagaPues. Para continuar con <strong>{currentSession.name}</strong>, selecciona el estilo del viaje:
          </p>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              onClick={() => assignTypeToCurrentSession('family')}
              className="flex flex-col items-center justify-center p-4 border rounded-xl hover:bg-gray-50 hover:border-indigo-300 transition-all group"
            >
              <div className="bg-indigo-100 p-3 rounded-full mb-2 group-hover:scale-110 transition-transform">
                <Home size={24} className="text-indigo-600" />
              </div>
              <span className="font-bold text-gray-800">Familiar</span>
              <span className="text-xs text-gray-500 mt-1">Limpio y serio</span>
            </button>

            <button
              onClick={() => assignTypeToCurrentSession('friends')}
              className="flex flex-col items-center justify-center p-4 border rounded-xl hover:bg-purple-50 hover:border-purple-300 transition-all group"
            >
              <div className="bg-purple-100 p-3 rounded-full mb-2 group-hover:scale-110 transition-transform">
                <Users size={24} className="text-purple-600" />
              </div>
              <span className="font-bold text-gray-800">Amigos</span>
              <span className="text-xs text-gray-500 mt-1">Con badges y stats</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Expense Modal */}
      <Modal 
        isOpen={isExpenseModalOpen} 
        onClose={() => setIsExpenseModalOpen(false)} 
        title="Agregar Nuevo Gasto"
      >
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <input 
              required
              autoFocus
              type="text" 
              placeholder="ej. Cena en Andrés D.C."
              value={desc}
              onChange={e => setDesc(e.target.value)}
              className="w-full rounded-lg border-gray-300 border px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto (COP)</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input 
                required
                type="number" 
                min="0" 
                step="50"
                placeholder="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full rounded-lg border-gray-300 border pl-7 pr-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pagado Por</label>
            <div className="flex flex-wrap gap-2">
              {participants.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPayer(p.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    payer === p.id 
                      ? 'bg-indigo-600 text-white shadow-md transform scale-105' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dividir Entre</label>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                 <span className="text-xs text-gray-500">Selecciona quién participa en el gasto</span>
                 <button 
                  type="button" 
                  onClick={() => setInvolved(participants.map(p => p.id))}
                  className="text-xs text-indigo-600 font-medium hover:underline"
                 >
                   Todos
                 </button>
              </div>
              {participants.map(p => (
                <label key={p.id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-1 rounded">
                  <input 
                    type="checkbox" 
                    checked={involved.includes(p.id)}
                    onChange={() => toggleInvolved(p.id)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{p.name}</span>
                </label>
              ))}
            </div>
            {involved.length === 0 && (
              <p className="text-xs text-red-500 mt-1">Por favor selecciona al menos una persona.</p>
            )}
          </div>

          <div className="pt-2">
            <Button type="submit" className="w-full" size="lg" disabled={involved.length === 0}>
              Guardar Gasto
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}