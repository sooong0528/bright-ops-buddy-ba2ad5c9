import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Wrench, Search, BookOpen, MessageSquare, Bot, RefreshCw,
  CheckCircle2, Clock, FileText, TrendingUp, AlertTriangle, RotateCcw, XCircle, Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { analysisTasks, abnormalRecords, type AnalysisTask, type AnalysisTaskStatus } from "@/lib/mockData";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { toast } from "@/hooks/use-toast";

function statusTone(s: AnalysisTaskStatus) {
  switch (s) {
    case "分析中": return "info" as const;
    case "已分析": return "success" as const;
    case "分析失败": return "destructive" as const;
  }
}

export default function Analysis() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const initialId = sp.get("task");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [keyword, setKeyword] = useState("");
  const [openId, setOpenId] = useState<string | null>(initialId);

  const filtered = useMemo(() => analysisTasks.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (keyword) {
      const k = keyword.toLowerCase();
      if (![t.id, t.assetName, t.metric, t.businessSystem, t.recordId].some((s) => s.toLowerCase().includes(k))) return false;
    }
    return true;
  }), [statusFilter, keyword]);

  const selected = openId ? analysisTasks.find((t) => t.id === openId) ?? null : null;

  const stats = useMemo(() => ({
    total: analysisTasks.length,
    analyzing: analysisTasks.filter((t) => t.status === "分析中").length,
    done: analysisTasks.filter((t) => t.status === "已分析").length,
    failed: analysisTasks.filter((t) => t.status === "分析失败").length,
  }), []);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="分析任务总数" value={stats.total} icon={Wrench} tone="primary" />
        <SummaryCard label="分析中" value={stats.analyzing} icon={Loader2} tone="info" />
        <SummaryCard label="已分析" value={stats.done} icon={CheckCircle2} tone="success" />
        <SummaryCard label="分析失败" value={stats.failed} icon={XCircle} tone="destructive" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="搜索分析编号 / 资产 / 指标" value={keyword} onChange={(e) => setKeyword(e.target.value)} className="h-9 pl-8 w-64" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-32"><SelectValue placeholder="分析状态" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="分析中">分析中</SelectItem>
              <SelectItem value="已分析">已分析</SelectItem>
              <SelectItem value="分析失败">分析失败</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline"><RefreshCw className="h-4 w-4 mr-2" />刷新</Button>
      </div>

      <div className="panel">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>资产名称</TableHead>
              <TableHead className="w-20">资产类型</TableHead>
              <TableHead className="w-32">业务系统</TableHead>
              <TableHead className="w-20">当前级别</TableHead>
              <TableHead className="w-20">最高级别</TableHead>
              <TableHead className="w-24">分析状态</TableHead>
              <TableHead className="w-24">发起来源</TableHead>
              <TableHead className="w-20">发起人</TableHead>
              <TableHead className="w-36">发起时间</TableHead>
              <TableHead className="w-36">完成时间</TableHead>
              <TableHead className="text-right w-48">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="py-12 text-center text-sm text-muted-foreground">暂无分析任务</TableCell>
              </TableRow>
            ) : filtered.map((t) => (
              <TableRow key={t.id} className="hover:bg-secondary/40 cursor-pointer" onClick={() => setOpenId(t.id)}>
                <TableCell className="text-sm font-medium">{t.assetName}<div className="text-xs text-muted-foreground">{t.metric}</div></TableCell>
                <TableCell className="text-xs">{t.assetType}</TableCell>
                <TableCell className="text-xs">{t.businessSystem}</TableCell>
                <TableCell><StatusBadge tone={t.currentLevel === "异常" ? "destructive" : "warning"}>{t.currentLevel}</StatusBadge></TableCell>
                <TableCell><StatusBadge tone={t.maxLevel === "异常" ? "destructive" : "warning"}>{t.maxLevel}</StatusBadge></TableCell>
                <TableCell><StatusBadge tone={statusTone(t.status)}>{t.status}</StatusBadge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{t.source}</TableCell>
                <TableCell className="text-xs">{t.createdBy}</TableCell>
                <TableCell className="text-xs text-muted-foreground tabular-nums">{t.createdAt}</TableCell>
                <TableCell className="text-xs text-muted-foreground tabular-nums">{t.completedAt ?? "—"}</TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  {t.status === "分析中" && (
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setOpenId(t.id)}>
                      <Clock className="h-3 w-3 mr-1" />查看进度
                    </Button>
                  )}
                  {t.status === "已分析" && (
                    <div className="inline-flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setOpenId(t.id)}>
                        <FileText className="h-3 w-3 mr-1" />查看报告
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 px-2 text-xs"
                        onClick={() => toast({ title: "已发起重新分析", description: `${t.id} · 使用异常记录最新数据` })}>
                        <RotateCcw className="h-3 w-3 mr-1" />重新分析
                      </Button>
                    </div>
                  )}
                  {t.status === "分析失败" && (
                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs"
                      onClick={() => toast({ title: "已发起重新分析", description: `${t.id}` })}>
                      <RotateCcw className="h-3 w-3 mr-1" />重新分析
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between px-5 py-3 border-t bg-muted/20 text-xs text-muted-foreground">
          <span>共 {filtered.length} 条分析任务</span>
          <span>分析中 {stats.analyzing} · 已分析 {stats.done} · 分析失败 {stats.failed}</span>
        </div>
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
          {selected && <AnalysisDetail task={selected} onGoAssistant={(t) => {
            sessionStorage.setItem("assistant.pendingReportContext", JSON.stringify({
              id: t.id, title: `${t.assetName} · ${t.metric}`, type: "故障分析",
            }));
            navigate("/assistant");
          }} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function AnalysisDetail({ task, onGoAssistant }: { task: AnalysisTask; onGoAssistant: (t: AnalysisTask) => void }) {
  const record = abnormalRecords.find((r) => r.id === task.recordId);
  const navigate = useNavigate();

  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-primary" />
          <span>{task.assetName} · {task.metric}</span>
          <StatusBadge tone={statusTone(task.status)}>{task.status}</StatusBadge>
        </SheetTitle>
      </SheetHeader>

      <div className="mt-4 flex flex-wrap gap-2">
        <StatusBadge tone={task.currentLevel === "异常" ? "destructive" : "warning"}>当前级别 {task.currentLevel}</StatusBadge>
        <StatusBadge tone={task.maxLevel === "异常" ? "destructive" : "warning"}>最高级别 {task.maxLevel}</StatusBadge>
        <StatusBadge tone="muted">发起 {task.createdBy} · {task.createdAt}</StatusBadge>
      </div>

      {record && (
        <div className="mt-4 rounded-lg border bg-card p-3 text-sm space-y-1">
          <p className="text-xs text-muted-foreground">关联异常</p>
          <p><span className="font-medium">{record.assetName} / {record.metric}</span></p>
          <p><span className="text-muted-foreground">当前值：</span><span className="font-medium">{record.value}</span>
            <span className="mx-2 text-muted-foreground">·</span>
            <span className="text-muted-foreground">触发规则：</span>{record.triggerRule}</p>
        </div>
      )}

      {task.status === "分析中" && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold mb-2 text-foreground/90 flex items-center gap-1.5">
            <Loader2 className="h-4 w-4 text-info animate-spin" />分析进度
          </h3>
          <div className="rounded-lg border bg-card p-4 space-y-2">
            {task.progress?.map((p, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                {p.done ? (
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                ) : (
                  <Loader2 className="h-4 w-4 text-info animate-spin shrink-0" />
                )}
                <span className={p.done ? "text-foreground/80" : "text-foreground font-medium"}>{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {task.status === "分析失败" && (
        <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive-soft p-4">
          <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
            <XCircle className="h-4 w-4" />分析失败
          </div>
          <p className="text-sm text-foreground/85 mt-1.5">{task.failReason ?? "未知错误"}</p>
          <Button size="sm" className="mt-3" onClick={() => toast({ title: "已发起重新分析" })}>
            <RotateCcw className="h-4 w-4 mr-1" />重新分析
          </Button>
        </div>
      )}

      {task.status === "已分析" && (
        <div className="mt-5 space-y-5">
          <Section title={<span className="flex items-center gap-1.5"><TrendingUp className="h-4 w-4 text-primary" />指标趋势</span>}>
            <div className="rounded-lg border bg-card p-3">
              <p className="text-xs text-muted-foreground mb-2">{task.metricTrend.metric} · 基线 {task.metricTrend.baseline}</p>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={task.metricTrend.points}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                  <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-xs text-foreground/85 mt-2">{task.metricTrend.observation}</p>
            </div>
          </Section>

          <Section title={<span className="flex items-center gap-1.5"><FileText className="h-4 w-4 text-info" />日志关键片段</span>}>
            <div className="rounded-lg border bg-card divide-y text-xs">
              {task.logSnippets.map((l, i) => (
                <div key={i} className="px-3 py-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="tabular-nums">{l.time}</span>
                    <span className="text-primary">{l.source}</span>
                    <StatusBadge tone={l.level === "ERROR" ? "destructive" : "warning"}>{l.level}</StatusBadge>
                    <span>命中：{l.keyword}</span>
                  </div>
                  <div className="mt-1 font-mono text-foreground/85">{l.text}</div>
                </div>
              ))}
            </div>
          </Section>

          <Section title={<span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4 text-info" />知识库引用</span>}>
            <div className="space-y-2">
              {task.knowledgeRefs.map((k) => (
                <div key={k.id} className="rounded-lg border bg-card p-3">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <StatusBadge tone="info">{k.category}</StatusBadge>{k.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{k.snippet}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="原因假设">
            <ul className="space-y-1.5 list-none">
              {task.hypotheses.map((h, i) => (
                <li key={i} className="flex gap-2 items-start text-sm">
                  <span className="h-5 w-5 rounded-md bg-warning/15 text-warning flex items-center justify-center text-xs font-semibold shrink-0">{i + 1}</span>
                  <span className="pt-0.5">{h}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="处置建议">
            <ol className="ml-4 list-decimal space-y-1 text-sm">
              {task.actions.map((a, i) => <li key={i}>{a}</li>)}
            </ol>
          </Section>

          <Section title="人工确认事项">
            <ul className="space-y-1.5 list-none">
              {task.humanConfirm.map((s, i) => (
                <li key={i} className="text-sm rounded-md border border-dashed p-2 flex gap-2 items-start">
                  <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />{s}
                </li>
              ))}
            </ul>
          </Section>

          <Section title={<span className="flex items-center gap-1.5"><Bot className="h-4 w-4 text-primary" />Agent 调用轨迹</span>}>
            <div className="rounded-lg border bg-card divide-y text-xs">
              {task.agentTrace.map((t, i) => (
                <div key={i} className="px-3 py-2 flex items-center gap-3">
                  <StatusBadge tone="info">{t.agent}</StatusBadge>
                  <span className="text-muted-foreground truncate flex-1">{t.input} → {t.output}</span>
                  <span className="text-muted-foreground tabular-nums">{t.duration}</span>
                </div>
              ))}
            </div>
          </Section>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" onClick={() => toast({ title: "已发起重新分析", description: `${task.id} · 使用异常记录最新数据` })}>
              <RotateCcw className="h-4 w-4 mr-1" />重新分析
            </Button>
            <Button variant="outline" size="sm" onClick={() => onGoAssistant(task)}>
              <MessageSquare className="h-4 w-4 mr-1" />追问
            </Button>
            <Button size="sm" onClick={() => { toast({ title: "已生成故障分析报告", description: "可在报告中心查看" }); navigate("/reports"); }}>
              <FileText className="h-4 w-4 mr-1" />生成报告
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

function Section({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-sm font-semibold mb-2 text-foreground/90">{title}</h3>
      {children}
    </section>
  );
}

function SummaryCard({ label, value, icon: Icon, tone }: { label: string; value: number; icon: any; tone: "primary" | "success" | "warning" | "info" | "destructive" }) {
  const map: Record<string, { bg: string; text: string }> = {
    primary: { bg: "bg-primary-soft", text: "text-primary" },
    success: { bg: "bg-success/10", text: "text-success" },
    warning: { bg: "bg-warning/10", text: "text-warning" },
    info: { bg: "bg-info/10", text: "text-info" },
    destructive: { bg: "bg-destructive-soft", text: "text-destructive" },
  };
  const c = map[tone];
  return (
    <div className="panel p-4 flex items-center gap-3">
      <div className={`h-11 w-11 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}>
        <Icon className={`h-5 w-5 ${c.text}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-2xl font-bold tabular-nums leading-tight">{value}</p>
      </div>
    </div>
  );
}
