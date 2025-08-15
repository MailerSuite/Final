import React, { useState, useEffect } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  PaintBrushIcon,
  SwatchIcon,
  SparklesIcon,
  SunIcon,
  MoonIcon,
  AdjustmentsHorizontalIcon,
  CheckIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import {
  themePresets,
  colorPalettes,
  applyTheme,
  getCurrentTheme,
  hslColor
} from '../design-system/theme-config';
import type { ThemePreset } from '../design-system/theme-config';
import { motion, AnimatePresence } from 'framer-motion';

interface ThemePickerProps {
  className?: string;
  showInNavbar?: boolean;
}

export const ThemePicker: React.FC<ThemePickerProps> = ({
  className = '',
  showInNavbar = false
}) => {
  const [currentTheme, setCurrentTheme] = useState<ThemePreset>(getCurrentTheme());
  const [customColors, setCustomColors] = useState({
    primaryHue: 189,
    primarySat: 94,
    primaryLight: 53,
    accentHue: 262,
    accentSat: 83,
    accentLight: 58,
  });
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isAnimated, setIsAnimated] = useState(true);
  const [isGlowEnabled, setIsGlowEnabled] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    applyTheme(currentTheme);
    updateCustomProperties();
  }, [currentTheme]);

  const updateCustomProperties = () => {
    const root = document.documentElement;

    // Apply animation settings
    root.style.setProperty('--enable-animations', isAnimated ? '1' : '0');
    root.style.setProperty('--enable-glow', isGlowEnabled ? '1' : '0');

    // Apply custom colors if in custom mode
    if (currentTheme.id === 'custom') {
      root.style.setProperty('--ai-accent',
        hslColor(customColors.primaryHue, customColors.primarySat, customColors.primaryLight)
      );
      root.style.setProperty('--ai-accent-2',
        hslColor(customColors.accentHue, customColors.accentSat, customColors.accentLight)
      );
    }
  };

  const handlePresetSelect = (preset: ThemePreset) => {
    setCurrentTheme(preset);
    setIsOpen(false);
  };

  const handleCustomColorChange = (property: string, value: number) => {
    setCustomColors(prev => ({ ...prev, [property]: value }));

    // Create custom theme
    const customTheme: ThemePreset = {
      id: 'custom',
      name: 'Custom Theme',
      description: 'Your personalized color scheme',
      mode: isDarkMode ? 'dark' : 'light',
      colors: {
        primary: hslColor(customColors.primaryHue, customColors.primarySat, customColors.primaryLight),
        secondary: hslColor(customColors.primaryHue, customColors.primarySat - 20, customColors.primaryLight - 10),
        accent: hslColor(customColors.accentHue, customColors.accentSat, customColors.accentLight),
        success: hslColor(142, 76, 36),
        warning: hslColor(38, 92, 50),
        danger: hslColor(0, 84, 60),
        info: hslColor(199, 89, 48),
      }
    };

    setCurrentTheme(customTheme);
  };

  const resetTheme = () => {
    const defaultTheme = themePresets[0];
    setCurrentTheme(defaultTheme);
    setCustomColors({
      primaryHue: 189,
      primarySat: 94,
      primaryLight: 53,
      accentHue: 262,
      accentSat: 83,
      accentLight: 58,
    });
  };

  const ThemeButton = showInNavbar ? (
    <Button
      variant="ghost"
      size="sm"
      className="relative group"
      onClick={() => setIsOpen(!isOpen)}
    >
      <PaintBrushIcon className="w-4 h-4 mr-2" />
      <span className="hidden md:inline">Theme</span>
      <span className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full animate-pulse" />
    </Button>
  ) : (
    <Button
      variant="outline"
      className={`gradient-border ${className}`}
      onClick={() => setIsOpen(!isOpen)}
    >
      <SwatchIcon className="w-5 h-5 mr-2" />
      Customize Theme
    </Button>
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {ThemeButton}
      </PopoverTrigger>
      <PopoverContent className="w-[480px] p-0 bg-black/95 backdrop-blur-xl border-white/10 fx-popover" sideOffset={8}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-cyan-400" />
                Theme Customizer
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Personalize your workspace appearance
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetTheme}
              className="text-muted-foreground hover:text-white"
            >
              <ArrowPathIcon className="w-4 h-4" />
            </Button>
          </div>

          <Tabs defaultValue="presets" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white/5">
              <TabsTrigger value="presets">Presets</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="presets" className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
                {themePresets.map((preset) => (
                  <motion.div
                    key={preset.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all border-white/10 hover:border-white/30 ${currentTheme.id === preset.id ? 'ring-2 ring-cyan-400 border-cyan-400' : ''
                        }`}
                      onClick={() => handlePresetSelect(preset)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium text-white">
                            {preset.name}
                          </CardTitle>
                          {currentTheme.id === preset.id && (
                            <CheckIcon className="w-4 h-4 text-cyan-400" />
                          )}
                        </div>
                        <CardDescription className="text-xs text-muted-foreground">
                          {preset.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <div className="flex gap-1">
                          <div
                            className="w-6 h-6 rounded-full ring-1 ring-white/20"
                            style={{ backgroundColor: preset.colors.primary }}
                          />
                          <div
                            className="w-6 h-6 rounded-full ring-1 ring-white/20"
                            style={{ backgroundColor: preset.colors.secondary }}
                          />
                          <div
                            className="w-6 h-6 rounded-full ring-1 ring-white/20"
                            style={{ backgroundColor: preset.colors.accent }}
                          />
                          <div
                            className="w-6 h-6 rounded-full ring-1 ring-white/20"
                            style={{ backgroundColor: preset.colors.success }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="custom" className="mt-4 space-y-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">
                    Primary Color
                  </Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Label className="text-xs text-muted-foreground w-12">Hue</Label>
                      <Slider
                        value={[customColors.primaryHue]}
                        onValueChange={([value]) => handleCustomColorChange('primaryHue', value)}
                        max={360}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-xs text-muted-foreground w-10">{customColors.primaryHue}°</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Label className="text-xs text-muted-foreground w-12">Sat</Label>
                      <Slider
                        value={[customColors.primarySat]}
                        onValueChange={([value]) => handleCustomColorChange('primarySat', value)}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-xs text-muted-foreground w-10">{customColors.primarySat}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Label className="text-xs text-muted-foreground w-12">Light</Label>
                      <Slider
                        value={[customColors.primaryLight]}
                        onValueChange={([value]) => handleCustomColorChange('primaryLight', value)}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-xs text-muted-foreground w-10">{customColors.primaryLight}%</span>
                    </div>
                  </div>
                  <div
                    className="mt-2 h-12 rounded-lg ring-1 ring-white/20"
                    style={{
                      background: `linear-gradient(90deg, 
                        ${hslColor(customColors.primaryHue, customColors.primarySat, 30)},
                        ${hslColor(customColors.primaryHue, customColors.primarySat, customColors.primaryLight)},
                        ${hslColor(customColors.primaryHue, customColors.primarySat, 70)}
                      )`
                    }}
                  />
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">
                    Accent Color
                  </Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Label className="text-xs text-muted-foreground w-12">Hue</Label>
                      <Slider
                        value={[customColors.accentHue]}
                        onValueChange={([value]) => handleCustomColorChange('accentHue', value)}
                        max={360}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-xs text-muted-foreground w-10">{customColors.accentHue}°</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Label className="text-xs text-muted-foreground w-12">Sat</Label>
                      <Slider
                        value={[customColors.accentSat]}
                        onValueChange={([value]) => handleCustomColorChange('accentSat', value)}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-xs text-muted-foreground w-10">{customColors.accentSat}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Label className="text-xs text-muted-foreground w-12">Light</Label>
                      <Slider
                        value={[customColors.accentLight]}
                        onValueChange={([value]) => handleCustomColorChange('accentLight', value)}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-xs text-muted-foreground w-10">{customColors.accentLight}%</span>
                    </div>
                  </div>
                  <div
                    className="mt-2 h-12 rounded-lg ring-1 ring-white/20"
                    style={{
                      background: `linear-gradient(90deg, 
                        ${hslColor(customColors.accentHue, customColors.accentSat, 30)},
                        ${hslColor(customColors.accentHue, customColors.accentSat, customColors.accentLight)},
                        ${hslColor(customColors.accentHue, customColors.accentSat, 70)}
                      )`
                    }}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="mt-4 space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm text-white">Dark Mode</Label>
                    <p className="text-xs text-muted-foreground">Use dark color scheme</p>
                  </div>
                  <Switch
                    checked={isDarkMode}
                    onCheckedChange={setIsDarkMode}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm text-white">Animations</Label>
                    <p className="text-xs text-muted-foreground">Enable smooth transitions</p>
                  </div>
                  <Switch
                    checked={isAnimated}
                    onCheckedChange={setIsAnimated}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm text-white">Glow Effects</Label>
                    <p className="text-xs text-muted-foreground">Enable neon glow effects</p>
                  </div>
                  <Switch
                    checked={isGlowEnabled}
                    onCheckedChange={setIsGlowEnabled}
                  />
                </div>

                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm text-white">Quick Presets</Label>
                    <Badge variant="outline" className="text-xs">
                      {themePresets.length} available
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {themePresets.slice(0, 4).map((preset) => (
                      <Button
                        key={preset.id}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => handlePresetSelect(preset)}
                      >
                        {preset.name.split(' ')[0]}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="border-t border-white/10 p-4 bg-white/5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Current: <span className="text-cyan-400 font-medium">{currentTheme.name}</span>
            </p>
            <Button
              size="sm"
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
              onClick={() => setIsOpen(false)}
            >
              Apply Theme
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ThemePicker;