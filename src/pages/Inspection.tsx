import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  ListChecks,
  Stethoscope,
  MessageSquareQuote,
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
  abnormalRecords,
} from "@/lib/mockData";

type RangeKey = "today" | "week" | "month";
type ViewKey = "results" | "abnormal";

export default function Inspection() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = (searchParams.get("tab") as ViewKey) || "results";
  const [view, setView] = useState<ViewKey>(initialTab);
  const [range, setRange] = useState<RangeKey>("today");
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [taskFilter, setTaskFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [recStatusFilter, setRecStatusFilter] = useState<string>("all");

  useEffect(() => {
    const t = searchParams.get("tab") as ViewKey | null;
    if (t && t !== view) setView(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function switchView(v: ViewKey) {
    setView(v);
    const next = new URLSearchParams(searchParams);
    if (v === "results") next.delete("tab"); else next.set("tab", v);
    setSearchParams(next, { replace: true });
  }

  function startAnalysisById(recordId: string) {
    navigate(`/analysis?record=${recordId}`);
  }
  function startAnalysis(alertId: string) {
    navigate(`/analysis?alert=${alertId}`);
  }
  function askAbout(title: string, sourceId: string, snapshot: string, sourceType: "巡检异常" | "关注项" = "巡检异常") {
    sessionStorage.setItem("assistant.context", JSON.stringify({
      sourceType,
      sourceId,
      title,
      snapshot,
    }));
    navigate("/assistant");
  }



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

  // 待关注事项列表：合并 abnormalRecords（level=异常/关注）
  const filteredRecords = useMemo(() => {
    return abnormalRecords.filter((r) => {
      if (levelFilter !== "all" && r.level !== levelFilter) return false;
      if (recStatusFilter !== "all" && r.status !== recStatusFilter) return false;
      if (keyword) {
        const k = keyword.toLowerCase();
        if (
          !r.assetName.toLowerCase().includes(k) &&
          !r.metric.toLowerCase().includes(k) &&
          !r.description.toLowerCase().includes(k)
        ) return false;
      }
      return true;
    });
  }, [levelFilter, recStatusFilter, keyword]);

  const abnormalCount = abnormalRecords.filter((r) => r.level === "异常").length;
  const attentionCount = abnormalRecords.filter((r) => r.level === "关注").length;

  return (
    <div className="space-y-6">
      {/* 巡检状态总览 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryTile icon={ListChecks} label="巡检完成率" value={`${stats.completionRate}%`} tone="info" sub={`已完成 ${stats.finished} / 共 ${stats.totalRuns} 次`} />
        <SummaryTile icon={CheckCircle2} label="主机正常项" value={String(stats.normal)} tone="success" />
        <SummaryTile icon={AlertCircle} label="关注项" value={String(attentionCount)} tone="warning" />
        <SummaryTile icon={AlertTriangle} label="异常项" value={String(abnormalCount)} tone="destructive" />
      </div>

      {/* 工具条：视图切换 + 时间范围 + 操作 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={view} onValueChange={(v) => switchView(v as ViewKey)}>
          <TabsList>
            <TabsTrigger value="results">巡检结果</TabsTrigger>
            <TabsTrigger value="abnormal">
              待关注事项
              <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">{abnormalRecords.length}</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          {view === "results" && (
            <Tabs value={range} onValueChange={(v) => setRange(v as RangeKey)}>
              <TabsList>
                <TabsTrigger value="today">本日</TabsTrigger>
                <TabsTrigger value="week">本周</TabsTrigger>
                <TabsTrigger value="month">本月</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          <Button variant="outline"><RefreshCw className="h-4 w-4 mr-2" />刷新</Button>
        </div>
      </div>


      {view === "results" ? (
        /* ============ 巡检结果视图 ============ */
        <div>
          <div className="panel">
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
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        /* ============ 待关注事项视图 ============ */
        <div className="panel">
          <div className="flex flex-wrap items-center justify-between gap-2 p-5 pb-3">
            <div>
              <h3 className="font-semibold">待关注事项</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                汇集巡检发现的「异常」与「关注」记录 · 支持发起故障分析或提问助手
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索资产 / 指标 / 描述"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="h-9 pl-8 w-56"
                />
              </div>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="h-9 w-28"><SelectValue placeholder="级别" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部级别</SelectItem>
                  <SelectItem value="异常">异常</SelectItem>
                  <SelectItem value="关注">关注</SelectItem>
                </SelectContent>
              </Select>
              <Select value={recStatusFilter} onValueChange={setRecStatusFilter}>
                <SelectTrigger className="h-9 w-28"><SelectValue placeholder="状态" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="待处理">待处理</SelectItem>
                  <SelectItem value="分析中">分析中</SelectItem>
                  <SelectItem value="已闭环">已闭环</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">级别</TableHead>
                <TableHead>资产 / 指标</TableHead>
                <TableHead>当前值</TableHead>
                <TableHead>阈值</TableHead>
                <TableHead>描述</TableHead>
                <TableHead className="w-28">发生时间</TableHead>
                <TableHead className="w-24">状态</TableHead>
                <TableHead className="text-right w-56">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                    暂无匹配的待关注事项
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((r) => (
                  <TableRow key={r.id} className="hover:bg-secondary/40">
                    <TableCell>
                      <StatusBadge tone={r.level === "异常" ? "destructive" : "warning"} dot={r.level === "异常"}>
                        {r.level}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{r.assetName}</div>
                      <div className="text-xs text-muted-foreground">{r.metric}</div>
                    </TableCell>
                    <TableCell className="text-sm tabular-nums font-medium">{r.value}</TableCell>
                    <TableCell className="text-xs text-muted-foreground tabular-nums">{r.threshold}</TableCell>
                    <TableCell className="text-xs text-foreground/80 max-w-sm truncate" title={r.description}>
                      {r.description}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground tabular-nums">{r.time}</TableCell>
                    <TableCell>
                      <StatusBadge tone={r.status === "已闭环" ? "success" : r.status === "分析中" ? "info" : "warning"}>
                        {r.status}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs"
                          onClick={() => startAnalysisById(r.id)}>
                          <Stethoscope className="h-3 w-3 mr-1" />故障分析
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs"
                          onClick={() => askAbout(
                            `${r.assetName} · ${r.metric}`,
                            r.id,
                            r.evidenceSnapshot || r.description,
                            r.level === "关注" ? "关注项" : "巡检异常"
                          )}>
                          <MessageSquareQuote className="h-3 w-3 mr-1" />智能问答
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between px-5 py-3 border-t bg-muted/20 text-xs text-muted-foreground">
            <span>共 {filteredRecords.length} 条待关注事项</span>
            <span>异常 {abnormalCount} · 关注 {attentionCount}</span>
          </div>
        </div>
      )}

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
