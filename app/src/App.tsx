import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Boxes, 
  Truck, 
  Users, 
  Receipt, 
  FileText, 
  Settings, 
  UserCircle,
  Activity,
  Wallet,
  Store,
  Menu,
  Bell,
  Sun,
  Moon,
  LogOut,
  Search,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore, useSettingsStore, useUIStore, useProductsStore, useSalesStore } from '@/store';
import { supportedLanguages, isRTL } from '@/i18n/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Toaster, toast } from 'sonner';

// Import pages
import LoginPage from '@/pages/Login';
import DashboardPage from '@/pages/Dashboard';
import POSPage from '@/pages/POS';
import ProductsPage from '@/pages/Products';
import StockPage from '@/pages/Stock';
import SuppliersPage from '@/pages/Suppliers';
import CustomersPage from '@/pages/Customers';
import SalesPage from '@/pages/Sales';
import InvoicesPage from '@/pages/Invoices';
import ReportsPage from '@/pages/Reports';
import SettingsPage from '@/pages/Settings';
import UsersPage from '@/pages/Users';
import ActivitiesPage from '@/pages/Activities';
import DebtsPage from '@/pages/Debts';

type PageType = 
  | 'dashboard' 
  | 'pos' 
  | 'products' 
  | 'stock' 
  | 'suppliers' 
  | 'customers' 
  | 'sales' 
  | 'invoices' 
  | 'reports' 
  | 'settings' 
  | 'users' 
  | 'activities'
  | 'debts';

function App() {
  const { t, i18n } = useTranslation();
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const { currentUser, isAuthenticated, logout } = useAuthStore();
  const { settings, setTheme } = useSettingsStore();
  const { sidebarOpen, toggleSidebar, currentLanguage, setLanguage } = useUIStore();
  const { products } = useProductsStore();
  const { cart } = useSalesStore();
  
  // Check for low stock alerts
  useEffect(() => {
    const lowStockProducts = products.filter(p => p.quantity <= p.minQuantity && p.quantity > 0);
    const outOfStockProducts = products.filter(p => p.quantity === 0);
    
    if (lowStockProducts.length > 0) {
      toast.warning(`${lowStockProducts.length} produit(s) en stock faible`, {
        description: 'Vérifiez les alertes de stock',
      });
    }
    if (outOfStockProducts.length > 0) {
      toast.error(`${outOfStockProducts.length} produit(s) en rupture de stock`, {
        description: 'Réapprovisionnement nécessaire',
      });
    }
  }, [products]);
  
  // Handle language change
  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setLanguage(langCode);
    document.documentElement.dir = isRTL(langCode) ? 'rtl' : 'ltr';
    document.documentElement.lang = langCode;
  };
  
  // Handle theme toggle
  const toggleTheme = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setIsDarkMode(!isDarkMode);
    setTheme(newTheme as 'light' | 'dark' | 'system');
    document.documentElement.classList.toggle('dark', !isDarkMode);
  };
  
  // Initialize theme and language
  useEffect(() => {
    const savedLang = localStorage.getItem('i18nextLng') || 'fr';
    handleLanguageChange(savedLang);
    
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDark = settings.theme === 'dark' || (settings.theme === 'system' && prefersDark);
    setIsDarkMode(initialDark);
    document.documentElement.classList.toggle('dark', initialDark);
  }, []);
  
  // Navigation items
  const navItems: { id: PageType; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'dashboard', label: t('navigation.dashboard'), icon: LayoutDashboard },
    { id: 'pos', label: t('navigation.pos'), icon: ShoppingCart, badge: cart.length > 0 ? cart.length : undefined },
    { id: 'products', label: t('navigation.products'), icon: Package },
    { id: 'stock', label: t('navigation.stock'), icon: Boxes },
    { id: 'suppliers', label: t('navigation.suppliers'), icon: Truck },
    { id: 'customers', label: t('navigation.customers'), icon: Users },
    { id: 'sales', label: t('navigation.sales'), icon: Receipt },
    { id: 'invoices', label: t('navigation.invoices'), icon: FileText },
    { id: 'reports', label: t('navigation.reports'), icon: Activity },
    { id: 'debts', label: t('navigation.debts'), icon: Wallet },
    { id: 'activities', label: t('navigation.activities'), icon: Activity },
    { id: 'users', label: t('navigation.users'), icon: UserCircle },
    { id: 'settings', label: t('navigation.settings'), icon: Settings },
  ];
  
  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(item => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    if (currentUser.role === 'seller') {
      return ['dashboard', 'pos', 'products', 'customers', 'sales', 'invoices', 'debts'].includes(item.id);
    }
    if (currentUser.role === 'manager') {
      return ['dashboard', 'pos', 'products', 'stock', 'suppliers', 'customers', 'sales', 'invoices', 'reports', 'debts', 'activities'].includes(item.id);
    }
    return false;
  });
  
  // Render current page
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage />;
      case 'pos': return <POSPage />;
      case 'products': return <ProductsPage />;
      case 'stock': return <StockPage />;
      case 'suppliers': return <SuppliersPage />;
      case 'customers': return <CustomersPage />;
      case 'sales': return <SalesPage />;
      case 'invoices': return <InvoicesPage />;
      case 'reports': return <ReportsPage />;
      case 'settings': return <SettingsPage />;
      case 'users': return <UsersPage />;
      case 'activities': return <ActivitiesPage />;
      case 'debts': return <DebtsPage />;
      default: return <DashboardPage />;
    }
  };
  
  // If not authenticated, show login page
  if (!isAuthenticated) {
    return (
      <>
        <LoginPage />
        <Toaster position="top-right" richColors />
      </>
    );
  }
  
  const rtl = isRTL(i18n.language);
  
  return (
    <div className={cn("min-h-screen bg-background", rtl ? "rtl" : "ltr")}>
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 z-40 h-screen transition-transform duration-300 ease-in-out bg-card border-r",
          sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-64",
          rtl ? "right-0 border-l border-r-0" : "left-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Store className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight">{settings.company.name}</span>
              <span className="text-xs text-muted-foreground">{t('app.tagline')}</span>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
          {filteredNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                currentPage === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <Badge variant={currentPage === item.id ? "secondary" : "default"} className="text-xs">
                  {item.badge}
                </Badge>
              )}
            </button>
          ))}
        </nav>
      </aside>
      
      {/* Main Content */}
      <div
        className={cn(
          "transition-all duration-300",
          sidebarOpen ? (rtl ? "mr-64" : "ml-64") : ""
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-card border-b px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="shrink-0"
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('app.search')}
                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-8 w-64"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="shrink-0"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <span className="text-lg">🌐</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('settings.language')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {supportedLanguages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={cn(
                      "flex items-center gap-2",
                      currentLanguage === lang.code && "bg-accent"
                    )}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0 relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>{t('app.notification')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="py-2 px-4 text-sm text-muted-foreground">
                  {t('alerts.lowStock')}: {products.filter(p => p.quantity <= p.minQuantity).length} produits
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {currentUser?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium">{currentUser?.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{currentUser?.role}</p>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{currentUser?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setCurrentPage('settings')}>
                  <Settings className="w-4 h-4 mr-2" />
                  {t('navigation.settings')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  {t('app.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="p-6">
          {renderPage()}
        </main>
      </div>
      
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
