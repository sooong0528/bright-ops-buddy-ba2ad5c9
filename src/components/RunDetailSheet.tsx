import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { Clock, User as UserIcon, Calendar, ListChecks, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import { hosts, alerts, type InspectionRun, type InspectionTask } from "@/lib/mockData";

interface Props {
  run: InspectionRun | null;
  task: InspectionTask | null;
  onClose: () => void;
}

export function RunDetailSheet({ run, task, onClose }: Props) {
  // Mock: 主机级巡检明细。基于 task.targets 选取相关主机。
  const inspectedHosts = run && task
    ? hosts.filter((h) =>
        task.targets.includes("全部主机组") || task.targets.includes(h.group) || task.targets.includes(h.name)
      )
    : [];

  return (
    <Sheet open={!!run} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="sm:max-w-2xl w-full overflow-y-auto">
        {run && task && (
          <>
            <SheetHeader className="space-y-2">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-lg">巡检结果 #{run.id.replace("run-", "")}</SheetTitle>
                <StatusBadge tone={statusTone(run.status)} dot={run.status === "运行中"}>
                  {run.status}
                </StatusBadge>
              </div>
              <SheetDescription className="text-sm">
                所属任务：<span className="text-foreground font-medium">{task.name}</span>
              </SheetDescription>
            </SheetHeader>

            {/* 概览 */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Tile icon={Clock} label="开始时间" value={run.startTime} />
              <Tile icon={Clock} label="结束时间" value={run.endTime} />
              <Tile icon={ListChecks} label="触发方式" value={run.trigger} />
              <Tile icon={UserIcon} label="操作人" value={run.operator} />
              <Tile icon={Calendar} label="耗时" value={run.duration} />
              <Tile icon={ListChecks} label="任务类型" value={task.type} />
            </div>

            {/* 结果统计 */}
            <div className="mt-5 grid grid-cols-3 gap-3">
              <ResultStat icon={CheckCircle2} label="正常" value={run.normal} tone="success" />
              <ResultStat icon={AlertCircle} label="关注" value={run.attention} tone="warning" />
              <ResultStat icon={AlertTriangle} label="异常" value={run.abnormal} tone="destructive" />
            </div>

            {/* 摘要 */}
            <div className="mt-5 rounded-lg border bg-card p-4">
              <div className="text-xs font-semibold text-muted-foreground mb-2">巡检摘要</div>
              <p className="text-sm leading-relaxed">{run.summary}</p>
            </div>

            {/* 主机明细 */}
            <div className="mt-5">
              <div className="flex items-center gap-2 mb-3">
                <ListChecks className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-semibold text-sm">主机巡检明细</h4>
                <span className="text-xs text-muted-foreground">{inspectedHosts.length} 台</span>
              </div>
              <div className="space-y-2">
                {inspectedHosts.map((h) => {
                  const hostAlerts = alerts.filter((a) => a.host === h.name);
                  return (
                    <div key={h.id} className="rounded-lg border bg-card p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-medium truncate">{h.name}</span>
                          <span className="text-xs text-muted-foreground">{h.ip}</span>
                        </div>
                        <StatusBadge tone={statusTone(h.status)} dot={h.status === "异常"}>{h.status}</StatusBadge>
                      </div>
                      <div className="mt-2 grid grid-cols-4 gap-2 text-xs tabular-nums text-muted-foreground">
                        <span>CPU <span className="text-foreground">{h.cpu}%</span></span>
                        <span>内存 <span className="text-foreground">{h.memory}%</span></span>
                        <span>磁盘 <span className="text-foreground">{h.disk}%</span></span>
                        <span>Ping <span className="text-foreground">{h.ping > 100 ? "超时" : `${h.ping}ms`}</span></span>
                      </div>
                      {hostAlerts.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {hostAlerts.map((a) => (
                            <div key={a.id} className="rounded-md border-l-2 border-destructive bg-destructive-soft/40 px-2.5 py-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium">{a.metric} · {a.value}</span>
                                <StatusBadge tone={statusTone(a.severity)}>{a.severity}</StatusBadge>
                              </div>
                              <p className="text-xs text-foreground/80 mt-1">{a.description}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Tile({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2.5 flex items-center gap-2.5">
      <div className="h-8 w-8 rounded-md bg-primary-soft text-primary flex items-center justify-center">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-medium truncate tabular-nums">{value}</div>
      </div>
    </div>
  );
}

function ResultStat({ icon: Icon, label, value, tone }: { icon: any; label: string; value: number; tone: "success" | "warning" | "destructive" }) {
  const toneCls = {
    success: "text-success bg-success-soft",
    warning: "text-warning bg-warning-soft",
    destructive: "text-destructive bg-destructive-soft",
  }[tone];
  return (
    <div className="rounded-lg border bg-card p-3 flex items-center gap-3">
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${toneCls}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl font-semibold tabular-nums">{value}</div>
      </div>
    </div>
  );
}
