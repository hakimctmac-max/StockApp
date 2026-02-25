import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Store, Eye, EyeOff, Lock, Mail, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore, useSettingsStore, useUIStore } from '@/store';
import { supportedLanguages, isRTL } from '@/i18n/config';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuthStore();
  const { settings } = useSettingsStore();
  const { currentLanguage, setLanguage } = useUIStore();
  
  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setLanguage(langCode);
    document.documentElement.dir = isRTL(langCode) ? 'rtl' : 'ltr';
    document.documentElement.lang = langCode;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const success = await login(email, password);
      if (success) {
        toast.success(t('auth.loginSuccess'));
      } else {
        toast.error(t('auth.invalidCredentials'));
      }
    } catch (error) {
      toast.error(t('auth.invalidCredentials'));
    } finally {
      setIsLoading(false);
    }
  };
  
  const rtl = isRTL(i18n.language);
  
  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4",
      rtl ? "rtl" : "ltr"
    )}>
      {/* Language Selector */}
      <div className="absolute top-4 right-4">
        <div className="flex items-center gap-2 bg-card rounded-lg p-1 shadow-sm">
          {supportedLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                currentLanguage === lang.code
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
              )}
            >
              {lang.flag}
            </button>
          ))}
        </div>
      </div>
      
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-4 text-center">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center shadow-lg">
              <Store className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          
          <div>
            <CardTitle className="text-2xl font-bold">{settings.company.name}</CardTitle>
            <CardDescription className="text-muted-foreground">
              {t('auth.loginSubtitle')}
            </CardDescription>
          </div>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">{t('app.email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">{t('app.password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                  {t('auth.rememberMe')}
                </Label>
              </div>
              <button type="button" className="text-sm text-primary hover:underline">
                {t('auth.forgotPassword')}
              </button>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                t('auth.loginButton')
              )}
            </Button>
            
            {/* Demo Credentials */}
            <div className="text-center text-sm text-muted-foreground">
              <p className="font-medium">{t('app.info')}:</p>
              <p>admin@businesspro.com / password</p>
              <p>seller@businesspro.com / password</p>
              <p>manager@businesspro.com / password</p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
