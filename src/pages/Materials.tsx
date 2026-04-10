import React, { useState, useMemo } from 'react';
import { format, parseISO, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Factory, Package, ShoppingCart, Calendar as CalendarIcon, 
  Settings, Plus, Trash2, ChevronRight, AlertCircle, 
  CheckCircle2, Printer, BarChart3, Layers, Menu, X 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { cn } from '../lib/utils';
import { Product, RawMaterial, ProductionOrder, FactoryConfig, ScheduledDay } from '../types';
import { useFactory } from '../store/FactoryContext';
import { fetchOmieProducts, fetchOmieFamilies, OmieProduct, OmieFamily } from '../services/omieService';

export default function MaterialsView() {
  const { materials, updateMaterialStock: updateStock } = useFactory();
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">Estoque de Matéria-Prima</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {materials.map(material => (
          <div key={material.id} className="bg-white p-6 rounded-3xl border border-[#E8DCC4] shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-[#F7F0E4] rounded-xl text-[#4A2C2A]">
                <Layers size={20} />
              </div>
              {material.stock < 50 && (
                <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Baixo Estoque</span>
              )}
            </div>
            <h4 className="font-bold">{material.name}</h4>
            <div className="mt-4">
              <div className="flex justify-between items-end mb-1">
                <span className="text-2xl font-bold">{material.stock}</span>
                <span className="text-xs text-[#8B5E3C] mb-1">{material.unit}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1000" 
                value={material.stock}
                onChange={(e) => updateStock(material.id, Number(e.target.value))}
                className="w-full h-1.5 bg-[#F7F0E4] rounded-lg appearance-none cursor-pointer accent-[#4A2C2A]"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
