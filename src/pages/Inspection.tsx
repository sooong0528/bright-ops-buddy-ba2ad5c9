import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  ListChecks,
  Bot,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { RunDetailSheet } from "@/components/RunDetailSheet";
import {
  inspectionTasks,
  inspectionRuns,
  abnormalRecords,
  faultAnalysisTasks,
  inspectionMetricResults,
} from "@/lib/mockData";

type RangeKey = "today" | "week" | "month";

export default function Inspection() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [range, setRange] = useState<RangeKey>("today");
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [taskFilter, setTaskFilter] = useState<string>("all");

  // Mock 时间筛选：演示数据较少，统一返回全部，但保留筛选交互
  const filteredRuns = useMemo(() => {
    return inspectionRuns.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (taskFilter !== "all" && r.taskId !== taskFilter) return false;
      if (keyword) {
        const k = keyword.toLowerCase();
        const taskName = inspectionTasks.find((t) => t.id === r.taskId)?.name ?? "";
        if (
          !r.id.toLowerCase().includes(k) &&
          !taskName.toLowerCase().includes(k) &&
          !r.summary.toLowerCase().includes(k)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [statusFilter, taskFilter, keyword]);

  // 统计：根据全部 runs 汇总（不受关键词影响）
  const stats = useMemo(() => {
    const totalRuns = inspectionRuns.length;
    const finished = inspectionRuns.filter((r) => r.status === "已完成").length;
    const running = inspectionRuns.filter((r) => r.status === "运行中").length;
    const failed = inspectionRuns.filter((r) => r.status === "失败").length;
    const normal = inspectionRuns.reduce((s, r) => s + r.normal, 0);
    const attention = inspectionRuns.reduce((s, r) => s + r.attention, 0);
    const abnormal = inspectionRuns.reduce((s, r) => s + r.abnormal, 0);
    const completionRate = totalRuns ? Math.round((finished / totalRuns) * 100) : 0;
    return { totalRuns, finished, running, failed, normal, attention, abnormal, completionRate };
  }, []);

  // Run 详情抽屉：通过 URL ?run=xxx 联动
  const runId = searchParams.get("run");
  const activeRun = runId ? inspectionRuns.find((r) => r.id === runId) ?? null : null;
  const activeTask = activeRun ? inspectionTasks.find((t) => t.id === activeRun.taskId) ?? null : null;

  function openRun(id: string) {
    const next = new URLSearchParams(searchParams);
    next.set("run", id);
    setSearchParams(next, { replace: false });
  }
  function closeRun() {
    const next = new URLSearchParams(searchParams);
    next.delete("run");
    setSearchParams(next, { replace: false });
  }

  function askAboutRecord(recordId: string) {
    const record = abnormalRecords.find((item) => item.id === recordId);
    if (!record) return;
    const metricResult = inspectionMetricResults.find((item) => item.id === record.metricResultId);
    sessionStorage.setItem(
      "assistant.pendingOpsContext",
      JSON.stringify({
        source: record.triggerSource,
        id: record.id,
        title: `${record.objectLabel} · ${record.abnormalType}`,
        summary: `${record.metricValue}，阈值 ${record.threshold}。${record.evidenceSnapshot} 来源结果 ${record.metricResultId}`,
        metric: record.metricValue,
        threshold: record.threshold,
        evidenceSnapshot: record.evidenceSnapshot,
        logEvidence: metricResult?.logEvidence
          ? [`${metricResult.logEvidence.path} · ${metricResult.logEvidence.keywords.join("、")} 命中 ${metricResult.logEvidence.hitCount} 条`]
          : [],
        returnPath: `/inspection?run=${encodeURIComponent(record.sourceRunId)}`,
      }),
    );
    navigate("/assistant");
  }

  function openAnalysis(recordId: string) {
    const task = faultAnalysisTasks.find((item) => item.abnormalRecordId === recordId);
    navigate(task ? `/fault-analysis/${task.id}` : "/fault-analysis");
  }

  // 当从巡检配置跳转过来时，自动打开 run 抽屉（已经通过 URL 处理）
  useEffect(() => {
    // no-op: handled by URL
  }, [location.search]);

  return (
    <div className="space-y-6">
      {/* 顶部：时间范围 + 操作 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">巡检中心</h2>
          <p className="text-xs text-muted-foreground mt-1">查看巡检结果、关注项和异常记录</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={range} onValueChange={(v) => setRange(v as RangeKey)}>
            <TabsList>
              <TabsTrigger value="today">本日</TabsTrigger>
              <TabsTrigger value="week">本周</TabsTrigger>
              <TabsTrigger value="month">本月</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline"><RefreshCw className="h-4 w-4 mr-2" />刷新</Button>
        </div>
      </div>

      {/* 巡检状态总览 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryTile icon={ListChecks} label="巡检完成率" value={`${stats.completionRate}%`} tone="info" sub={`已完成 ${stats.finished} / 共 ${stats.totalRuns} 次`} />
        <SummaryTile icon={CheckCircle2} label="正常项" value={String(stats.normal)} tone="success" />
        <SummaryTile icon={AlertCircle} label="关注项" value={String(stats.attention)} tone="warning" />
        <SummaryTile icon={AlertTriangle} label="异常项" value={String(stats.abnormal)} tone="destructive" />
      </div>

      {/* 主内容：巡检结果 + 异常/关注记录 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* 巡检结果列表 */}
        <div className="panel xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2 p-5 pb-3">
            <div>
              <h3 className="font-semibold">巡检结果</h3>
              <p className="text-xs text-muted-foreground mt-0.5">点击任意一次巡检查看详细结果</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索任务名 / 摘要"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="h-9 pl-8 w-56"
                />
              </div>
              <Select value={taskFilter} onValueChange={setTaskFilter}>
                <SelectTrigger className="h-9 w-44"><SelectValue placeholder="全部任务" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部任务</SelectItem>
                  {inspectionTasks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-32"><SelectValue placeholder="全部状态" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="已完成">已完成</SelectItem>
                  <SelectItem value="运行中">运行中</SelectItem>
                  <SelectItem value="失败">失败</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>巡检</TableHead>
                <TableHead>所属任务</TableHead>
                <TableHead>开始时间</TableHead>
                <TableHead>耗时</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">结果</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRuns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                    没有匹配的巡检记录
                  </TableCell>
                </TableRow>
              ) : (
                filteredRuns.map((r) => {
                  const task = inspectionTasks.find((t) => t.id === r.taskId);
                  return (
                    <TableRow
                      key={r.id}
                      className="hover:bg-secondary/40 cursor-pointer"
                      onClick={() => openRun(r.id)}
                    >
                      <TableCell>
                        <span className="font-medium tabular-nums">#{r.id.replace("run-", "")}</span>
                        <div className="text-xs text-muted-foreground mt-0.5">{r.trigger} · {r.operator}</div>
                      </TableCell>
                      <TableCell className="text-sm">{task?.name ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground tabular-nums">{r.startTime}</TableCell>
                      <TableCell className="text-xs tabular-nums">{r.duration}</TableCell>
                      <TableCell>
                        <StatusBadge tone={statusTone(r.status)} dot={r.status === "运行中"}>{r.status}</StatusBadge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-3 text-xs tabular-nums">
                          <span className="text-success">正 {r.normal}</span>
                          <span className="text-warning">关 {r.attention}</span>
                          <span className="text-destructive">异 {r.abnormal}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div>
          <div className="panel p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <h3 className="font-semibold text-sm">异常/关注记录池</h3>
              </div>
              <span className="text-xs text-muted-foreground tabular-nums">共 {abnormalRecords.length} 条</span>
            </div>
            <div className="space-y-2">
              {abnormalRecords.length === 0 ? (
                <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                  当前无异常/关注记录
                </div>
              ) : (
                abnormalRecords.map((record) => {
                  const analysis = faultAnalysisTasks.find((item) => item.abnormalRecordId === record.id);
                  const borderClass = record.triggerSource === "巡检异常"
                    ? "border-destructive bg-destructive-soft/30"
                    : "border-warning bg-warning-soft/30";
                  return (
                  <div key={record.id} className={`rounded-lg border-l-2 ${borderClass} p-3`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold truncate">{record.id} · {record.abnormalType}</span>
                      <StatusBadge tone={statusTone(record.severity)}>{record.severity}</StatusBadge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <StatusBadge tone={record.triggerSource === "巡检异常" ? "destructive" : "warning"}>{record.triggerSource}</StatusBadge>
                      <StatusBadge tone={statusTone(record.analysisLinkStatus)}>分析：{record.analysisLinkStatus}</StatusBadge>
                      <StatusBadge tone={statusTone(record.handlingStatus)}>处理：{record.handlingStatus}</StatusBadge>
                    </div>
                    <p className="text-xs text-foreground/80 mt-1.5 leading-relaxed">{record.objectLabel}</p>
                    <div className="mt-1 text-xs text-muted-foreground">
                      指标：<span className="text-foreground font-medium tabular-nums">{record.metricValue}</span> · 阈值 {record.threshold}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {analysis ? `分析任务 ${analysis.taskNo}` : "尚未生成分析任务"}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openAnalysis(record.id)}>
                        <ShieldAlert className="h-3.5 w-3.5 mr-1" />{analysis ? "查看分析" : "发起分析"}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => askAboutRecord(record.id)}>
                        <Bot className="h-3.5 w-3.5 mr-1" />基于此记录提问
                      </Button>
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 单次巡检结果详情 */}
      <RunDetailSheet run={activeRun} task={activeTask} onClose={closeRun} />
    </div>
  );
}

function SummaryTile({
  icon: Icon, label, value, tone, sub,
}: {
  icon: any; label: string; value: string; tone: "success" | "warning" | "destructive" | "info"; sub?: string;
}) {
  const map: Record<string, string> = {
    success: "text-success bg-success-soft",
    warning: "text-warning bg-warning-soft",
    destructive: "text-destructive bg-destructive-soft",
    info: "text-info bg-info-soft",
  };
  return (
    <div className="stat-card flex items-center gap-3">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${map[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-semibold tabular-nums leading-none">{value}</div>
        <div className="text-xs text-muted-foreground mt-1 truncate">{sub ?? label}</div>
        {sub && <div className="text-[11px] text-muted-foreground/80">{label}</div>}
      </div>
    </div>
  );
}
