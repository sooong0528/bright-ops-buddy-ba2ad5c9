import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Clock, User as UserIcon, Calendar, ListChecks, AlertTriangle, AlertCircle, CheckCircle2, Target, Wrench, MessageSquare } from "lucide-react";
import {
  assets,
  hosts,
  alerts,
  observationConfigs,
  type InspectionRun,
  type InspectionTask,
  type Asset,
  type CheckItemConfig,
} from "@/lib/mockData";

interface Props {
  run: InspectionRun | null;
  task: InspectionTask | null;
  onClose: () => void;
}

/** 根据方案 scope 解析实际参与巡检的资产 */
function resolveScopedAssets(task: InspectionTask): Asset[] {
  const type = task.appliesTo;
  const scope = task.scopeType;
  // 未升级到新结构的旧任务，按 targets 兼容
  if (!type || !scope) {
    return assets.filter((a) => task.targets.includes(a.name));
  }
  let pool = assets.filter((a) => a.type === type);
  if (scope === "指定业务系统") {
    const bs = task.businessSystems ?? [];
    pool = pool.filter((a) => bs.includes(a.businessSystem));
  } else if (scope === "指定资产") {
    const ids = new Set(task.assetIds ?? []);
    pool = pool.filter((a) => ids.has(a.id));
  }
  return pool;
}

/** 生成资产 × 指标的 mock 数值/状态 */
function mockItemValue(assetId: string, item: CheckItemConfig): { value: string; level: "正常" | "关注" | "异常" | "无数据" } {
  const cfg = observationConfigs[assetId];
  // 缺失观测配置 → 无数据
  if (!cfg) return { value: "未配置", level: "无数据" };
  const host = hosts.find((h) => hosts.some((x) => x.id === h.id) && (h.name === assets.find((a) => a.id === assetId)?.name));
  switch (item.key) {
    case "cpu": {
      const v = host?.cpu ?? 45;
      return { value: `${v}%`, level: v >= 90 ? "异常" : v >= 75 ? "关注" : "正常" };
    }
    case "mem": {
      const v = host?.memory ?? 55;
      return { value: `${v}%`, level: v >= 90 ? "异常" : v >= 75 ? "关注" : "正常" };
    }
    case "disk": case "data_disk": {
      const v = host?.disk ?? 50;
      return { value: `${v}%`, level: v >= 90 ? "异常" : v >= 75 ? "关注" : "正常" };
    }
    case "ping": {
      const v = host?.ping ?? 12;
      return v > 100 ? { value: "超时", level: "异常" } : { value: `${v}ms`, level: "正常" };
    }
    case "port": return { value: "可达", level: "正常" };
    case "proc": return { value: "存在", level: "正常" };
    case "http_status": return { value: "200", level: "正常" };
    case "http_rt": return { value: "320ms", level: "正常" };
    case "conn": return { value: "42%", level: "正常" };
    case "slow_sql": return { value: "3 次 / 10m", level: "正常" };
    case "db_avail": return { value: "可用", level: "正常" };
    case "repl_lag": return { value: "1.2s", level: "正常" };
    case "queue_lag": return { value: "128", level: "正常" };
    case "app_err_log": return { value: "2 条 / 10m", level: "正常" };
    case "access_5xx": return { value: "0 条 / 10m", level: "正常" };
    case "err_log": return { value: "1 条 / 10m", level: "正常" };
    default: return { value: "—", level: "正常" };
  }
}

export function RunDetailSheet({ run, task, onClose }: Props) {
  const scopedAssets = run && task ? resolveScopedAssets(task) : [];
  const enabledItems = (task?.checkItems ?? []).filter((i) => i.enabled);

  const navigate = useNavigate();

  const startAnalysis = (assetName: string, itemName: string, value: string, level: string) => {
    toast({ title: "已发起故障分析", description: `${assetName} · ${itemName} · ${value}` });
    sessionStorage.setItem("analysis.pendingContext", JSON.stringify({
      assetName, itemName, value, level, runId: run?.id, taskName: task?.name,
    }));
    navigate("/analysis");
  };

  const askInAssistant = (assetName: string, itemName: string, value: string, level: string) => {
    sessionStorage.setItem("assistant.pendingReportContext", JSON.stringify({
      id: `${run?.id}-${assetName}-${itemName}`,
      title: `${assetName} · ${itemName}（${level} ${value}）`,
      type: "巡检异常追问",
    }));
    navigate("/assistant");
  };

  return (
    <Sheet open={!!run} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="sm:max-w-3xl w-full overflow-y-auto">
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
                所属方案：<span className="text-foreground font-medium">{task.name}</span>
                {task.appliesTo && <span className="ml-2 text-muted-foreground">· 适用 {task.appliesTo}</span>}
              </SheetDescription>
            </SheetHeader>

            {/* 概览 */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Tile icon={Clock} label="开始时间" value={run.startTime} />
              <Tile icon={Clock} label="结束时间" value={run.endTime} />
              <Tile icon={ListChecks} label="触发方式" value={run.trigger} />
              <Tile icon={UserIcon} label="操作人" value={run.operator} />
              <Tile icon={Calendar} label="耗时" value={run.duration} />
              <Tile icon={Target} label="巡检范围" value={`${scopedAssets.length} 个资产 · ${enabledItems.length} 项指标`} />
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

            {/* 资产 × 巡检项 明细 */}
            <div className="mt-5">
              <div className="flex items-center gap-2 mb-3">
                <ListChecks className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-semibold text-sm">巡检明细</h4>
                <span className="text-xs text-muted-foreground">{scopedAssets.length} 个资产</span>
              </div>
              {scopedAssets.length === 0 ? (
                <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                  当前方案范围内没有资产
                </div>
              ) : (
                <div className="space-y-2">
                  {scopedAssets.map((a) => {
                    const assetAlerts = alerts.filter((x) => x.host === a.name);
                    return (
                      <div key={a.id} className="rounded-lg border bg-card p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-medium truncate">{a.name}</span>
                            <span className="text-xs text-muted-foreground">{a.ip}</span>
                            <StatusBadge tone="info">{a.type}</StatusBadge>
                          </div>
                          <span className="text-xs text-muted-foreground">{a.businessSystem}</span>
                        </div>

                        {enabledItems.length > 0 && (
                          <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-1.5 text-xs">
                            {enabledItems.map((item) => {
                              const { value, level } = mockItemValue(a.id, item);
                              const tone =
                                level === "异常" ? "destructive"
                                : level === "关注" ? "warning"
                                : level === "无数据" ? "muted"
                                : "success";
                              return (
                                <div key={item.key} className="flex items-center justify-between gap-2">
                                  <span className="text-muted-foreground truncate">{item.name}</span>
                                  <span className="inline-flex items-center gap-1.5">
                                    <span className="tabular-nums text-foreground">{value}</span>
                                    <StatusBadge tone={tone}>{level}</StatusBadge>
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {assetAlerts.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {assetAlerts.map((al) => (
                              <div key={al.id} className="rounded-md border-l-2 border-destructive bg-destructive-soft/40 px-2.5 py-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium">{al.metric} · {al.value}</span>
                                  <StatusBadge tone={statusTone(al.severity)}>{al.severity}</StatusBadge>
                                </div>
                                <p className="text-xs text-foreground/80 mt-1">{al.description}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
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
