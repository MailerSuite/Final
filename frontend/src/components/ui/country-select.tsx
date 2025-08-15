import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { countries } from "@/lib/countries";

interface Country {
  name: string;
  code: string;
}

interface CountrySelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

export default function CountrySelect({
  value,
  onValueChange,
}: CountrySelectProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredCountries = useMemo(() => {
    if (!searchTerm) return countries.slice(0, 50);
    return countries
      .filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice(0, 50);
  }, [countries, searchTerm]);

  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      onOpenChange={setIsOpen}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a country" />
      </SelectTrigger>
      <SelectContent className="max-h-[300px] overflow-auto relative">
        <div className="sticky top-0 bg-background z-10 p-2 border-b">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search country..."
              className="h-8 text-sm px-2"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-4">
            <Loader2 className="animate-spin w-4 h-4 mr-2" />
            Loading countries...
          </div>
        ) : filteredCountries.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No countries found.
          </div>
        ) : (
          filteredCountries.map((country) => (
            <CountrySelectItem key={country.name} country={country} />
          ))
        )}
      </SelectContent>
    </Select>
  );
}

const CountrySelectItem = ({ country }: { country: Country }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const flagUrl = `https://flagcdn.com/w40/${country.code.toLowerCase()}.png`;
  return (
    <SelectItem value={country.name} className="flex gap-2 items-center">
      <div className="w-5 h-3 rounded overflow-hidden bg-muted flex-shrink-0">
        {!imageError ? (
          <img
            src={flagUrl}
            alt={`${country.name} flag`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`w-full h-full object-cover transition-opacity ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs">
            🏳️
          </div>
        )}
      </div>
      <span className="truncate">{country.name}</span>
    </SelectItem>
  );
};
