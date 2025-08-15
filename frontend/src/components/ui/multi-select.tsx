"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface Option {
  value: string;
  label: string;
  icon?: React.ElementType; // Optional icon component
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selectedValues: string[]) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  icon?: React.ElementType; // Icon for the trigger
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder,
  className,
  triggerClassName,
  contentClassName,
  icon: TriggerIcon,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  const handleSelect = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  const displaySelected = React.useMemo(() => {
    return selected
      .map((value) => options.find((option) => option.value === value)?.label)
      .filter(Boolean) as string[];
  }, [selected, options]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-10 bg-white/10 border-white/20 text-white focus:border-blue-400 focus:ring-blue-400/50 backdrop-blur-sm",
            triggerClassName
          )}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            {TriggerIcon && <TriggerIcon className="w-4 h-4 text-muted-foreground" />}
            {selected.length === 0 ? (
              <span className="text-muted-foreground">
                {placeholder || "Select items..."}
              </span>
            ) : (
              <div className="flex overflow-x-auto hide-scrollbar gap-1">
                {displaySelected.map((label) => (
                  <Badge
                    key={label}
                    variant="secondary"
                    className="bg-white/20 text-white border-white/30"
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-[var(--radix-popover-trigger-width)] p-0 bg-background/95 border-border backdrop-blur-xl",
          contentClassName
        )}
      >
        <Command>
          <CommandInput
            placeholder="Search..."
            value={searchValue}
            onValueChange={setSearchValue}
            className="h-9 bg-transparent text-white placeholder-gray-400"
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup className="space-y-2">
              {options
                .filter(
                  (option) =>
                    option.label &&
                    option.label
                      .toLowerCase()
                      .includes(searchValue.toLowerCase())
                )
                .map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => handleSelect(option.value)}
                    className={`flex items-center gap-2 text-white !bg-transparent hover:!bg-white/10 border mt-0.5 ${
                      selected.includes(option.value) && "!bg-white/10"
                    } focus:bg-white/10 cursor-pointer`}
                  >
                    <Checkbox
                      checked={selected.includes(option.value)}
                      onCheckedChange={() => handleSelect(option.value)}
                      className="border-blue-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    {option.icon && (
                      <option.icon className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span>{option.label}</span>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        selected.includes(option.value)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
