export interface RawMaterial {
  id: string;
  name: string;
  unit: string;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  capacityCost: number; // e.g., kg per unit or units per day cost
  materials: {
    materialId: string;
    amount: number;
  }[];
}

export interface ProductionOrder {
  id: string;
  productId: string;
  targetDate: string; // ISO date
  quantity: number;
  status: 'pending' | 'scheduled' | 'completed';
}

export interface FactoryConfig {
  dailyCapacity: number; // Max capacity units per day
  workDays: number[]; // 0-6 (Sunday-Saturday)
  holidays: string[]; // ISO dates
}

export interface ScheduledDay {
  date: string;
  totalCapacityUsed: number;
  orders: {
    orderId: string;
    productId: string;
    quantity: number;
  }[];
}

export interface PlanningResult {
  schedule: ScheduledDay[];
  warnings: string[];
}
