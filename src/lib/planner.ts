import { addDays, format, isWeekend, parseISO, isSameDay } from 'date-fns';
import { FactoryConfig, ProductionOrder, Product, RawMaterial, ScheduledDay } from '../types';

export function planProduction(
  orders: ProductionOrder[],
  products: Product[],
  materials: RawMaterial[],
  config: FactoryConfig
): ScheduledDay[] {
  // Sort orders by target date
  const sortedOrders = [...orders].sort((a, b) => a.targetDate.localeCompare(b.targetDate));
  
  const schedule: ScheduledDay[] = [];
  const materialStock = new Map(materials.map(m => [m.id, m.stock]));

  for (const order of sortedOrders) {
    const product = products.find(p => p.id === order.productId);
    if (!product) continue;

    let remainingToSchedule = order.quantity;
    let currentDate = parseISO(order.targetDate);

    // Try to schedule production on or before the target date
    // For simplicity, we'll try to produce as close to the target date as possible
    // but without exceeding capacity.
    
    // Actually, usually you produce *before* the target date.
    // Let's try to find available capacity starting from today or a reasonable start date.
    let searchDate = new Date();
    searchDate.setHours(0, 0, 0, 0);

    while (remainingToSchedule > 0) {
      const dateStr = format(searchDate, 'yyyy-MM-dd');
      
      // Check if it's a workday
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
            const stock = materialStock.get(mat.materialId) || 0;
            const possible = Math.floor(stock / mat.amount);
            return Math.min(min, possible);
          }, Infinity);

          const amountToSchedule = Math.min(
            remainingToSchedule,
            availableCapacity / product.capacityCost,
            maxPossibleByMaterials
          );

          if (amountToSchedule > 0) {
            daySchedule.orders.push({ 
              orderId: order.id, 
              productId: order.productId,
              quantity: amountToSchedule 
            });
            daySchedule.totalCapacityUsed += amountToSchedule * product.capacityCost;
            remainingToSchedule -= amountToSchedule;

            // Update material stock
            product.materials.forEach(mat => {
              const current = materialStock.get(mat.materialId) || 0;
              materialStock.set(mat.materialId, current - (mat.amount * amountToSchedule));
            });
          }
        }
      }

      searchDate = addDays(searchDate, 1);
      
      // Safety break to avoid infinite loop if capacity is 0 or something
      if (schedule.length > 365) break; 
    }
  }

  return schedule.sort((a, b) => a.date.localeCompare(b.date));
}
