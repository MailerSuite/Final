import { HeartPulse } from "lucide-react";

export default function NoCampaignSelected() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
      <HeartPulse className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
      <p className="text-muted-foreground text-sm">No Campaign Selected</p>
    </div>
  );
}
