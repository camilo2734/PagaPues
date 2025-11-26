import React from 'react';
import { Expense, Participant } from '../types';
import { formatCurrency } from '../services/finance';
import { Trash2, Receipt, Calendar } from 'lucide-react';

interface ExpenseListProps {
  expenses: Expense[];
  participants: Participant[];
  onDelete: (id: string) => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, participants, onDelete }) => {
  const getParticipantName = (id: string) => participants.find(p => p.id === id)?.name || 'Desconocido';

  // Create a copy of expenses before sorting to avoid mutating props/state directly
  const sortedExpenses = [...expenses].sort((a, b) => b.date - a.date);

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Receipt className="text-gray-400" size={32} />
        </div>
        <h3 className="text-lg font-medium text-gray-900">Sin gastos aún</h3>
        <p className="text-gray-500 mt-1">Comienza a agregar gastos para ver la división.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <Receipt className="text-indigo-600" size={24} />
        Gastos Recientes
      </h2>
      <div className="grid gap-4 sm:grid-cols-1">
        {sortedExpenses.map((expense) => {
           const payerName = getParticipantName(expense.payerId);
           const date = new Date(expense.date).toLocaleDateString('es-CO');
           
           return (
            <div key={expense.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex items-start justify-between group">
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-gray-900 text-lg break-all">{expense.description}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1 whitespace-nowrap">
                    <Calendar size={10} /> {date}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium text-gray-900">{payerName}</span> pagó 
                  <span className="font-bold text-indigo-600 mx-1">{formatCurrency(expense.amount)}</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Para {expense.involvedIds.length === participants.length ? 'todos' : `${expense.involvedIds.length} personas`}
                </div>
              </div>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(expense.id);
                }}
                className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                title="Eliminar gasto"
              >
                <Trash2 size={18} />
              </button>
            </div>
           );
        })}
      </div>
    </div>
  );
};