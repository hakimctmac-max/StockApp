import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { 
  User, 
  UserRole, 
  Product, 
  Category, 
  Supplier, 
  Customer, 
  Sale, 
  SaleItem,
  StockMovement, 
  Debt, 
  ActivityLog, 
  CompanySettings,
  AppSettings,
  DashboardStats,
  Promotion,
  Store
} from '@/types';

// Auth Store
interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      login: async (email: string, password: string) => {
        // Simulation d'authentification
        const mockUsers: User[] = [
          {
            id: '1',
            name: 'Admin User',
            email: 'admin@businesspro.com',
            role: 'admin',
            isActive: true,
            createdAt: new Date(),
            lastLogin: new Date(),
          },
          {
            id: '2',
            name: 'Seller User',
            email: 'seller@businesspro.com',
            role: 'seller',
            isActive: true,
            createdAt: new Date(),
            lastLogin: new Date(),
          },
          {
            id: '3',
            name: 'Manager User',
            email: 'manager@businesspro.com',
            role: 'manager',
            isActive: true,
            createdAt: new Date(),
            lastLogin: new Date(),
          },
        ];
        
        const user = mockUsers.find(u => u.email === email);
        if (user && password === 'password') {
          set({ currentUser: user, isAuthenticated: true });
          return true;
        }
        return false;
      },
      logout: () => {
        set({ currentUser: null, isAuthenticated: false });
      },
      hasPermission: (permission: string) => {
        const { currentUser } = get();
        if (!currentUser) return false;
        if (currentUser.role === 'admin') return true;
        // Logique de permissions plus fine ici
        return true;
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Settings Store
interface SettingsState {
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  updateCompany: (company: Partial<CompanySettings>) => void;
  toggleModule: (module: keyof AppSettings['modules']) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

const defaultSettings: AppSettings = {
  company: {
    name: 'Mon Entreprise',
    address: '123 Rue Principale',
    phone: '+33 1 23 45 67 89',
    email: 'contact@entreprise.com',
    currency: 'EUR',
    defaultLanguage: 'fr',
    vatRate: 20,
  },
  modules: {
    suppliers: true,
    customers: true,
    debts: true,
    multiStore: false,
    promotions: false,
    forecasts: false,
  },
  theme: 'system',
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      updateCompany: (company) =>
        set((state) => ({
          settings: {
            ...state.settings,
            company: { ...state.settings.company, ...company },
          },
        })),
      toggleModule: (module) =>
        set((state) => ({
          settings: {
            ...state.settings,
            modules: {
              ...state.settings.modules,
              [module]: !state.settings.modules[module],
            },
          },
        })),
      setTheme: (theme) =>
        set((state) => ({
          settings: { ...state.settings, theme },
        })),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Products Store
interface ProductsState {
  products: Product[];
  categories: Category[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addCategory: (category: Omit<Category, 'id' | 'createdAt'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  getLowStockProducts: () => Product[];
  importProducts: (products: Partial<Product>[]) => void;
}

export const useProductsStore = create<ProductsState>()(
  persist(
    (set, get) => ({
      products: [],
      categories: [],
      addProduct: (product) =>
        set((state) => ({
          products: [
            ...state.products,
            {
              ...product,
              id: Math.random().toString(36).substr(2, 9),
              createdAt: new Date(),
              updatedAt: new Date(),
            } as Product,
          ],
        })),
      updateProduct: (id, product) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...product, updatedAt: new Date() } : p
          ),
        })),
      deleteProduct: (id) =>
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        })),
      addCategory: (category) =>
        set((state) => ({
          categories: [
            ...state.categories,
            {
              ...category,
              id: Math.random().toString(36).substr(2, 9),
              createdAt: new Date(),
            } as Category,
          ],
        })),
      updateCategory: (id, category) =>
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, ...category } : c
          ),
        })),
      deleteCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        })),
      getLowStockProducts: () => {
        const { products } = get();
        return products.filter((p) => p.quantity <= p.minQuantity);
      },
      importProducts: (products) => {
        const newProducts = products.map((p) => ({
          ...p,
          id: Math.random().toString(36).substr(2, 9),
          createdAt: new Date(),
          updatedAt: new Date(),
        })) as Product[];
        set((state) => ({
          products: [...state.products, ...newProducts],
        }));
      },
    }),
    {
      name: 'products-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Suppliers Store
interface SuppliersState {
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
}

export const useSuppliersStore = create<SuppliersState>()(
  persist(
    (set) => ({
      suppliers: [],
      addSupplier: (supplier) =>
        set((state) => ({
          suppliers: [
            ...state.suppliers,
            {
              ...supplier,
              id: Math.random().toString(36).substr(2, 9),
              createdAt: new Date(),
              updatedAt: new Date(),
            } as Supplier,
          ],
        })),
      updateSupplier: (id, supplier) =>
        set((state) => ({
          suppliers: state.suppliers.map((s) =>
            s.id === id ? { ...s, ...supplier, updatedAt: new Date() } : s
          ),
        })),
      deleteSupplier: (id) =>
        set((state) => ({
          suppliers: state.suppliers.filter((s) => s.id !== id),
        })),
    }),
    {
      name: 'suppliers-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Customers Store
interface CustomersState {
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
}

export const useCustomersStore = create<CustomersState>()(
  persist(
    (set) => ({
      customers: [],
      addCustomer: (customer) =>
        set((state) => ({
          customers: [
            ...state.customers,
            {
              ...customer,
              id: Math.random().toString(36).substr(2, 9),
              createdAt: new Date(),
            } as Customer,
          ],
        })),
      updateCustomer: (id, customer) =>
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === id ? { ...c, ...customer } : c
          ),
        })),
      deleteCustomer: (id) =>
        set((state) => ({
          customers: state.customers.filter((c) => c.id !== id),
        })),
    }),
    {
      name: 'customers-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Sales Store
interface SalesState {
  sales: Sale[];
  cart: SaleItem[];
  addSale: (sale: Omit<Sale, 'id' | 'invoiceNumber' | 'createdAt'>) => void;
  cancelSale: (id: string) => void;
  addToCart: (item: SaleItem) => void;
  removeFromCart: (productId: string) => void;
  updateCartItem: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getTodaySales: () => Sale[];
  getWeekSales: () => Sale[];
  getMonthSales: () => Sale[];
  generateInvoiceNumber: () => string;
}

export const useSalesStore = create<SalesState>()(
  persist(
    (set, get) => ({
      sales: [],
      cart: [],
      addSale: (sale) => {
        const invoiceNumber = get().generateInvoiceNumber();
        const newSale = {
          ...sale,
          id: Math.random().toString(36).substr(2, 9),
          invoiceNumber,
          createdAt: new Date(),
        } as Sale;
        set((state) => ({
          sales: [newSale, ...state.sales],
        }));
        // Mettre à jour le stock
        const { products, updateProduct } = useProductsStore.getState();
        sale.items.forEach((item) => {
          const product = products.find((p) => p.id === item.productId);
          if (product) {
            updateProduct(item.productId, {
              quantity: product.quantity - item.quantity,
            });
          }
        });
        return newSale;
      },
      cancelSale: (id) =>
        set((state) => ({
          sales: state.sales.map((s) =>
            s.id === id ? { ...s, status: 'cancelled' as const } : s
          ),
        })),
      addToCart: (item) =>
        set((state) => {
          const existingItem = state.cart.find((i) => i.productId === item.productId);
          if (existingItem) {
            return {
              cart: state.cart.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + item.quantity, total: (i.quantity + item.quantity) * i.unitPrice }
                  : i
              ),
            };
          }
          return { cart: [...state.cart, item] };
        }),
      removeFromCart: (productId) =>
        set((state) => ({
          cart: state.cart.filter((i) => i.productId !== productId),
        })),
      updateCartItem: (productId, quantity) =>
        set((state) => ({
          cart: state.cart.map((i) =>
            i.productId === productId
              ? { ...i, quantity, total: quantity * i.unitPrice }
              : i
          ),
        })),
      clearCart: () => set({ cart: [] }),
      getCartTotal: () => {
        const { cart } = get();
        return cart.reduce((total, item) => total + item.total, 0);
      },
      getTodaySales: () => {
        const { sales } = get();
        const today = new Date().toDateString();
        return sales.filter((s) => new Date(s.createdAt).toDateString() === today);
      },
      getWeekSales: () => {
        const { sales } = get();
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return sales.filter((s) => new Date(s.createdAt) >= weekAgo);
      },
      getMonthSales: () => {
        const { sales } = get();
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return sales.filter((s) => new Date(s.createdAt) >= monthAgo);
      },
      generateInvoiceNumber: () => {
        const { sales } = get();
        const date = new Date();
        const prefix = 'INV';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const count = sales.length + 1;
        return `${prefix}-${year}${month}-${String(count).padStart(4, '0')}`;
      },
    }),
    {
      name: 'sales-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Stock Movements Store
interface StockMovementsState {
  movements: StockMovement[];
  addMovement: (movement: Omit<StockMovement, 'id' | 'createdAt'>) => void;
  getProductMovements: (productId: string) => StockMovement[];
}

export const useStockMovementsStore = create<StockMovementsState>()(
  persist(
    (set, get) => ({
      movements: [],
      addMovement: (movement) =>
        set((state) => ({
          movements: [
            {
              ...movement,
              id: Math.random().toString(36).substr(2, 9),
              createdAt: new Date(),
            } as StockMovement,
            ...state.movements,
          ],
        })),
      getProductMovements: (productId) => {
        return get().movements.filter((m) => m.productId === productId);
      },
    }),
    {
      name: 'stock-movements-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Debts Store
interface DebtsState {
  debts: Debt[];
  addDebt: (debt: Omit<Debt, 'id' | 'createdAt'>) => void;
  addPayment: (debtId: string, payment: { amount: number; paymentMethod: string; note?: string }) => void;
  getCustomerDebts: (customerId: string) => Debt[];
  getOverdueDebts: () => Debt[];
}

export const useDebtsStore = create<DebtsState>()(
  persist(
    (set, get) => ({
      debts: [],
      addDebt: (debt) =>
        set((state) => ({
          debts: [
            {
              ...debt,
              id: Math.random().toString(36).substr(2, 9),
              createdAt: new Date(),
            } as Debt,
            ...state.debts,
          ],
        })),
      addPayment: (debtId, payment) =>
        set((state) => ({
          debts: state.debts.map((d) => {
            if (d.id === debtId) {
              const newPaid = d.paid + payment.amount;
              const newRemaining = d.amount - newPaid;
              return {
                ...d,
                paid: newPaid,
                remaining: newRemaining,
                status: newRemaining <= 0 ? 'paid' : newPaid > 0 ? 'partial' : 'pending',
                payments: [
                  ...(d.payments || []),
                  {
                    id: Math.random().toString(36).substr(2, 9),
                    debtId,
                    ...payment,
                    paymentDate: new Date(),
                  },
                ],
              };
            }
            return d;
          }),
        })),
      getCustomerDebts: (customerId) => {
        return get().debts.filter((d) => d.customerId === customerId);
      },
      getOverdueDebts: () => {
        const today = new Date();
        return get().debts.filter(
          (d) => d.dueDate && new Date(d.dueDate) < today && d.status !== 'paid'
        );
      },
    }),
    {
      name: 'debts-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Activity Logs Store
interface ActivityLogsState {
  logs: ActivityLog[];
  addLog: (log: Omit<ActivityLog, 'id' | 'createdAt'>) => void;
  getUserLogs: (userId: string) => ActivityLog[];
  getRecentLogs: (limit?: number) => ActivityLog[];
}

export const useActivityLogsStore = create<ActivityLogsState>()(
  persist(
    (set, get) => ({
      logs: [],
      addLog: (log) =>
        set((state) => ({
          logs: [
            {
              ...log,
              id: Math.random().toString(36).substr(2, 9),
              createdAt: new Date(),
            } as ActivityLog,
            ...state.logs,
          ],
        })),
      getUserLogs: (userId) => {
        return get().logs.filter((l) => l.userId === userId);
      },
      getRecentLogs: (limit = 50) => {
        return get().logs.slice(0, limit);
      },
    }),
    {
      name: 'activity-logs-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Dashboard Store
interface DashboardState {
  getStats: () => DashboardStats;
}

export const useDashboardStore = create<DashboardState>()((set, get) => ({
  getStats: () => {
    const { products } = useProductsStore.getState();
    const { sales, getTodaySales, getWeekSales, getMonthSales } = useSalesStore.getState();
    const { debts } = useDebtsStore.getState();
    
    const todaySales = getTodaySales();
    const weekSales = getWeekSales();
    const monthSales = getMonthSales();
    
    const totalRevenue = sales
      .filter((s) => s.status === 'completed')
      .reduce((sum, s) => sum + s.total, 0);
    
    const totalProfit = sales
      .filter((s) => s.status === 'completed')
      .reduce((sum, s) => {
        const itemsCost = s.items.reduce(
          (cost, item) => cost + (item.product?.purchasePrice || 0) * item.quantity,
          0
        );
        return sum + (s.total - itemsCost - s.vatAmount);
      }, 0);
    
    const lowStockProducts = products.filter((p) => p.quantity <= p.minQuantity);
    
    const totalStockValue = products.reduce(
      (sum, p) => sum + p.purchasePrice * p.quantity,
      0
    );
    
    // Top products
    const productSales: Record<string, { product: Product; quantity: number }> = {};
    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (productSales[item.productId]) {
          productSales[item.productId].quantity += item.quantity;
        } else if (item.product) {
          productSales[item.productId] = {
            product: item.product,
            quantity: item.quantity,
          };
        }
      });
    });
    
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
    
    // Sales chart data (last 7 days)
    const salesChart: { date: string; sales: number; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const daySales = sales.filter(
        (s) =>
          new Date(s.createdAt).toISOString().split('T')[0] === dateStr &&
          s.status === 'completed'
      );
      salesChart.push({
        date: dateStr,
        sales: daySales.length,
        revenue: daySales.reduce((sum, s) => sum + s.total, 0),
      });
    }
    
    return {
      totalSales: sales.filter((s) => s.status === 'completed').length,
      totalRevenue,
      totalProfit,
      lowStockCount: lowStockProducts.length,
      totalStockValue,
      todaySales: todaySales.reduce((sum, s) => sum + s.total, 0),
      weekSales: weekSales.reduce((sum, s) => sum + s.total, 0),
      monthSales: monthSales.reduce((sum, s) => sum + s.total, 0),
      topProducts,
      recentSales: sales.slice(0, 10),
      salesChart,
    };
  },
}));

// UI Store
interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  notifications: { id: string; type: 'success' | 'error' | 'warning' | 'info'; message: string }[];
  addNotification: (notification: Omit<UIState['notifications'][0], 'id'>) => void;
  removeNotification: (id: string) => void;
  currentLanguage: string;
  setLanguage: (lang: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      notifications: [],
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            ...state.notifications,
            { ...notification, id: Math.random().toString(36).substr(2, 9) },
          ],
        })),
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      currentLanguage: 'fr',
      setLanguage: (lang) => set({ currentLanguage: lang }),
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
