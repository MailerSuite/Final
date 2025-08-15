import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { LanguageSelector } from '@/components/i18n/LanguageSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

/**
 * Example component demonstrating i18n usage
 * This component shows how to:
 * - Use basic translations
 * - Format messages with parameters
 * - Use localized date/time/number formatting
 * - Implement language switching
 */
export const I18nExample: React.FC = () => {
  const { 
    t, 
    locale, 
    formatDate, 
    formatTime, 
    formatNumber, 
    formatCurrency, 
    formatRelativeTime,
    isRTL,
    isLoading 
  } = useTranslation();

  const currentDate = new Date();
  const pastDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
  const sampleNumber = 1234567.89;
  const samplePrice = 99.99;

  return (
    <div className={`p-6 space-y-6 ${isRTL() ? 'rtl' : 'ltr'}`}>
      {/* Header with Language Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('common.dashboard')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('nav.documentation')} - i18n {t('common.examples')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline">
            {t('common.language')}: {locale.toUpperCase()}
          </Badge>
          <LanguageSelector variant="full" />
        </div>
      </div>

      <Separator />

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              <span>{t('common.loading')}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Translations */}
      <Card>
        <CardHeader>
          <CardTitle>{t('common.settings')}</CardTitle>
          <CardDescription>
            {t('nav.features')} {t('common.of')} {t('nav.documentation')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline">
              {t('common.save')}
            </Button>
            <Button variant="outline">
              {t('common.cancel')}
            </Button>
            <Button variant="outline">
              {t('common.export')}
            </Button>
            <Button variant="outline">
              {t('common.refresh')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Authentication Examples */}
      <Card>
        <CardHeader>
          <CardTitle>{t('auth.login')}</CardTitle>
          <CardDescription>{t('auth.welcomeBack')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p><strong>{t('common.email')}:</strong> user@example.com</p>
            <p><strong>{t('auth.currentPassword')}:</strong> ••••••••</p>
          </div>
          <div className="flex gap-2">
            <Button>{t('auth.signIn')}</Button>
            <Button variant="outline">{t('auth.forgotPassword')}</Button>
          </div>
        </CardContent>
      </Card>

      {/* Email Campaign Examples */}
      <Card>
        <CardHeader>
          <CardTitle>{t('emails.campaigns')}</CardTitle>
          <CardDescription>{t('emails.massEmail')} {t('common.analytics')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-600">
                {formatNumber(12500)}
              </div>
              <div className="text-sm text-muted-foreground">
                {t('emails.sent')}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-blue-600">
                {formatNumber(8750)}
              </div>
              <div className="text-sm text-muted-foreground">
                {t('emails.delivered')}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-orange-600">
                {formatNumber(250)}
              </div>
              <div className="text-sm text-muted-foreground">
                {t('emails.bounced')}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-purple-600">95.2%</div>
              <div className="text-sm text-muted-foreground">
                {t('emails.deliveryRate')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parameterized Messages */}
      <Card>
        <CardHeader>
          <CardTitle>{t('errors.validationError')}</CardTitle>
          <CardDescription>
            {t('common.examples')} {t('common.of')} {t('errors.invalid')} {t('common.options')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-2 text-sm">
            <p className="text-red-600">
              • {t('errors.minLength', { min: 8 })}
            </p>
            <p className="text-red-600">
              • {t('errors.maxLength', { max: 50 })}
            </p>
            <p className="text-red-600">
              • {t('errors.minValue', { min: 1 })}
            </p>
            <p className="text-red-600">
              • {t('errors.maxValue', { max: 100 })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Localized Formatting */}
      <Card>
        <CardHeader>
          <CardTitle>{t('common.date')} & {t('common.time')} {t('common.format')}</CardTitle>
          <CardDescription>
            Localized formatting for {locale}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">{t('common.date')} & {t('common.time')}</h4>
              <div className="text-sm space-y-1">
                <p><strong>{t('common.date')}:</strong> {formatDate(currentDate)}</p>
                <p><strong>{t('common.time')}:</strong> {formatTime(currentDate)}</p>
                <p><strong>Relative:</strong> {formatRelativeTime(pastDate)}</p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Numbers & Currency</h4>
              <div className="text-sm space-y-1">
                <p><strong>Number:</strong> {formatNumber(sampleNumber)}</p>
                <p><strong>Currency:</strong> {formatCurrency(samplePrice, 'USD')}</p>
                <p><strong>Percentage:</strong> {formatNumber(0.856, { style: 'percent' })}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Messages */}
      <Card>
        <CardHeader>
          <CardTitle>{t('common.success')} {t('common.examples')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <p className="text-green-600">✓ {t('success.saved')}</p>
            <p className="text-green-600">✓ {t('success.created')}</p>
            <p className="text-green-600">✓ {t('success.sent')}</p>
            <p className="text-green-600">✓ {t('success.verified')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Direction Test for RTL */}
      {isRTL() && (
        <Card>
          <CardHeader>
            <CardTitle>RTL {t('common.examples')}</CardTitle>
            <CardDescription>
              This text should appear right-to-left for Arabic
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              This is a test of right-to-left text direction. 
              Numbers: {formatNumber(12345)} and dates: {formatDate(currentDate)}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default I18nExample; 