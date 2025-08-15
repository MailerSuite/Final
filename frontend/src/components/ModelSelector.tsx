import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { completionModels } from "@/lib/constants/models";

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [models, setModels] = useState(completionModels);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className="w-40 bg-background border-border text-muted-foreground hover:bg-background/80"
        aria-label="Select AI Model"
      >
        <SelectValue placeholder="Select AI Model" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Available Models</SelectLabel>
          {models.map((model, i) => (
            <SelectItem key={i} value={model.value}>
              {model.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
