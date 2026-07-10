import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  ListChecks,
  Clock,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "@/lib/mockData";

type RangeKey = "today" | "week" | "month";

export default function Inspection() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [range, setRange] = useState<RangeKey>("today");
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [taskFilter, setTaskFilter] = useState<string>("all");

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

  const runStats = useMemo(() => {
    const totalRuns = inspectionRuns.length;
    const finished = inspectionRuns.filter((r) => r.status === "已完成").length;
    const running = inspectionRuns.filter((r) => r.status === "运行中").length;
    const completionRate = totalRuns ? Math.round((finished / totalRuns) * 100) : 0;
    const recordsTotal = abnormalRecords.length;
    const abnormal = abnormalRecords.filter((r) => r.currentLevel === "异常").length;
    const attention = abnormalRecords.filter((r) => r.currentLevel === "关注").length;
    return { totalRuns, finished, running, completionRate, recordsTotal, abnormal, attention };
  }, []);

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

  useEffect(() => { /* URL-driven */ }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryTile icon={ListChecks} label="巡检完成率" value={`${runStats.completionRate}%`} tone="info" sub={`已完成 ${runStats.finished} / 共 ${runStats.totalRuns} 次`} />
        <SummaryTile icon={CheckCircle2} label="已完成" value={String(runStats.finished)} tone="success" />
        <SummaryTile icon={Clock} label="运行中" value={String(runStats.running)} tone="warning" />
        <SummaryTile icon={AlertTriangle} label="产生异常/关注记录" value={String(runStats.abnormal + runStats.attention)} tone="destructive" sub={`异常 ${runStats.abnormal} · 关注 ${runStats.attention}`} />
      </div>

      <div className="filter-bar">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索方案 / 摘要"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="h-9 pl-8 w-56"
            />
          </div>
          <Select value={taskFilter} onValueChange={setTaskFilter}>
            <SelectTrigger className="h-9 w-44"><SelectValue placeholder="全部方案" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部方案</SelectItem>
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
          <Tabs value={range} onValueChange={(v) => setRange(v as RangeKey)}>
            <TabsList>
              <TabsTrigger value="today">本日</TabsTrigger>
              <TabsTrigger value="week">本周</TabsTrigger>
              <TabsTrigger value="month">本月</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <Button variant="outline"><RefreshCw className="h-4 w-4 mr-2" />刷新</Button>
      </div>

      <div className="panel">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>巡检</TableHead>
              <TableHead>所属方案</TableHead>
              <TableHead>开始时间</TableHead>
              <TableHead>耗时</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">结果</TableHead>
              <TableHead className="text-right w-24">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRuns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                  没有匹配的巡检记录
                </TableCell>
              </TableRow>
            ) : (
              filteredRuns.map((r) => {
                const task = inspectionTasks.find((t) => t.id === r.taskId);
                return (
                  <TableRow key={r.id} className="hover:bg-secondary/40 cursor-pointer" onClick={() => openRun(r.id)}>
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
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs"
                        onClick={(e) => { e.stopPropagation(); openRun(r.id); }}>
                        <Eye className="h-3 w-3 mr-1" />查看
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

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
        {sub && <div className="text-sm text-muted-foreground/80">{label}</div>}
      </div>
    </div>
  );
}
