import { addDays, format, isSameDay, parseISO } from 'date-fns';
import { FactoryConfig, ProductionOrder, Product, RawMaterial, ScheduledDay, PlanningResult } from '../types';

export function planProduction(
  orders: ProductionOrder[],
  products: Product[],
  materials: RawMaterial[],
  config: FactoryConfig
): PlanningResult {
  // O Algoritmo de Agendamento (Greedy Algorithm) foi evoluído.
  // Regra de Ordenação (Desempate):
  // 1. Prioridade (Score): do mais alto (5) para o mais baixo (1). Padrão é 3.
  // 2. Desempate 1: Data Limite (targetDate) - O que precisa ser entregue primeiro ganha.
  // 3. Desempate 2: Quantidade (quantity) - O menor pedido ganha, otimizando o "throughput" (Shortest Job First).
  const sortedOrders = [...orders].sort((a, b) => {
    const priorityA = a.priority ?? 3;
    const priorityB = b.priority ?? 3;
    
    if (priorityA !== priorityB) {
      return priorityB - priorityA; // Descending (5 to 1)
    }
    
    const dateComparison = a.targetDate.localeCompare(b.targetDate);
    if (dateComparison !== 0) {
      return dateComparison; // Ascending (Earliest first)
    }
    
    return a.quantity - b.quantity; // Ascending (Smallest first)
  });
  
  const schedule: ScheduledDay[] = [];
  const warnings: string[] = [];
  const noRecipeWarningSet = new Set<string>();
  const materialStock = new Map(materials.map(m => [m.id, m.stock]));

  for (const order of sortedOrders) {
    const product = products.find(p => p.id === order.productId);
    if (!product) continue;

    // MVP Rule 1 & 2: Products without recipe
    const hasRecipe = product.materials && product.materials.length > 0;
    if (!hasRecipe && !noRecipeWarningSet.has(product.id)) {
      warnings.push(`Faltam dados de receita para planejar adequadamente o produto: ${product.name}`);
      noRecipeWarningSet.add(product.id);
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
          // Check material availability (only if the product has a recipe)
          let maxPossibleByMaterials = Infinity;
          if (hasRecipe) {
            maxPossibleByMaterials = product.materials.reduce((min, mat) => {
              if (mat.amount <= 0) return min; // Prevent division by zero
              const stock = materialStock.get(mat.materialId) || 0;
              const possible = Math.floor(stock / mat.amount);
              return Math.min(min, possible);
            }, Infinity);
          }

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
            if (hasRecipe) {
              product.materials.forEach(mat => {
                const current = materialStock.get(mat.materialId) || 0;
                materialStock.set(mat.materialId, current - (mat.amount * amountToSchedule));
              });
            }
          } else {
            // Se chegou aqui e não pode agendar nada, significa que esgotou estoque ou capacidade.
            if (maxPossibleByMaterials === 0 && hasRecipe) {
               warnings.push(`Estoque insuficiente de insumos para finalizar o pedido de ${product.name} (Faltam ${remainingToSchedule} un).`);
               break; 
            }
            
            // Se o produto não tem receita, e amountToSchedule é 0, o único motivo é a capacidade ser < custo.
            // Nesse caso, o loop avança para o próximo dia normalmente.
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
