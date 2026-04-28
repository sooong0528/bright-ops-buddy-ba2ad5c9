import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "destructive" | "info" | "muted";

const toneMap: Record<Tone, string> = {
  success: "bg-success-soft text-success border-success/30",
  warning: "bg-warning-soft text-warning border-warning/30",
  destructive: "bg-destructive-soft text-destructive border-destructive/30",
  info: "bg-info-soft text-info border-info/30",
  muted: "bg-secondary text-muted-foreground border-border",
};

interface Props {
  tone?: Tone;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

export function StatusBadge({ tone = "muted", children, dot = false, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-px text-xs font-normal leading-5",
        toneMap[tone],
        className
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full bg-current", tone === "destructive" && "animate-pulse-soft")} />}
      {children}
    </span>
  );
}

export function statusTone(status: string): Tone {
  if (["正常", "已完成", "成功", "已归档", "已发布", "启用"].includes(status)) return "success";
  if (["关注", "运行中", "草稿", "警告", "提示"].includes(status)) return "warning";
  if (["异常", "失败", "停用", "已下架", "严重"].includes(status)) return "destructive";
  return "muted";
}
