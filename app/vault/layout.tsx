import { AppShell } from "@/components/app-shell";
import { ProtectedGate } from "@/components/protected-gate";

export default function VaultLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedGate>
      <AppShell>{children}</AppShell>
    </ProtectedGate>
  );
}
