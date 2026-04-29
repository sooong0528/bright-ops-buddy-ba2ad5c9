import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  ListChecks,
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
  alerts,
  hosts,
} from "@/lib/mockData";

type RangeKey = "today" | "week" | "month";

export default function Inspection() {
  const location = useLocation();
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

  // 异常追踪：按主机汇总
  const abnormalHosts = useMemo(() => hosts.filter((h) => h.status !== "正常"), []);

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

  // 当从巡检管理跳转过来时，自动打开 run 抽屉（已经通过 URL 处理）
  useEffect(() => {
    // no-op: handled by URL
  }, [location.search]);

  return (
    <div className="space-y-6">
      {/* 顶部：时间范围 + 操作 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">巡检中心</h2>
          <p className="text-xs text-muted-foreground mt-1">查看巡检状态、结果与异常追踪 · 面向运维与值班人员</p>
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
        <SummaryTile icon={CheckCircle2} label="主机正常项" value={String(stats.normal)} tone="success" />
        <SummaryTile icon={AlertCircle} label="关注项" value={String(stats.attention)} tone="warning" />
        <SummaryTile icon={AlertTriangle} label="异常项" value={String(stats.abnormal)} tone="destructive" />
      </div>

      {/* 主内容：巡检结果 + 异常追踪 */}
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

        {/* 异常追踪 */}
        <div className="panel p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">异常追踪</h3>
              <p className="text-xs text-muted-foreground mt-0.5">需要关注与处置的主机</p>
            </div>
            <span className="text-xs text-muted-foreground">{abnormalHosts.length} 台</span>
          </div>

          <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
            {abnormalHosts.length === 0 ? (
              <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                当前无异常 ✓
              </div>
            ) : (
              abnormalHosts.map((h) => (
                <div key={h.id} className="rounded-lg border bg-card p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate">{h.name}</span>
                    <StatusBadge tone={statusTone(h.status)} dot={h.status === "异常"}>{h.status}</StatusBadge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{h.ip} · {h.group}</div>
                </div>
              ))
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <h4 className="font-semibold text-sm">巡检发现的告警</h4>
            </div>
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {alerts.map((a) => (
                <div key={a.id} className="rounded-lg border-l-2 border-destructive bg-destructive-soft/30 p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold">{a.host} · {a.metric}</span>
                    <StatusBadge tone={statusTone(a.severity)}>{a.severity}</StatusBadge>
                  </div>
                  <p className="text-xs text-foreground/80 mt-1 line-clamp-2">{a.description}</p>
                  <p className="text-xs text-muted-foreground mt-1 tabular-nums">{a.time}</p>
                </div>
              ))}
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
