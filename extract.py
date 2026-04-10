import os

def extract():
    with open('src/App.tsx', 'r', encoding='utf-8') as f:
        lines = f.readlines()

    components = {
        'Dashboard': ('function DashboardView', 'function ProductsView'),
        'Products': ('function ProductsView', 'function MaterialsView'),
        'Materials': ('function MaterialsView', 'function OrdersView'),
        'Orders': ('function OrdersView', 'function ScheduleView'),
        'Schedule': ('function ScheduleView', 'function PlanningView'),
        'Planning': ('function PlanningView', None)
    }

    imports = """import React, { useState, useMemo } from 'react';
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

"""

    def find_line(text, start=0):
        for i in range(start, len(lines)):
            if lines[i].startswith(text):
                return i
        return -1

    for name, (start_text, end_text) in components.items():
        start_idx = find_line(start_text)
        end_idx = find_line(end_text) if end_text else len(lines)
        
        comp_lines = lines[start_idx:end_idx]
        
        # Replace the function signature to use useFactory instead of props
        # We need to do this manually or via regex
        
        with open(f'src/pages/{name}.tsx', 'w', encoding='utf-8') as f:
            f.write(imports)
            
            # Write StatCard if Dashboard
            if name == 'Dashboard':
                stat_idx = find_line('function StatCard')
                stat_end = find_line('function ProductsView')
                stat_lines = lines[stat_idx:stat_end]
                # Actually StatCard is inside Dashboard's range
                # Wait, DashboardView ends at 503, StatCard is 505.
                # My start/end logic is perfect because it takes everything between DashboardView and ProductsView!
            
            # For each file, we'll write the raw text, and then we will manually adjust it to use Context
            # Wait, replacing the props manually is better done with a regex or simple string replacement.
            f.writelines(comp_lines)

if __name__ == '__main__':
    extract()
