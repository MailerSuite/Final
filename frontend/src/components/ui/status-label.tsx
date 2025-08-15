import { CheckCircle, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StatusLabelProps {
  isValid: boolean;
  lastCheckedAt?: string | null;
}

export function StatusLabel({ isValid, lastCheckedAt }: StatusLabelProps) {
  if (isValid) {
    return (
      <Badge
        variant="outline"
        className="border-green-500/30 text-green-400 bg-green-900/20"
      >
        <CheckCircle className="w-3 h-3 mr-1" />
        Valid
      </Badge>
    );
  } else if (lastCheckedAt) {
    return (
      <Badge
        variant="outline"
        className="border-red-500/30 text-red-400 bg-red-900/20"
      >
        <XCircle className="w-3 h-3 mr-1" />
        Invalid
      </Badge>
    );
  } else {
    return (
      <Badge
        variant="outline"
        className="border-yellow-500/30 text-yellow-400 bg-yellow-900/20"
      >
        <Clock className="w-3 h-3 mr-1" />
        Untested
      </Badge>
    );
  }
}
