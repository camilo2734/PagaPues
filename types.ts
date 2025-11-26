export interface Participant {
  id: string;
  name: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  payerId: string;
  involvedIds: string[]; // List of participant IDs sharing this expense
  date: number;
}

export interface Balance {
  participantId: string;
  netAmount: number; // Positive = gets back money, Negative = owes money
}

export interface Settlement {
  fromId: string;
  toId: string;
  amount: number;
}
