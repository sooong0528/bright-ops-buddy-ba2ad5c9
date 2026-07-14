import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { Clock, User as UserIcon, Calendar, ListChecks, AlertTriangle, AlertCircle, CheckCircle2, Target } from "lucide-react";
import {
  inspectionRunSnapshots,
  zabbixHosts,
  zabbixItems,
  type InspectionRun,
  type InspectionTask,
  type RunItemResult,
} from "@/lib/mockData";

interface Props {
  run: InspectionRun | null;
  task: InspectionTask | null;
  onClose: () => void;
}

function groupResultsByAsset(results: RunItemResult[]) {
  return Object.values(results.reduce<Record<string, RunItemResult[]>>((groups, result) => {
    (groups[result.assetId] ??= []).push(result);
    return groups;
  }, {}));
}

export function RunDetailSheet({ run, task, onClose }: Props) {
  const snapshot = run ? inspectionRunSnapshots[run.id] : undefined;
  const resultGroups = groupResultsByAsset(snapshot?.results ?? []);
  const itemCount = new Set((snapshot?.results ?? []).map((result) => result.inspectionItemId)).size;


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
                <span className="ml-2 text-muted-foreground">· 方案版本 {run.schemeVersionId.replace(`${run.taskId}-v`, "V")}</span>
                {snapshot && <span className="ml-2">· 数据状态 {snapshot.dataStatus}</span>}
              </SheetDescription>
            </SheetHeader>

            {/* 概览 */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Tile icon={Clock} label="开始时间" value={run.startTime} />
              <Tile icon={Clock} label="结束时间" value={run.endTime} />
              <Tile icon={ListChecks} label="触发方式" value={run.trigger} />
              <Tile icon={UserIcon} label="操作人" value={run.operator} />
              <Tile icon={Calendar} label="耗时" value={run.duration} />
              <Tile icon={Target} label="巡检范围" value={`${resultGroups.length} 个资产 · ${itemCount} 项指标`} />
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
                <span className="text-sm text-muted-foreground">{resultGroups.length} 个资产 · 执行时快照</span>
              </div>
              {resultGroups.length === 0 ? (
                <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                  本次执行没有形成指标结果快照
                </div>
              ) : (
                <div className="space-y-2">
                  {resultGroups.map((rows) => {
                    const asset = rows[0];
                    return (
                      <div key={asset.assetId} className="rounded-lg border bg-card p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-medium truncate">{asset.assetName}</span>
                            <span className="text-sm text-muted-foreground">{asset.assetIp}</span>
                            <StatusBadge tone="info">{asset.assetType}</StatusBadge>
                          </div>
                          <span className="text-sm text-muted-foreground">{asset.businessSystem}</span>
                        </div>
                        <div className="mt-2 space-y-1.5">
                          {rows.map((result) => {
                            const tone = result.level === "异常" ? "destructive" : result.level === "关注" ? "warning" : result.level === "正常" ? "success" : "muted";
                            const item = zabbixItems.find((candidate) => candidate.id === result.zabbixItemId);
                            const host = zabbixHosts.find((candidate) => candidate.id === result.zabbixHostId);
                            return (
                              <div key={result.id} className="grid grid-cols-[1fr_auto] gap-3 rounded-md border px-3 py-2">
                                <div className="min-w-0">
                                  <div className="text-sm font-medium">{result.inspectionItemName}</div>
                                  <div className="text-sm text-muted-foreground truncate">
                                    {host && item ? `${host.name} · ${item.key}` : "未关联 Zabbix Item"} · {result.collectedAt}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm tabular-nums">{result.value}</span>
                                  <StatusBadge tone={tone}>{result.level}</StatusBadge>
                                </div>
                              </div>
                            );
                          })}
                        </div>
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
