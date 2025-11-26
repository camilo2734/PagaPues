import { Participant, Expense, Balance, Settlement } from '../types';

export const calculateBalances = (participants: Participant[], expenses: Expense[]): Balance[] => {
  const balanceMap = new Map<string, number>();

  // Initialize 0 balance for everyone
  participants.forEach(p => balanceMap.set(p.id, 0));

  expenses.forEach(expense => {
    const paidBy = expense.payerId;
    const amount = expense.amount;
    const involvedCount = expense.involvedIds.length;

    if (involvedCount === 0) return;

    const splitAmount = amount / involvedCount;

    // The payer gets "credit" for the full amount paid
    const currentPayerBalance = balanceMap.get(paidBy) || 0;
    balanceMap.set(paidBy, currentPayerBalance + amount);

    // Subtract the share from everyone involved (including the payer if they are involved)
    expense.involvedIds.forEach(personId => {
      const currentBalance = balanceMap.get(personId) || 0;
      balanceMap.set(personId, currentBalance - splitAmount);
    });
  });

  return Array.from(balanceMap.entries()).map(([participantId, netAmount]) => ({
    participantId,
    netAmount
  }));
};

export const calculateSettlements = (balances: Balance[]): Settlement[] => {
  let settlements: Settlement[] = [];
  
  // Create mutable copies for calculation
  let debtors = balances
    .filter(b => b.netAmount < -0.01) // Using -0.01 to handle float precision
    .sort((a, b) => a.netAmount - b.netAmount); // Ascending (most negative first)
    
  let creditors = balances
    .filter(b => b.netAmount > 0.01)
    .sort((a, b) => b.netAmount - a.netAmount); // Descending (most positive first)

  // Two-pointer/Greedy approach to minimize transactions
  let i = 0; // debtor index
  let j = 0; // creditor index

  while (i < debtors.length && j < creditors.length) {
    let debtor = debtors[i];
    let creditor = creditors[j];

    // The amount to settle is the minimum of what the debtor owes and what the creditor is owed
    let amount = Math.min(Math.abs(debtor.netAmount), creditor.netAmount);

    // Round to 2 decimals to avoid floating point issues
    amount = Math.round(amount * 100) / 100;

    if (amount > 0) {
      settlements.push({
        fromId: debtor.participantId,
        toId: creditor.participantId,
        amount: amount
      });
    }

    // Adjust remaining balances
    debtor.netAmount += amount;
    creditor.netAmount -= amount;

    // If settled, move to next person
    if (Math.abs(debtor.netAmount) < 0.01) i++;
    if (creditor.netAmount < 0.01) j++;
  }

  return settlements;
};

// New Helper: Calculate raw stats (Total paid per person)
export const calculateExpenseStats = (participants: Participant[], expenses: Expense[]) => {
  const paidMap = new Map<string, number>();
  participants.forEach(p => paidMap.set(p.id, 0));

  let totalGroup = 0;

  expenses.forEach(e => {
    totalGroup += e.amount;
    const current = paidMap.get(e.payerId) || 0;
    paidMap.set(e.payerId, current + e.amount);
  });

  return {
    totalGroup,
    averagePerPerson: participants.length > 0 ? totalGroup / participants.length : 0,
    paidPerPerson: paidMap
  };
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};