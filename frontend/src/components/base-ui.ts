/**
 * Base UI Components Export
 * Centralizes all shadcn/ui components for consistent imports
 */

// Core UI Components
export { Button } from './ui/button';
export { Input } from './ui/input';
export { Label } from './ui/label';
export { Textarea } from './ui/textarea';
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
export { Checkbox } from './ui/checkbox';
export { RadioGroup, RadioGroupItem } from './ui/radio-group';
export { Switch } from './ui/switch';
export { Slider } from './ui/slider';

// Layout Components
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './ui/card';
export { Badge } from './ui/badge';
export { Separator } from './ui/separator';
export { ScrollArea } from './ui/scroll-area';
export { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
export { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

// Navigation
export { 
  NavigationMenu, 
  NavigationMenuContent, 
  NavigationMenuIndicator, 
  NavigationMenuItem, 
  NavigationMenuLink, 
  NavigationMenuList, 
  NavigationMenuTrigger 
} from './ui/navigation-menu';

// Overlay Components
export { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
export { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
export { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
export { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger
} from './ui/dropdown-menu';

// Feedback Components
export { Alert, AlertDescription, AlertTitle } from './ui/alert';
export { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
export { toast, useToast } from '../hooks/use-toast';
export { Toast, ToastProvider, ToastViewport, ToastTitle, ToastDescription, ToastClose, ToastAction } from './ui/toast';
export { Toaster } from './ui/toaster';
export { Progress } from './ui/progress';

// Data Display
export { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
export { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

// Form Components
export { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from './ui/form';

// Command Components
export { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from './ui/command';

// Calendar & Date
export { Calendar } from './ui/calendar';

// Chart Components (if using)
export { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart';

// Custom Enhanced Components
export { default as TechLoadingSpinner } from './ui/TechLoadingSpinner';

// Design System
export { 
  DesignSystem,
  animations,
  GradientBackground,
  MetricCard,
  FeatureCard,
  StatusIndicator,
  LoadingSpinner,
  LoadingCard,
  ResponsiveGrid,
  ResponsiveContainer,
  SectionHeader
} from './ui/design-system';