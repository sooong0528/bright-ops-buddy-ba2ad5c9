import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatTone = "primary" | "success" | "warning" | "destructive" | "info" | "muted";

const toneClasses: Record<StatTone, string> = {
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  destructive: "bg-destructive-soft text-destructive",
  info: "bg-info-soft text-info",
  muted: "bg-muted text-muted-foreground",
};

export function StatCardGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{children}</div>;
}

export function StatCard({
  title,
  value,
  unit,
  description,
  icon: Icon,
  tone = "primary",
  className,
}: {
  title: string;
  value: string | number;
  unit?: string;
  description?: string;
  icon: LucideIcon;
  tone?: StatTone;
  className?: string;
}) {
  return (
    <div className={cn("stat-card flex min-h-[116px] items-start justify-between gap-4 p-4", className)}>
      <div className="min-w-0">
        <p className="text-base font-semibold leading-5 text-foreground">{title}</p>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-[28px] font-semibold leading-none tabular-nums">{value}</span>
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </div>
        {description && <p className="mt-1.5 text-sm leading-5 text-muted-foreground">{description}</p>}
      </div>
      <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg", toneClasses[tone])}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}
