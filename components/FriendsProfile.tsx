import React from 'react';
import { Participant, Expense, Balance } from '../types';
import { calculateExpenseStats, formatCurrency } from '../services/finance';
import { Crown, Ghost, CreditCard, TrendingDown, Star, Zap } from 'lucide-react';

interface FriendsProfileProps {
  participants: Participant[];
  expenses: Expense[];
  balances: Balance[];
}

export const FriendsProfile: React.FC<FriendsProfileProps> = ({ participants, expenses, balances }) => {
  if (participants.length === 0) return null;

  const { paidPerPerson, totalGroup } = calculateExpenseStats(participants, expenses);
  
  // Calculate max paid for "King" badge
  let maxPaid = -1;
  participants.forEach(p => {
    const paid = paidPerPerson.get(p.id) || 0;
    if (paid > maxPaid) maxPaid = paid;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg text-white">
          <Zap size={20} fill="currentColor" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Perfil de Amigos</h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {participants.map(p => {
          const paid = paidPerPerson.get(p.id) || 0;
          const balance = balances.find(b => b.participantId === p.id)?.netAmount || 0;
          const txCount = expenses.filter(e => e.payerId === p.id).length;
          
          const badges = [];

          // 1. Pagó como rey (Max payer)
          if (paid > 0 && paid === maxPaid) {
            badges.push({ icon: Crown, text: "Pagó como rey", color: "text-yellow-500", bg: "bg-yellow-100" });
          }

          // 2. El fantasma del Nequi (Paid 0)
          if (paid === 0 && expenses.length > 0) {
            badges.push({ icon: Ghost, text: "El fantasma del Nequi", color: "text-gray-500", bg: "bg-gray-200" });
          }

          // 3. Reina del datáfono (Many transactions)
          if (txCount > 5) {
            badges.push({ icon: CreditCard, text: "Reina del datáfono", color: "text-pink-500", bg: "bg-pink-100" });
          }

          // 4. Siempre en mora (Negative balance)
          if (balance < -1000) { // Tolerance
            badges.push({ icon: TrendingDown, text: "Siempre en mora", color: "text-red-500", bg: "bg-red-100" });
          }

          // 5. Patrocinador Oficial (> 50% of total)
          if (totalGroup > 0 && paid > totalGroup * 0.5) {
             badges.push({ icon: Star, text: "Patrocinador Oficial", color: "text-purple-600", bg: "bg-purple-100" });
          }

          return (
            <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 relative overflow-hidden group hover:shadow-md transition-shadow">
               <div className="flex justify-between items-start">
                 <div>
                   <h3 className="font-bold text-gray-800 text-lg">{p.name}</h3>
                   <p className="text-xs text-gray-500">Aportó: {formatCurrency(paid)}</p>
                 </div>
                 <div className={`text-xs font-bold px-2 py-1 rounded-full ${balance >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
                 </div>
               </div>

               <div className="mt-3 space-y-1">
                 {badges.length === 0 ? (
                   <div className="text-xs text-gray-400 italic py-1">Sin badges aún...</div>
                 ) : (
                   badges.map((badge, idx) => (
                     <div key={idx} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${badge.bg} ${badge.color} text-xs font-bold`}>
                       <badge.icon size={14} />
                       {badge.text}
                     </div>
                   ))
                 )}
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};