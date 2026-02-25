import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Settings, 
  Building2, 
  Globe, 
  Palette, 
  Package,
  Save,
  Upload,
  Moon,
  Sun,
  Monitor
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useSettingsStore } from '@/store';
import { supportedLanguages } from '@/i18n/config';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { settings, updateSettings, updateCompany, toggleModule, setTheme } = useSettingsStore();
  
  const [companyForm, setCompanyForm] = useState(settings.company);
  const [appName, setAppName] = useState(settings.company.name);
  
  // Handle company save
  const handleCompanySave = () => {
    updateCompany(companyForm);
    toast.success(t('settings.settingsSaved'));
  };
  
  // Handle language change
  const handleLanguageChange = (lang: string) => {
    updateCompany({ defaultLanguage: lang });
    i18n.changeLanguage(lang);
    toast.success('Langue mise à jour');
  };
  
  // Handle theme change
  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    setTheme(theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('settings.title')}</h1>
        <p className="text-muted-foreground">Configurez votre application</p>
      </div>
      
      {/* Settings Tabs */}
      <Tabs defaultValue="company">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="company">
            <Building2 className="w-4 h-4 mr-2" />
            {t('settings.company')}
          </TabsTrigger>
          <TabsTrigger value="app">
            <Settings className="w-4 h-4 mr-2" />
            {t('settings.appSettings')}
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="w-4 h-4 mr-2" />
            {t('settings.appearance')}
          </TabsTrigger>
          <TabsTrigger value="modules">
            <Package className="w-4 h-4 mr-2" />
            {t('settings.modules')}
          </TabsTrigger>
        </TabsList>
        
        {/* Company Settings */}
        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.company')}</CardTitle>
              <CardDescription>Informations de votre entreprise</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('settings.companyName')}</Label>
                  <Input
                    value={companyForm.name}
                    onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('settings.companyEmail')}</Label>
                  <Input
                    type="email"
                    value={companyForm.email}
                    onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>{t('settings.companyAddress')}</Label>
                <Input
                  value={companyForm.address}
                  onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('settings.companyPhone')}</Label>
                  <Input
                    value={companyForm.phone}
                    onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('settings.companyTaxId')}</Label>
                  <Input
                    value={companyForm.taxId || ''}
                    onChange={(e) => setCompanyForm({ ...companyForm, taxId: e.target.value })}
                    placeholder="Numéro de TVA"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>{t('settings.companyLogo')}</Label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <Button variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Changer le logo
                  </Button>
                </div>
              </div>
              
              <Button onClick={handleCompanySave}>
                <Save className="w-4 h-4 mr-2" />
                {t('settings.saveSettings')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* App Settings */}
        <TabsContent value="app" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.appSettings')}</CardTitle>
              <CardDescription>Configuration générale de l'application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('settings.defaultLanguage')}</Label>
                  <select
                    value={settings.company.defaultLanguage}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    {supportedLanguages.map((lang) => (
                      <option key={lang.code} value={lang.code}>{lang.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{t('settings.defaultCurrency')}</Label>
                  <select
                    value={settings.company.currency}
                    onChange={(e) => updateCompany({ currency: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="MAD">MAD (DH)</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>{t('settings.vatRate')}</Label>
                <Input
                  type="number"
                  value={settings.company.vatRate}
                  onChange={(e) => updateCompany({ vatRate: parseFloat(e.target.value) })}
                />
              </div>
              
              <Button onClick={() => toast.success(t('settings.settingsSaved'))}>
                <Save className="w-4 h-4 mr-2" />
                {t('settings.saveSettings')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Appearance */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.appearance')}</CardTitle>
              <CardDescription>Personnalisez l'apparence de l'application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('settings.theme')}</Label>
                <div className="grid grid-cols-3 gap-4">
                  <Button
                    variant={settings.theme === 'light' ? 'default' : 'outline'}
                    className="flex-col h-24"
                    onClick={() => handleThemeChange('light')}
                  >
                    <Sun className="w-8 h-8 mb-2" />
                    {t('settings.light')}
                  </Button>
                  <Button
                    variant={settings.theme === 'dark' ? 'default' : 'outline'}
                    className="flex-col h-24"
                    onClick={() => handleThemeChange('dark')}
                  >
                    <Moon className="w-8 h-8 mb-2" />
                    {t('settings.dark')}
                  </Button>
                  <Button
                    variant={settings.theme === 'system' ? 'default' : 'outline'}
                    className="flex-col h-24"
                    onClick={() => handleThemeChange('system')}
                  >
                    <Monitor className="w-8 h-8 mb-2" />
                    {t('settings.system')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Modules */}
        <TabsContent value="modules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.modules')}</CardTitle>
              <CardDescription>Activez ou désactivez les modules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(settings.modules).map(([key, enabled]) => (
                <div key={key} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                    <p className="text-sm text-muted-foreground">
                      Module {enabled ? 'activé' : 'désactivé'}
                    </p>
                  </div>
                  <Switch
                    checked={enabled}
                    onCheckedChange={() => toggleModule(key as keyof typeof settings.modules)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
