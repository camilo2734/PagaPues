import React, { useState } from 'react';
import { Balance, Settlement, Participant, Expense } from '../types';
import { formatCurrency, calculateExpenseStats } from '../services/finance';
import { ArrowRight, Wallet, Share2, Copy, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from './Button';

interface SettlementPlanProps {
  settlements: Settlement[];
  balances: Balance[];
  participants: Participant[];
  expenses: Expense[];
}

export const SettlementPlan: React.FC<SettlementPlanProps> = ({ settlements, balances, participants, expenses }) => {
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [showCopied, setShowCopied] = useState(false);

  const getParticipantName = (id: string) => participants.find(p => p.id === id)?.name || 'Alguien';

  // Stats calculation
  const { totalGroup, averagePerPerson, paidPerPerson } = calculateExpenseStats(participants, expenses);

  const handleRecalculate = () => {
    setIsRecalculating(true);
    // Simulate calculation delay for UX
    setTimeout(() => setIsRecalculating(false), 600);
  };

  const generateReportText = () => {
    let text = `📊 *Resultados PagaPues*\n\n`;
    text += `💰 Total Grupo: ${formatCurrency(totalGroup)}\n`;
    text += `👤 Promedio: ${formatCurrency(averagePerPerson)}\n\n`;
    
    text += `*Quién debe a quién:*\n`;
    if (settlements.length === 0) {
      text += `✅ ¡Cuentas saldadas! Nadie debe nada.\n`;
    } else {
      settlements.forEach(s => {
        text += `• ${getParticipantName(s.fromId)} debe ${formatCurrency(s.amount)} a ${getParticipantName(s.toId)}\n`;
      });
    }
    return text;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateReportText());
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(generateReportText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (expenses.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-indigo-100 overflow-hidden">
      {/* Header Section */}
      <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Wallet size={24} className="text-indigo-200" />
            Resultados Finales
          </h2>
          <p className="text-indigo-100 text-sm mt-1">Resumen de quién debe a quién</p>
        </div>
        <button 
          onClick={handleRecalculate}
          className={`p-2 rounded-full bg-indigo-500 hover:bg-indigo-400 transition-all ${isRecalculating ? 'animate-spin' : ''}`}
          title="Recalcular"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      <div className={`p-6 space-y-8 transition-opacity duration-300 ${isRecalculating ? 'opacity-50' : 'opacity-100'}`}>
        
        {/* Summary Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
            <span className="text-gray-500 text-xs uppercase font-bold tracking-wider">Total Gastado</span>
            <div className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalGroup)}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
            <span className="text-gray-500 text-xs uppercase font-bold tracking-wider">Promedio / Persona</span>
            <div className="text-2xl font-bold text-indigo-600 mt-1">{formatCurrency(averagePerPerson)}</div>
          </div>
        </div>

        {/* Detailed Balance Table */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Balance Individual</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium">
                <tr>
                  <th className="px-3 py-2 rounded-l-lg">Persona</th>
                  <th className="px-3 py-2 text-right">Pagó</th>
                  <th className="px-3 py-2 text-right rounded-r-lg">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {participants.map(p => {
                  const paid = paidPerPerson.get(p.id) || 0;
                  const balance = balances.find(b => b.participantId === p.id)?.netAmount || 0;
                  const isPositive = balance > 0.01;
                  const isNegative = balance < -0.01;

                  return (
                    <tr key={p.id}>
                      <td className="px-3 py-3 font-medium text-gray-900">{p.name}</td>
                      <td className="px-3 py-3 text-right text-gray-600">{formatCurrency(paid)}</td>
                      <td className={`px-3 py-3 text-right font-bold ${isPositive ? 'text-green-600' : isNegative ? 'text-red-500' : 'text-gray-400'}`}>
                        {isPositive ? '+' : ''}{formatCurrency(balance)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* The Settlement List (Resultados de quién debe a quién) */}
        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Pagos necesarios para cuadrar</h3>
          
          {settlements.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="text-emerald-600" size={24} />
              </div>
              <h3 className="text-emerald-800 font-bold">¡Cuentas Saldadas!</h3>
              <p className="text-emerald-600 text-sm">Nadie le debe nada a nadie.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {settlements.map((s, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-gray-200 shadow-sm rounded-xl hover:border-indigo-300 transition-colors">
                  <div className="flex items-center gap-3 mb-2 sm:mb-0">
                    <div className="font-medium text-red-500 bg-red-50 px-3 py-1 rounded-lg">
                      {getParticipantName(s.fromId)}
                    </div>
                    <span className="text-gray-400 text-sm">debe pagar a</span>
                    <div className="font-medium text-green-600 bg-green-50 px-3 py-1 rounded-lg">
                      {getParticipantName(s.toId)}
                    </div>
                  </div>
                  <div className="font-bold text-gray-900 text-lg border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100">
                    {formatCurrency(s.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={copyToClipboard} className="flex-1">
            {showCopied ? <CheckCircle2 size={18} className="mr-2 text-green-600" /> : <Copy size={18} className="mr-2" />}
            {showCopied ? 'Copiado' : 'Copiar'}
          </Button>
          <Button onClick={shareViaWhatsApp} className="flex-1 bg-green-600 hover:bg-green-700 focus:ring-green-500">
            <Share2 size={18} className="mr-2" />
            WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
};