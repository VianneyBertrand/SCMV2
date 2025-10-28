// Types pour l'analyse de la valeur

export interface MarketData {
  id: string;
  date: Date;
  product: string;
  category: string;
  price: number;
  quantity: number;
  revenue: number;
  margin: number;
  status: 'active' | 'inactive' | 'pending';
}

export interface FilterOptions {
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  categories?: string[];
  products?: string[];
  status?: ('active' | 'inactive' | 'pending')[];
  minPrice?: number;
  maxPrice?: number;
}

export interface ComparisonData {
  id: string;
  name: string;
  value1: number;
  value2: number;
  difference: number;
  percentageChange: number;
}

export interface DetailData {
  id: string;
  title: string;
  description: string;
  metrics: {
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'stable';
  }[];
  history: {
    date: Date;
    value: number;
  }[];
}
