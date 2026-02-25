// Types pour l'application de gestion commerciale

export type UserRole = 'admin' | 'seller' | 'manager';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
  permissions?: string[];
}

export interface CompanySettings {
  name: string;
  logo?: string;
  address: string;
  phone: string;
  email: string;
  taxId?: string;
  currency: string;
  defaultLanguage: string;
  vatRate: number;
}

export interface AppSettings {
  company: CompanySettings;
  modules: {
    suppliers: boolean;
    customers: boolean;
    debts: boolean;
    multiStore: boolean;
    promotions: boolean;
    forecasts: boolean;
  };
  theme: 'light' | 'dark' | 'system';
}

export interface Category {
  id: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  createdAt: Date;
}

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  taxId?: string;
  totalPurchases: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  category?: Category;
  image?: string;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  minQuantity: number;
  supplierId?: string;
  supplier?: Supplier;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockMovement {
  id: string;
  productId: string;
  product?: Product;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  userId: string;
  user?: User;
  createdAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  totalPurchases: number;
  balance: number;
  createdAt: Date;
}

export interface SaleItem {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customer?: Customer;
  items: SaleItem[];
  subtotal: number;
  vatAmount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'mixed';
  paidAmount: number;
  change: number;
  sellerId: string;
  seller?: User;
  storeId?: string;
  createdAt: Date;
  status: 'completed' | 'pending' | 'cancelled';
}

export interface Debt {
  id: string;
  customerId: string;
  customer?: Customer;
  saleId?: string;
  amount: number;
  paid: number;
  remaining: number;
  dueDate?: Date;
  status: 'pending' | 'partial' | 'paid';
  createdAt: Date;
  payments?: DebtPayment[];
}

export interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  note?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  user?: User;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  createdAt: Date;
}

export interface Promotion {
  id: string;
  code: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase?: number;
  startDate: Date;
  endDate: Date;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
}

export interface Store {
  id: string;
  name: string;
  address: string;
  phone: string;
  managerId?: string;
  manager?: User;
  isActive: boolean;
  createdAt: Date;
}

export interface DashboardStats {
  totalSales: number;
  totalRevenue: number;
  totalProfit: number;
  lowStockCount: number;
  totalStockValue: number;
  todaySales: number;
  weekSales: number;
  monthSales: number;
  topProducts: { product: Product; quantity: number }[];
  recentSales: Sale[];
  salesChart: { date: string; sales: number; revenue: number }[];
}

export interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  storeId?: string;
  sellerId?: string;
  categoryId?: string;
  productId?: string;
  customerId?: string;
}

export type ReportType = 
  | 'sales'
  | 'profits'
  | 'inventory'
  | 'top-products'
  | 'seller-performance'
  | 'stock-movements'
  | 'debts'
  | 'suppliers';
