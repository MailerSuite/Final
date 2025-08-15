import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export interface TemplateOptions {
  variantsCount: number;
  tableLayout: boolean;
  splitInvertText: boolean;
  wrapSpans: boolean;
  synonymReplace: boolean;
  insertZeroWidth: boolean;
  trendingInsert: boolean;
  garbageInject: boolean;
  tagSwap: boolean;
  randomFonts: boolean;
  tweakColors: boolean;
  renameClasses: boolean;
  trustedLinks: boolean;
  toImage: boolean;
  rehostImages: boolean;
}

export const defaultOptions: TemplateOptions = {
  variantsCount: 1,
  tableLayout: false,
  splitInvertText: false,
  wrapSpans: false,
  synonymReplace: false,
  insertZeroWidth: false,
  trendingInsert: false,
  garbageInject: false,
  tagSwap: false,
  randomFonts: false,
  tweakColors: false,
  renameClasses: false,
  trustedLinks: false,
  toImage: false,
  rehostImages: false,
};

type Props = {
  options: TemplateOptions;
  onChange: (opts: TemplateOptions) => void;
  className?: string;
};

export default function TemplateOptionsPanel({
  options,
  onChange,
  className,
}: Props) {
  const update = (
    field: keyof TemplateOptions,
    value: TemplateOptions[keyof TemplateOptions]
  ) => {
    onChange({
      ...options,
      [field]: value,
    });
  };

  const optionFields: [keyof TemplateOptions, string][] = [
    ["tableLayout", "Random Table Layout"],
    ["splitInvertText", "Split-Invert Text"],
    ["wrapSpans", "Wrap Spans"],
    ["synonymReplace", "Synonym Replace"],
    ["insertZeroWidth", "Insert Zero-Width"],
    ["trendingInsert", "Trending Insert"],
    ["garbageInject", "Garbage Inject"],
    ["tagSwap", "Tag Swap"],
    ["randomFonts", "Random Fonts"],
    ["tweakColors", "Tweak Colors"],
    ["renameClasses", "Rename Classes"],
    ["trustedLinks", "Trusted Links"],
    ["toImage", "Convert to Image"],
    ["rehostImages", "Rehost Images"],
  ];

  return (
    <div className={cn("space-y-4 border rounded-md p-4", className)}>
      <div className="space-y-2">
        <Label htmlFor="variantsCount">Variants</Label>
        <Input
          id="variantsCount"
          type="number"
          min={1}
          max={10}
          value={options.variantsCount}
          onChange={(e) => update("variantsCount", Number(e.target.value))}
          className="w-20"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {optionFields.map(([field, label]) => (
          <Label
            key={field}
            htmlFor={field}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Switch
              id={field}
              checked={options[field]}
              onCheckedChange={(v) => update(field, v)}
            />
            {label}
          </Label>
        ))}
      </div>
    </div>
  );
}
