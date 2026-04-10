import { addDays, format, isSameDay, parseISO } from 'date-fns';
import { FactoryConfig, ProductionOrder, Product, RawMaterial, ScheduledDay, PlanningResult } from '../types';

export function planProduction(
  orders: ProductionOrder[],
  products: Product[],
  materials: RawMaterial[],
  config: FactoryConfig
): PlanningResult {
  // Sort orders by target date
  const sortedOrders = [...orders].sort((a, b) => a.targetDate.localeCompare(b.targetDate));
  
  const schedule: ScheduledDay[] = [];
  const warnings: string[] = [];
  const materialStock = new Map(materials.map(m => [m.id, m.stock]));

  for (const order of sortedOrders) {
    const product = products.find(p => p.id === order.productId);
    if (!product) continue;

    // Validation: Products without recipe
    if (!product.materials || product.materials.length === 0) {
      warnings.push(`Faltam dados de receita para planejar o produto: ${product.name}`);
      continue; // Skip scheduling for products without recipe to avoid infinite loops or incorrect assumptions
    }

    let remainingToSchedule = order.quantity;
    let currentDate = parseISO(order.targetDate);

    let searchDate = new Date();
    searchDate.setHours(0, 0, 0, 0);

    while (remainingToSchedule > 0) {
      const dateStr = format(searchDate, 'yyyy-MM-dd');
      
      const dayOfWeek = searchDate.getDay();
      const isHoliday = config.holidays.some(h => isSameDay(parseISO(h), searchDate));
      const isWorkDay = config.workDays.includes(dayOfWeek) && !isHoliday;

      if (isWorkDay) {
        let daySchedule = schedule.find(s => s.date === dateStr);
        if (!daySchedule) {
          daySchedule = { date: dateStr, totalCapacityUsed: 0, orders: [] };
          schedule.push(daySchedule);
        }

        const availableCapacity = config.dailyCapacity - daySchedule.totalCapacityUsed;
        if (availableCapacity > 0) {
          // Check material availability
          const maxPossibleByMaterials = product.materials.reduce((min, mat) => {
            if (mat.amount <= 0) return min; // Prevent division by zero
            const stock = materialStock.get(mat.materialId) || 0;
            const possible = Math.floor(stock / mat.amount);
            return Math.min(min, possible);
          }, Infinity);

          const amountToSchedule = Math.floor(Math.min(
            remainingToSchedule,
            availableCapacity / (product.capacityCost || 1), // Prevent division by zero
            maxPossibleByMaterials
          ));

          if (amountToSchedule > 0) {
            daySchedule.orders.push({ 
              orderId: order.id, 
              productId: order.productId,
              quantity: amountToSchedule 
            });
            daySchedule.totalCapacityUsed += amountToSchedule * (product.capacityCost || 1);
            remainingToSchedule -= amountToSchedule;

            // Update material stock
            product.materials.forEach(mat => {
              const current = materialStock.get(mat.materialId) || 0;
              materialStock.set(mat.materialId, current - (mat.amount * amountToSchedule));
            });
          } else {
            // Se chegou aqui e não pode agendar nada, significa que esgotou estoque ou capacidade.
            // Para evitar loop infinito se a culpa for de estoque zerado num dia em que há capacidade:
            // O algoritmo greedy simples atual não compra estoque magicamente.
            // Então vamos quebrar o laço de agendamento desse pedido se travar por falta de material.
            if (maxPossibleByMaterials === 0) {
               warnings.push(`Estoque insuficiente de insumos para finalizar o pedido de ${product.name} (Faltam ${remainingToSchedule} un).`);
               break; 
            }
          }
        }
      }

      searchDate = addDays(searchDate, 1);
      
      if (schedule.length > 365) {
        warnings.push(`Planejamento de ${product.name} excedeu limite de 1 ano. Capacidade diária muito baixa?`);
        break; 
      }
    }
  }

  return {
    schedule: schedule.sort((a, b) => a.date.localeCompare(b.date)),
    warnings
  };
}
