import React from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  warnings: string[];
}

export function PlanningWarnings({ warnings }: Props) {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4 text-orange-800">
        <AlertCircle size={24} />
        <h4 className="font-bold text-lg">Avisos do Motor de Planejamento</h4>
      </div>
      <ul className="list-disc list-inside space-y-2 text-orange-700 ml-2">
        {warnings.map((warning, idx) => (
          <li key={idx} className="text-sm font-medium">{warning}</li>
        ))}
      </ul>
    </div>
  );
}