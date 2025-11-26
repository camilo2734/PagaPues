import React, { useState, useEffect, useMemo } from 'react';
import { PlusCircle, RotateCcw, Activity } from 'lucide-react';
import { Participant, Expense } from './types';
import { calculateBalances, calculateSettlements, formatCurrency } from './services/finance';
import { Button } from './components/Button';
import { ParticipantManager } from './components/ParticipantManager';
import { Modal } from './components/Modal';
import { ExpenseList } from './components/ExpenseList';
import { SettlementPlan } from './components/SettlementPlan';

export default function App() {
  // State
  const [participants, setParticipants] = useState<Participant[]>(() => {
    const saved = localStorage.getItem('fs_participants');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('fs_expenses');
    return saved ? JSON.parse(saved) : [];
  });

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  
  // Expense Form State (Local to App to keep simple or could be extracted)
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [payer, setPayer] = useState('');
  const [involved, setInvolved] = useState<string[]>([]);

  // Persistence
  useEffect(() => {
    localStorage.setItem('fs_participants', JSON.stringify(participants));
  }, [participants]);

  useEffect(() => {
    localStorage.setItem('fs_expenses', JSON.stringify(expenses));
  }, [expenses]);

  // Derived State
  const balances = useMemo(() => calculateBalances(participants, expenses), [participants, expenses]);
  const settlements = useMemo(() => calculateSettlements(balances), [balances]);
  const totalSpent = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);

  // Handlers
  const addParticipant = (name: string) => {
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString().slice(2);
    const newParticipant = { id: newId, name };
    setParticipants([...participants, newParticipant]);
  };

  const removeParticipant = (id: string) => {
    // Check if involved in expenses
    const hasExpenses = expenses.some(e => e.payerId === id || e.involvedIds.includes(id));
    if (hasExpenses) {
      alert("No puedes eliminar a esta persona porque es parte de gastos existentes. Por favor elimina sus gastos primero.");
      return;
    }
    setParticipants(participants.filter(p => p.id !== id));
  };

  const openExpenseModal = () => {
    if (participants.length < 2) {
      alert("Necesitas al menos 2 participantes para agregar un gasto compartido.");
      return;
    }
    setDesc('');
    setAmount('');
    setPayer(participants[0]?.id || '');
    setInvolved(participants.map(p => p.id)); // Default to everyone
    setIsExpenseModalOpen(true);
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount || !payer || involved.length === 0) return;

    // Robust ID generation
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString().slice(2);

    const newExpense: Expense = {
      id: newId,
      description: desc,
      amount: parseFloat(amount),
      payerId: payer,
      involvedIds: involved,
      date: Date.now()
    };

    setExpenses([...expenses, newExpense]);
    setIsExpenseModalOpen(false);
  };

  const deleteExpense = (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este gasto?')) {
      setExpenses(currentExpenses => currentExpenses.filter(e => e.id !== id));
    }
  };

  const resetAll = () => {
    if (confirm('Esto eliminará TODOS los datos (participantes y gastos). ¿Estás seguro?')) {
      setParticipants([]);
      setExpenses([]);
    }
  };

  const toggleInvolved = (id: string) => {
    if (involved.includes(id)) {
      setInvolved(involved.filter(i => i !== id));
    } else {
      setInvolved([...involved, id]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
              <Activity size={20} />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">PagaPues</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={resetAll} title="Reiniciar App">
            <RotateCcw size={18} />
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        
        {/* Stats Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
             <span className="text-indigo-100 text-sm font-medium">Gasto Total del Grupo</span>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Pagado Por</label>
            <select 
              value={payer} 
              onChange={e => setPayer(e.target.value)}
              className="w-full rounded-lg border-gray-300 border px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              {participants.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
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