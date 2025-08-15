import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { ChangeEvent } from "react";

export interface AdvancedSettingsValues {
  retries: number;
  retryDelay: number;
  connectionTimeout: number;
  operationTimeout: number;
}

interface AdvancedSettingsProps {
  values: AdvancedSettingsValues;
  onChange: (field: keyof AdvancedSettingsValues, value: number) => void;
  disabled?: boolean;
}

const AdvancedSettings = ({ values, onChange, disabled }: AdvancedSettingsProps) => {
  const handleNumber = (field: keyof AdvancedSettingsValues) => (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    onChange(field, Number(e.target.value));
  };

  return (
    <Accordion type="single" collapsible className="w-full mt-4">
      <AccordionItem value="advanced">
        <AccordionTrigger className="text-sm">Advanced Settings</AccordionTrigger>
        <AccordionContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Retry Mechanism</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Attempts</Label>
                <Input
                  type="number"
                  min={0}
                  value={values.retries}
                  onChange={handleNumber("retries")}
                  disabled={disabled}
                  className="h-8 text-xs bg-surface-1 border-border dark:border-border"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Delay (ms)</Label>
                <Input
                  type="number"
                  min={0}
                  value={values.retryDelay}
                  onChange={handleNumber("retryDelay")}
                  disabled={disabled}
                  className="h-8 text-xs bg-surface-1 border-border dark:border-border"
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Timeout Settings</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Connection (s)</Label>
                <Input
                  type="number"
                  min={0}
                  value={values.connectionTimeout}
                  onChange={handleNumber("connectionTimeout")}
                  disabled={disabled}
                  className="h-8 text-xs bg-surface-1 border-border dark:border-border"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Operation (s)</Label>
                <Input
                  type="number"
                  min={0}
                  value={values.operationTimeout}
                  onChange={handleNumber("operationTimeout")}
                  disabled={disabled}
                  className="h-8 text-xs bg-surface-1 border-border dark:border-border"
                />
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default AdvancedSettings;
