import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "destructive" | "info" | "muted";

const toneMap: Record<Tone, string> = {
  success: "bg-success-soft text-success border-success/20",
  warning: "bg-warning-soft text-warning border-warning/20",
  destructive: "bg-destructive-soft text-destructive border-destructive/20",
  info: "bg-info-soft text-info border-info/20",
  muted: "bg-muted text-muted-foreground border-border",
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
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
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
  if (["正常", "已完成", "成功", "已确认", "已归档", "已发布", "已生成", "已生成分析结果", "启用", "纳管中", "已纳管", "已匹配"].includes(status)) return "success";
  if (["关注", "运行中", "草稿", "待分析", "分析中", "待处理", "未发起", "缺项", "警告", "提示", "一般", "待配置", "部分配置", "待完善", "多个候选"].includes(status)) return "warning";
  if (["异常", "失败", "分析失败", "停用", "已下架", "严重", "紧急", "映射异常", "未匹配"].includes(status)) return "destructive";
  return "muted";
}
