import { describe, it, expect } from 'vitest';
import { planProduction } from './planner';
import { FactoryConfig, Product, ProductionOrder, RawMaterial } from '../types';

describe('Planner Sorting Logic (Greedy Strategy)', () => {
  const mockConfig: FactoryConfig = {
    dailyCapacity: 100,
    workDays: [0, 1, 2, 3, 4, 5, 6], // Everyday for testing simplicity
    holidays: []
  };

  const mockMaterials: RawMaterial[] = [
    { id: 'm1', name: 'Material 1', stock: 1000, unit: 'kg' }
  ];

  const mockProducts: Product[] = [
    { 
      id: 'p1', 
      name: 'Product 1', 
      capacityCost: 1, 
      materials: [{ materialId: 'm1', amount: 1 }] 
    },
    { 
      id: 'p2', 
      name: 'Product 2', 
      capacityCost: 1, 
      materials: [{ materialId: 'm1', amount: 1 }] 
    }
  ];

  it('deve priorizar "Prioridade" sobre "Data Limite" (Prioridade > Data)', () => {
    // Pedido 1 vence em data, mas Pedido 2 tem prioridade Máxima
    const orders: ProductionOrder[] = [
      { id: 'o1', productId: 'p1', targetDate: '2026-05-01', quantity: 50, status: 'pending', priority: 1 },
      { id: 'o2', productId: 'p2', targetDate: '2026-06-01', quantity: 50, status: 'pending', priority: 5 }
    ];

    const result = planProduction(orders, mockProducts, mockMaterials, mockConfig);
    
    // O Pedido 2 deve ser alocado antes do Pedido 1.
    // Como a capacidade diária é 100 e ambos somam 100, ambos cairão no mesmo dia.
    // Mas vamos verificar a ordem no array `orders` dentro do `schedule[0]`.
    expect(result.schedule[0].orders[0].orderId).toBe('o2');
    expect(result.schedule[0].orders[1].orderId).toBe('o1');
  });

  it('deve priorizar "Data Limite" em caso de empate na "Prioridade" (Data > Quantidade)', () => {
    // Mesma prioridade (default 3), mas datas diferentes
    const orders: ProductionOrder[] = [
      { id: 'o1', productId: 'p1', targetDate: '2026-06-01', quantity: 50, status: 'pending' },
      { id: 'o2', productId: 'p2', targetDate: '2026-05-01', quantity: 50, status: 'pending' } // Data mais cedo
    ];

    const result = planProduction(orders, mockProducts, mockMaterials, mockConfig);
    
    expect(result.schedule[0].orders[0].orderId).toBe('o2'); // o2 agendado primeiro
    expect(result.schedule[0].orders[1].orderId).toBe('o1');
  });

  it('deve priorizar "Quantidade" (menor primeiro) em caso de empate absoluto de "Prioridade" e "Data" (Empate Múltiplo)', () => {
    // Mesma data e mesma prioridade. Desempate pela quantidade.
    const orders: ProductionOrder[] = [
      { id: 'o1', productId: 'p1', targetDate: '2026-05-01', quantity: 80, status: 'pending', priority: 3 },
      { id: 'o2', productId: 'p2', targetDate: '2026-05-01', quantity: 20, status: 'pending', priority: 3 } // Menor quantidade
    ];

    const result = planProduction(orders, mockProducts, mockMaterials, mockConfig);
    
    // O pedido de quantidade 20 deve ser alocado primeiro para liberar a fila rápido
    expect(result.schedule[0].orders[0].orderId).toBe('o2');
    expect(result.schedule[0].orders[1].orderId).toBe('o1');
  });
});
