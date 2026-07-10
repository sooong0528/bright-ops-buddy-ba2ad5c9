import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { Clock, User as UserIcon, Calendar, ListChecks, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  alerts,
  detectableMetrics,
  hosts,
  inspectionMetricResults,
  opsAssets,
  type InspectionRun,
  type InspectionTask,
} from "@/lib/mockData";

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
  const metricResults = run ? inspectionMetricResults.filter((item) => item.runId === run.id) : [];
  const missingCount = metricResults.filter((item) => item.status === "缺项").length;
  const logResults = metricResults.filter((item) => item.logEvidence);

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
            {missingCount > 0 && (
              <div className="mt-3 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm">
                本次巡检存在 {missingCount} 项缺项，已单独记录，不计入正常项。
              </div>
            )}

            {/* 摘要 */}
            <div className="mt-5 rounded-lg border bg-card p-4">
              <div className="text-xs font-semibold text-muted-foreground mb-2">巡检摘要</div>
              <p className="text-sm leading-relaxed">{run.summary}</p>
            </div>

            <div className="mt-5">
              <div className="flex items-center gap-2 mb-3">
                <ListChecks className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-semibold text-sm">指标判定明细</h4>
                <span className="text-xs text-muted-foreground">{metricResults.length} 项</span>
              </div>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>资产对象</TableHead>
                      <TableHead>指标</TableHead>
                      <TableHead>当前值</TableHead>
                      <TableHead>阈值/窗口</TableHead>
                      <TableHead>数据来源</TableHead>
                      <TableHead>状态</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metricResults.map((result) => {
                      const asset = opsAssets.find((item) => item.id === result.assetId);
                      const metric = detectableMetrics.find((item) => item.id === result.metricId);
                      return (
                        <TableRow key={result.id}>
                          <TableCell>
                            <div className="text-sm font-medium">{asset?.name ?? result.assetId}</div>
                            <div className="text-xs text-muted-foreground">{asset?.type ?? "—"} · {asset?.address ?? asset?.systemName}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{metric?.name ?? result.metricId}</div>
                            <div className="text-xs text-muted-foreground">{metric?.unit ?? ""}</div>
                          </TableCell>
                          <TableCell className="tabular-nums">{result.currentValue}</TableCell>
                          <TableCell className="text-xs">
                            关注 {result.attentionThreshold} / 异常 {result.abnormalThreshold}
                            <div className="text-muted-foreground mt-0.5">{result.judgeWindow}</div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge tone="info">{result.dataSource}</StatusBadge>
                            <div className="text-xs text-muted-foreground font-mono mt-1 break-all">{result.sourceIdentifier}</div>
                          </TableCell>
                          <TableCell><StatusBadge tone={statusTone(result.status)}>{result.status}</StatusBadge></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {logResults.length > 0 && (
              <div className="mt-5 rounded-lg border bg-card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <h4 className="font-semibold text-sm">日志源检测结果</h4>
                </div>
                {logResults.map((result) => (
                  <div key={result.id} className="rounded-md bg-secondary/50 p-3 text-xs">
                    <div className="font-medium">{result.logEvidence?.path}</div>
                    <div className="mt-1 text-muted-foreground">
                      关键字：{result.logEvidence?.keywords.join("、")} · 命中 {result.logEvidence?.hitCount} 条 · {result.logEvidence?.timeWindow}
                    </div>
                    <p className="mt-2 text-foreground/80">{result.evidenceSnapshot}</p>
                  </div>
                ))}
              </div>
            )}

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
