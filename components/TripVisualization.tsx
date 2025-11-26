import React, { useEffect, useRef } from 'react';
import { Participant, Expense, Balance } from '../types';
import { calculateExpenseStats, formatCurrency } from '../services/finance';
import { BarChart3, PieChart, TrendingUp } from 'lucide-react';

interface TripVisualizationProps {
  participants: Participant[];
  expenses: Expense[];
  balances: Balance[];
}

// Helper to safely access window.Chart
declare global {
  interface Window {
    Chart: any;
  }
}

export const TripVisualization: React.FC<TripVisualizationProps> = ({ participants, expenses, balances }) => {
  const chartPaidRef = useRef<HTMLCanvasElement>(null);
  const chartPieRef = useRef<HTMLCanvasElement>(null);

  const chartPaidInstance = useRef<any>(null);
  const chartPieInstance = useRef<any>(null);

  useEffect(() => {
    if (participants.length === 0) return;

    const { paidPerPerson } = calculateExpenseStats(participants, expenses);
    
    // Data Preparation
    const names = participants.map(p => p.name);
    const paidData = participants.map(p => paidPerPerson.get(p.id) || 0);

    // Colors
    const backgroundColors = [
      'rgba(79, 70, 229, 0.7)', // Indigo
      'rgba(16, 185, 129, 0.7)', // Emerald
      'rgba(245, 158, 11, 0.7)', // Amber
      'rgba(239, 68, 68, 0.7)',  // Red
      'rgba(59, 130, 246, 0.7)', // Blue
      'rgba(168, 85, 247, 0.7)', // Purple
      'rgba(236, 72, 153, 0.7)', // Pink
      'rgba(20, 184, 166, 0.7)', // Teal
    ];

    const borderColors = backgroundColors.map(c => c.replace('0.7', '1'));

    const createChart = (
      ref: React.RefObject<HTMLCanvasElement>, 
      instanceRef: React.MutableRefObject<any>, 
      config: any
    ) => {
      if (ref.current) {
        if (instanceRef.current) {
          instanceRef.current.destroy();
        }
        // Check if Chart.js is loaded
        if (typeof window.Chart !== 'undefined') {
          instanceRef.current = new window.Chart(ref.current, config);
        }
      }
    };

    // 1. Chart: Total Paid (Bar)
    createChart(chartPaidRef, chartPaidInstance, {
      type: 'bar',
      data: {
        labels: names,
        datasets: [{
          label: 'Total Pagado',
          data: paidData,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context: any) => formatCurrency(context.raw)
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value: number) => {
                // Shorten large numbers for axis
                return value >= 1000 ? '$' + (value / 1000).toFixed(0) + 'k' : value;
              }
            }
          }
        }
      }
    });

    // 2. Chart: Participation (Doughnut)
    createChart(chartPieRef, chartPieInstance, {
      type: 'doughnut',
      data: {
        labels: names,
        datasets: [{
          data: paidData,
          backgroundColor: backgroundColors,
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12 } },
          tooltip: {
             callbacks: {
              label: (context: any) => {
                 const label = context.label || '';
                 const value = context.raw || 0;
                 const total = context.chart._metasets[context.datasetIndex].total;
                 const percentage = total > 0 ? Math.round((value / total) * 100) + '%' : '0%';
                 return `${label}: ${formatCurrency(value)} (${percentage})`;
              }
            }
          }
        }
      }
    });

    return () => {
      if (chartPaidInstance.current) chartPaidInstance.current.destroy();
      if (chartPieInstance.current) chartPieInstance.current.destroy();
    };
  }, [participants, expenses]);

  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
        <p>No hay datos suficientes para generar gráficos. Agrega gastos para visualizar el viaje.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <TrendingUp className="text-indigo-600" size={24} />
        Visualización del viaje actual
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={18} className="text-gray-500" />
            <h3 className="font-semibold text-gray-700 text-sm">Total Pagado</h3>
          </div>
          <div className="h-48 relative">
            <canvas ref={chartPaidRef}></canvas>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <PieChart size={18} className="text-gray-500" />
            <h3 className="font-semibold text-gray-700 text-sm">Participación (%)</h3>
          </div>
          <div className="h-48 relative">
            <canvas ref={chartPieRef}></canvas>
          </div>
        </div>
      </div>
    </div>
  );
};