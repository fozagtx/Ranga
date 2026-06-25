"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { publicEnvIssues } from "@/lib/env/public";

export function EnvStatus({ showDetails = false }: { showDetails?: boolean }) {
  const issues = publicEnvIssues();

  if (issues.length === 0) {
    return (
      <Badge tone="good">
        <CheckCircle2 aria-hidden="true" size={13} />
        configured
      </Badge>
    );
  }

  return (
    <div className="space-y-2">
      <Badge tone="bad">
        <AlertTriangle aria-hidden="true" size={13} />
        setup needed
      </Badge>
      {showDetails ? (
        <ul className="space-y-1 text-xs text-muted-foreground">
          {issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      ) : (
        <p className="text-xs font-semibold text-black/50">{issues.length} live settings missing</p>
      )}
    </div>
  );
}
