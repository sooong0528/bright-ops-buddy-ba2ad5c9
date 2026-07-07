import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  ListChecks,
  Clock,
  Eye,
  Stethoscope,
  MessageSquareQuote,
  MoreHorizontal,
  Bot,
  Ban,
  RotateCcw,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { RunDetailSheet } from "@/components/RunDetailSheet";
import { toast } from "@/hooks/use-toast";
import {
  inspectionTasks,
  inspectionRuns,
  abnormalRecords,
  type AbnormalRecord,
} from "@/lib/mockData";

type RangeKey = "today" | "week" | "month";
type ViewKey = "results" | "abnormal";

function recordStatusTone(s: AbnormalRecord["status"]) {
  switch (s) {
    case "待处理": return "warning" as const;
    case "分析中": return "info" as const;
    case "已恢复": return "success" as const;
    case "已忽略": return "muted" as const;
  }
}

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
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);

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
  function askAbout(r: AbnormalRecord) {
    sessionStorage.setItem("assistant.context", JSON.stringify({
      sourceType: r.level === "关注" ? "关注项" : "巡检异常",
      sourceId: r.id,
      title: `${r.assetName} · ${r.metric}`,
      snapshot: r.evidenceSnapshot || r.description,
    }));
    navigate("/assistant");
  }

  // Mock 时间筛选：演示数据较少
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
    return { totalRuns, finished, running, completionRate };
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

  useEffect(() => { /* handled via URL */ }, [location.search]);

  // 异常/关注记录
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

  const recStats = useMemo(() => {
    const abnormal = abnormalRecords.filter((r) => r.level === "异常").length;
    const attention = abnormalRecords.filter((r) => r.level === "关注").length;
    const pending = abnormalRecords.filter((r) => r.status === "待处理").length;
    const analyzing = abnormalRecords.filter((r) => r.status === "分析中").length;
    const recovered = abnormalRecords.filter((r) => r.status === "已恢复").length;
    return { abnormal, attention, pending, analyzing, recovered };
  }, []);

  const activeRecord = activeRecordId ? abnormalRecords.find((r) => r.id === activeRecordId) ?? null : null;

  return (
    <div className="space-y-6">
      {/* 顶部统计：随视图切换 */}
      {view === "results" ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryTile icon={ListChecks} label="巡检完成率" value={`${runStats.completionRate}%`} tone="info" sub={`已完成 ${runStats.finished} / 共 ${runStats.totalRuns} 次`} />
          <SummaryTile icon={CheckCircle2} label="已完成" value={String(runStats.finished)} tone="success" />
          <SummaryTile icon={Clock} label="运行中" value={String(runStats.running)} tone="warning" />
          <SummaryTile icon={AlertTriangle} label="产生异常/关注记录" value={String(recStats.abnormal + recStats.attention)} tone="destructive" sub={`异常 ${recStats.abnormal} · 关注 ${recStats.attention}`} />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <SummaryTile icon={AlertTriangle} label="异常" value={String(recStats.abnormal)} tone="destructive" />
          <SummaryTile icon={AlertCircle} label="关注" value={String(recStats.attention)} tone="warning" />
          <SummaryTile icon={Clock} label="待处理" value={String(recStats.pending)} tone="warning" />
          <SummaryTile icon={Bot} label="分析中" value={String(recStats.analyzing)} tone="info" />
          <SummaryTile icon={CheckCircle2} label="已恢复" value={String(recStats.recovered)} tone="success" />
        </div>
      )}

      {/* 工具条 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={view} onValueChange={(v) => switchView(v as ViewKey)}>
          <TabsList>
            <TabsTrigger value="results">巡检结果</TabsTrigger>
            <TabsTrigger value="abnormal">
              异常记录
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
        /* ============ 巡检结果 ============ */
        <div className="panel">
          <div className="flex flex-wrap items-center justify-between gap-2 p-5 pb-3">
            <div>
              <h3 className="font-semibold">巡检结果</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                展示每次巡检执行的整体结果。异常与关注的可跟踪问题请前往「异常记录」查看与处理。
              </p>
            </div>
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
            </div>
          </div>
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
      ) : (
        /* ============ 异常记录 ============ */
        <div className="panel">
          <div className="flex flex-wrap items-center justify-between gap-2 p-5 pb-3">
            <div>
              <h3 className="font-semibold">异常/关注记录</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                可跟踪、可处理、可闭环的问题记录。同一资产 + 指标 + 触发规则在未闭环前会合并为一条记录，仅更新最近发现时间与持续时间。
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
                <SelectTrigger className="h-9 w-32"><SelectValue placeholder="处理状态" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="待处理">待处理</SelectItem>
                  <SelectItem value="分析中">分析中</SelectItem>
                  <SelectItem value="已恢复">已恢复</SelectItem>
                  <SelectItem value="已忽略">已忽略</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">级别</TableHead>
                <TableHead>资产 / 指标</TableHead>
                <TableHead className="w-20">当前值</TableHead>
                <TableHead>触发规则</TableHead>
                <TableHead>异常说明</TableHead>
                <TableHead className="w-32">首次发现</TableHead>
                <TableHead className="w-28">持续时间</TableHead>
                <TableHead className="w-24">处理状态</TableHead>
                <TableHead className="text-right w-56">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center text-sm text-muted-foreground">
                    暂无匹配的异常/关注记录
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((r) => (
                  <TableRow key={r.id} className="hover:bg-secondary/40 cursor-pointer" onClick={() => setActiveRecordId(r.id)}>
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
                    <TableCell className="text-xs text-muted-foreground">{r.triggerRule}</TableCell>
                    <TableCell className="text-xs text-foreground/80 max-w-xs truncate" title={r.description}>
                      {r.description}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground tabular-nums">
                      {r.firstSeen}
                      <div className="text-[11px] text-muted-foreground/70 truncate" title={r.sourceRunLabel}>来源：{r.sourceRunLabel ?? "—"}</div>
                    </TableCell>
                    <TableCell className="text-xs tabular-nums">
                      {r.duration}
                      <div className="text-[11px] text-muted-foreground/70">出现 {r.occurrences} 次</div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={recordStatusTone(r.status)}>{r.status}</StatusBadge>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1">
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs"
                          onClick={() => setActiveRecordId(r.id)}>
                          <Eye className="h-3 w-3 mr-1" />查看
                        </Button>
                        {r.level === "异常" ? (
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs"
                            onClick={() => startAnalysisById(r.id)}>
                            <Stethoscope className="h-3 w-3 mr-1" />故障分析
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs"
                            onClick={() => askAbout(r)}>
                            <MessageSquareQuote className="h-3 w-3 mr-1" />追问
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            {r.level === "异常" ? (
                              <DropdownMenuItem onClick={() => askAbout(r)}>
                                <MessageSquareQuote className="h-3.5 w-3.5 mr-2" />追问
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => startAnalysisById(r.id)}>
                                <Stethoscope className="h-3.5 w-3.5 mr-2" />故障分析
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => toast({ title: "已标记恢复", description: `${r.assetName} · ${r.metric}` })}>
                              <RotateCcw className="h-3.5 w-3.5 mr-2" />标记已恢复
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => toast({ title: "已忽略", description: `${r.assetName} · ${r.metric}` })}>
                              <Ban className="h-3.5 w-3.5 mr-2" />忽略
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between px-5 py-3 border-t bg-muted/20 text-xs text-muted-foreground">
            <span>共 {filteredRecords.length} 条异常/关注记录</span>
            <span>异常 {recStats.abnormal} · 关注 {recStats.attention} · 待处理 {recStats.pending} · 分析中 {recStats.analyzing} · 已恢复 {recStats.recovered}</span>
          </div>
        </div>
      )}

      {/* 单次巡检结果详情 */}
      <RunDetailSheet run={activeRun} task={activeTask} onClose={closeRun} />

      {/* 异常记录详情抽屉 */}
      <RecordDetailSheet
        record={activeRecord}
        onClose={() => setActiveRecordId(null)}
        onStartAnalysis={(id) => { setActiveRecordId(null); startAnalysisById(id); }}
        onAsk={(r) => { setActiveRecordId(null); askAbout(r); }}
      />
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

function RecordDetailSheet({
  record, onClose, onStartAnalysis, onAsk,
}: {
  record: AbnormalRecord | null;
  onClose: () => void;
  onStartAnalysis: (id: string) => void;
  onAsk: (r: AbnormalRecord) => void;
}) {
  return (
    <Sheet open={!!record} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
        {record && (
          <>
            <SheetHeader className="space-y-2">
              <div className="flex items-center gap-2">
                <StatusBadge tone={record.level === "异常" ? "destructive" : "warning"} dot={record.level === "异常"}>
                  {record.level}
                </StatusBadge>
                <SheetTitle className="text-lg">{record.assetName} · {record.metric}</SheetTitle>
                <StatusBadge tone={recordStatusTone(record.status)}>{record.status}</StatusBadge>
              </div>
              <SheetDescription className="text-sm">
                当前值 <span className="text-foreground font-medium tabular-nums">{record.value}</span>
                <span className="mx-2 text-muted-foreground">·</span>
                触发规则 <span className="text-foreground">{record.triggerRule}</span>
              </SheetDescription>
            </SheetHeader>

            {/* 概览 */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <MiniTile label="首次发现" value={record.firstSeen} />
              <MiniTile label="最近发现" value={record.lastSeen} />
              <MiniTile label="持续时间" value={record.duration} />
              <MiniTile label="出现次数" value={`${record.occurrences} 次`} />
            </div>

            {/* 触发依据 */}
            <Section title="触发依据">
              <p className="text-sm leading-relaxed">{record.description}</p>
              <div className="mt-2 rounded-md bg-muted/40 p-3 text-xs text-foreground/80 whitespace-pre-line">
                {record.evidenceSnapshot}
              </div>
            </Section>

            {/* 来源巡检 */}
            <Section title="来源巡检">
              <div className="rounded-md border bg-card p-3 text-sm flex items-center justify-between">
                <div>
                  <div className="font-medium">{record.sourceRunLabel ?? "—"}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">巡检执行编号 {record.runId}</div>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs"
                  onClick={() => { onClose(); window.location.assign(`/inspection?run=${record.runId}`); }}>
                  查看巡检详情
                </Button>
              </div>
            </Section>

            {/* 处理记录 */}
            <Section title="处理记录">
              {record.handleLog && record.handleLog.length > 0 ? (
                <div className="space-y-2">
                  {record.handleLog.map((h, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs">
                      <span className="text-muted-foreground tabular-nums shrink-0">{h.time}</span>
                      <span className="text-foreground font-medium shrink-0">{h.actor}</span>
                      <span className="text-foreground/80">{h.action}{h.note ? ` · ${h.note}` : ""}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">暂无处理记录</div>
              )}
            </Section>

            {/* 操作区 */}
            <div className="mt-6 flex items-center gap-2">
              <Button variant="default" onClick={() => onStartAnalysis(record.id)}>
                <Stethoscope className="h-4 w-4 mr-2" />发起故障分析
              </Button>
              <Button variant="outline" onClick={() => onAsk(record)}>
                <MessageSquareQuote className="h-4 w-4 mr-2" />追问
              </Button>
              <Button variant="ghost" className="ml-auto"
                onClick={() => { toast({ title: "已标记恢复", description: `${record.assetName} · ${record.metric}` }); onClose(); }}>
                <RotateCcw className="h-4 w-4 mr-2" />标记已恢复
              </Button>
              <Button variant="ghost"
                onClick={() => { toast({ title: "已忽略", description: `${record.assetName} · ${record.metric}` }); onClose(); }}>
                <Ban className="h-4 w-4 mr-2" />忽略
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function MiniTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2.5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium tabular-nums mt-0.5">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <div className="text-xs font-semibold text-muted-foreground mb-2">{title}</div>
      {children}
    </div>
  );
}
