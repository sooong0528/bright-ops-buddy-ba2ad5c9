import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FileText, Download,
  ShieldCheck, AlertTriangle, BookOpen, TrendingUp,
  Sparkles, Search, Star, MessageSquare, StickyNote, MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { reports, type ReportItem, type ReportCategory } from "@/lib/mockData";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, PolarAngleAxis, CartesianGrid,
} from "recharts";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { StatCard, StatCardGrid } from "@/components/StatCard";
import { TableActions } from "@/components/TableActions";

const categoryMeta: Record<ReportCategory, { icon: any; color: string; bg: string; desc: string }> = {
  巡检报告: {
    icon: ShieldCheck,
    color: "text-primary",
    bg: "bg-primary-soft",
    desc: "聚焦巡检完成率、覆盖率与异常项分布（日报 / 周报）",
  },
  故障分析报告: {
    icon: AlertTriangle,
    color: "text-warning",
    bg: "bg-warning/10",
    desc: "针对异常/关注记录形成的原因假设与处置建议",
  },
  知识服务情况分析报告: {
    icon: BookOpen,
    color: "text-info",
    bg: "bg-info/10",
    desc: "聚焦知识库对运维工作的支撑能力（月报）",
  },
};

interface ReportMeta {
  important: boolean;
  note: string;
}

export default function Reports() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [active, setActive] = useState<"全部" | ReportCategory>("全部");
  const [keyword, setKeyword] = useState("");
  const [openId, setOpenId] = useState<string | null>(() => searchParams.get("report"));
  const [showImportant, setShowImportant] = useState(false);

  // 用户侧标记（备注/重要）—— 仅前端演示
  const [meta, setMeta] = useState<Record<string, ReportMeta>>({
    [reports[0].id]: { important: true, note: "" },
  });
  const getMeta = (id: string): ReportMeta =>
    meta[id] ?? { important: false, note: "" };
  const updateMeta = (id: string, patch: Partial<ReportMeta>) =>
    setMeta((m) => ({ ...m, [id]: { ...getMeta(id), ...patch } }));

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      const m = getMeta(r.id);
      if (showImportant && !m.important) return false;
      if (active !== "全部" && r.category !== active) return false;
      if (keyword && !r.title.includes(keyword) && !r.summary.includes(keyword)) return false;
      return true;
    });
  }, [active, keyword, meta, showImportant]);

  const selected = openId ? reports.find((r) => r.id === openId) ?? null : null;
  const selMeta = selected ? getMeta(selected.id) : null;

  const stats = useMemo(() => {
    return {
      total: reports.length,
      quality: reports.filter((r) => r.category === "巡检报告").length,
      risk: reports.filter((r) => r.category === "故障分析报告").length,
      knowledge: reports.filter((r) => r.category === "知识服务情况分析报告").length,
    };
  }, []);

  const handleExport = (r: ReportItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    toast({ title: "已开始导出", description: `${r.title} · PDF` });
  };

  const handleToggleImportant = (r: ReportItem) => {
    const m = getMeta(r.id);
    updateMeta(r.id, { important: !m.important });
    toast({ title: m.important ? "已取消重要标记" : "已标记为重要" });
  };

  const handleFollowup = (r: ReportItem) => {
    sessionStorage.setItem(
      "assistant.context",
      JSON.stringify({
        sourceType: "报告",
        sourceId: r.id,
        title: r.title,
        displayTime: r.generatedAt,
        snapshot: r.category,
      }),
    );
    navigate("/assistant");
  };

  return (
    <div className="space-y-5">
      {/* 顶部统计概览 */}
      <StatCardGrid>
        <StatCard title="本月报告总数" value={stats.total} icon={FileText} tone="primary" description="当前统计周期" />
        <StatCard title="巡检报告" value={stats.quality} icon={ShieldCheck} tone="success" description="日报 / 周报" />
        <StatCard title="故障分析报告" value={stats.risk} icon={AlertTriangle} tone="warning" description="由异常记录触发" />
        <StatCard title="知识服务报告" value={stats.knowledge} icon={BookOpen} tone="info" description="知识服务月报" />
      </StatCardGrid>

      {/* 工具条 */}
      <div className="filter-bar">
        <Tabs value={active} onValueChange={(v) => setActive(v as any)}>
          <TabsList>
            <TabsTrigger value="全部">全部</TabsTrigger>
            <TabsTrigger value="巡检报告">巡检报告</TabsTrigger>
            <TabsTrigger value="故障分析报告">故障分析</TabsTrigger>
            <TabsTrigger value="知识服务情况分析报告">知识服务</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 h-9 rounded-md border bg-card">
            <Switch id="important-filter" checked={showImportant} onCheckedChange={setShowImportant} />
            <Label htmlFor="important-filter" className="text-xs cursor-pointer flex items-center gap-1">
              <Star className="h-3.5 w-3.5" />仅看重要
            </Label>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索报告名称 / 摘要"
              className="w-56 pl-8 h-9"
            />
          </div>
        </div>
      </div>

      {/* 报告列表卡片（网格） */}
      {filtered.length === 0 ? (
        <div className="panel p-12 text-center text-sm text-muted-foreground">
          {showImportant ? "暂无重要报告" : "没有匹配的报告"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((r) => {
            const m = getMeta(r.id);
            const cmeta = categoryMeta[r.category];
            const Icon = cmeta.icon;
            return (
              <div
                key={r.id}
                onClick={() => setOpenId(r.id)}
                className={cn(
                  "group relative panel p-4 transition-all hover:border-primary/50 hover:shadow-elev-md cursor-pointer",
                  m.important && "ring-1 ring-warning/40",
                )}
              >
                {m.important && (
                  <Star className="absolute top-2.5 right-2.5 h-3.5 w-3.5 fill-warning text-warning" />
                )}
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-lg ${cmeta.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-5 w-5 ${cmeta.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1 pr-5">
                      <h4 className="font-medium text-sm truncate">{r.title}</h4>
                      <StatusBadge tone={statusTone(r.status)}>{r.status}</StatusBadge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2.5em]">{r.summary}</p>
                    <div className="flex items-center gap-1.5 mt-2.5 text-xs text-muted-foreground flex-wrap">
                      <StatusBadge tone="info">{r.category}</StatusBadge>
                      {r.frequency && <StatusBadge tone="muted">{r.frequency}</StatusBadge>}
                      <StatusBadge tone="muted">来源 {r.source.id}</StatusBadge>
                      {m.note && <StatusBadge tone="muted">已备注</StatusBadge>}
                    </div>
                    <div className="flex items-center justify-between mt-2.5 text-xs text-muted-foreground">
                      <span>周期 {r.period} · {r.generatedAt}</span>
                      <TableActions maxVisible={0} moreTrigger="icon" actions={[
                        { label: "导出", onClick: () => handleExport(r) },
                        { label: "追问", onClick: () => handleFollowup(r) },
                        { label: m.important ? "取消重要" : "标记重要", onClick: () => handleToggleImportant(r) },
                      ]} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 右侧抽屉：报告详情 */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full sm:max-w-3xl overflow-y-auto p-0">
          {selected && selMeta && (
            <>
              <SheetHeader className="sr-only">
                <SheetTitle>{selected.title}</SheetTitle>
              </SheetHeader>

              <div className="p-6">
                <ReportHeader
                  report={selected}
                  important={selMeta.important}
                  onExport={() => handleExport(selected)}
                  onFollowup={() => handleFollowup(selected)}
                  onToggleImportant={() => handleToggleImportant(selected)}
                />
                <div className="mt-5 space-y-5 text-sm leading-relaxed">
                  {selected.category === "巡检报告" && <QualityReport report={selected} />}
                  {selected.category === "故障分析报告" && <AnalysisReport report={selected} />}
                  {selected.category === "知识服务情况分析报告" && <KnowledgeReport report={selected} />}

                  {/* 人工备注 */}
                  <Section title={<span className="flex items-center gap-1.5"><StickyNote className="h-4 w-4 text-primary" />人工备注</span>}>
                    <Textarea
                      value={selMeta.note}
                      onChange={(e) => updateMeta(selected.id, { note: e.target.value })}
                      placeholder="补充人工分析、处置情况、领导批示等内容…"
                      className="min-h-[88px] text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      备注仅当前用户可见，不改变报告内容和业务状态。
                    </p>
                  </Section>

                  <div className="rounded-lg bg-muted/40 border border-dashed p-3 text-xs text-muted-foreground flex items-start gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                    <span>本报告由报告生成 Agent 自动整理，已存入审计留痕。如需修订，应基于原来源任务生成新版本。</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

    </div>
  );
}

/* ---------- 报告头 ---------- */
function ReportHeader({
  report, important,
  onExport, onFollowup, onToggleImportant,
}: {
  report: ReportItem;
  important: boolean;
  onExport: () => void;
  onFollowup: () => void;
  onToggleImportant: () => void;
}) {
  const meta = categoryMeta[report.category];
  const Icon = meta.icon;
  return (
    <div className="flex items-start gap-3 pb-5 pr-10 border-b">
      <div className={`h-12 w-12 rounded-xl ${meta.bg} flex items-center justify-center shrink-0`}>
        <Icon className={`h-6 w-6 ${meta.color}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <StatusBadge tone="info">{report.category}</StatusBadge>
          {report.frequency && <StatusBadge tone="muted">{report.frequency}</StatusBadge>}
          <StatusBadge tone="muted">来源 {report.source.type} · {report.source.id}</StatusBadge>
          <StatusBadge tone="muted">Trace {report.traceId}</StatusBadge>
          <StatusBadge tone={statusTone(report.status)}>{report.status}</StatusBadge>
        </div>
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-semibold leading-snug min-w-0 flex-1">{report.title}</h2>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button size="sm" onClick={onExport}>
              <Download className="h-4 w-4 mr-1" />导出
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="h-9 w-9 p-0" aria-label="更多操作">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onFollowup}>
                  <MessageSquare className="h-4 w-4 mr-2" />追问
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onToggleImportant}>
                  <Star className={cn("h-4 w-4 mr-2", important && "fill-warning text-warning")} />
                  {important ? "取消重要" : "标记重要"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {meta.desc} · 周期 {report.period} · 生成于 {report.generatedAt} · 由 {report.author} 输出
        </p>
      </div>
    </div>
  );
}

/* ---------- 巡检质量报告 ---------- */
function QualityReport({ report }: { report: ReportItem }) {
  const q = report.quality!;
  const distData = [
    { name: "正常", value: q.normal, fill: "hsl(var(--success))" },
    { name: "关注", value: q.attention, fill: "hsl(var(--warning))" },
    { name: "异常", value: q.abnormal, fill: "hsl(var(--destructive))" },
  ];

  return (
    <>
      <Section title="一、报告摘要">
        <p>{report.summary}</p>
      </Section>

      <Section title="二、关键指标">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiTile label="巡检完成率" value={`${q.completionRate}%`} hint={`${q.finishedTasks}/${q.totalTasks} 任务`} tone="primary" />
          <KpiTile label="主机覆盖率" value={`${q.coverageRate}%`} hint={`${q.coveredHosts}/${q.totalHosts} 台主机`} tone="success" />
          <KpiTile label="异常项" value={String(q.abnormal)} hint="需立即处理" tone="destructive" />
          <KpiTile label="任务失败次数" value={String(q.failedRuns)} hint="本周期统计" tone={q.failedRuns > 0 ? "warning" : "success"} />
        </div>
      </Section>

      <Section title="三、巡检结果分布">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-2">结果项数量</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={distData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <YAxis type="category" dataKey="name" fontSize={12} stroke="hsl(var(--muted-foreground))" width={48} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-lg border bg-card p-4 space-y-2">
            <p className="text-xs text-muted-foreground mb-2">覆盖率达成</p>
            <ResponsiveContainer width="100%" height={180}>
              <RadialBarChart innerRadius="60%" outerRadius="100%" data={[{ name: "覆盖率", value: q.coverageRate, fill: "hsl(var(--primary))" }]} startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar background dataKey="value" cornerRadius={8} />
              </RadialBarChart>
            </ResponsiveContainer>
            <p className="text-center text-2xl font-semibold -mt-24 pointer-events-none">{q.coverageRate}%</p>
            <p className="text-center text-xs text-muted-foreground mt-16">主机覆盖率</p>
          </div>
        </div>
      </Section>

      <Section title="四、巡检结论">
        <ul className="space-y-2 list-none">
          <ResultItem tone="destructive" label={`异常项 (${q.abnormal})`}>
            app-svc-01 CPU 持续 92% · mq-01 ICMP 探测失败
          </ResultItem>
          <ResultItem tone="warning" label={`关注项 (${q.attention})`}>
            app-web-02 CPU 71% 上升 · db-master-01 内存 82%
          </ResultItem>
          <ResultItem tone="success" label={`正常项 (${q.normal})`}>
            其余主机各项指标平稳
          </ResultItem>
        </ul>
      </Section>

      <Section title="五、改进建议">
        <ol className="space-y-1.5 ml-4 list-decimal text-foreground/85">
          <li>对未完成的 1 项任务追溯失败原因（Zabbix API 鉴权异常），完善重试机制。</li>
          <li>异常主机已纳入下一周期重点关注清单。</li>
          <li>建议针对 MQ 节点新增高频专项巡检任务。</li>
        </ol>
      </Section>
    </>
  );
}

/* ---------- 故障分析报告 ---------- */
function AnalysisReport({ report }: { report: ReportItem }) {
  const a = report.analysis!;
  const pTone = a.priority === "高" ? "destructive" : a.priority === "中" ? "warning" : "success";
  const sevTone = a.severity === "严重" ? "destructive" : a.severity === "警告" ? "warning" : "info";

  return (
    <>
      <Section title="一、报告摘要">
        <div className="flex flex-wrap gap-2 mb-2">
          <StatusBadge tone={sevTone}>{a.severity}</StatusBadge>
          <StatusBadge tone={pTone as any}>优先级 {a.priority}</StatusBadge>
          <StatusBadge tone="muted">异常记录 {a.recordId}</StatusBadge>
          <StatusBadge tone="muted">分析任务 {a.analysisTaskId}</StatusBadge>
          <StatusBadge tone="info">{a.asset}</StatusBadge>
        </div>
        <p>{report.summary}</p>
      </Section>

      <Section title="二、指标趋势">
        <div className="rounded-lg border bg-card p-3 text-sm text-foreground/85">
          {a.metricTrendSummary}
        </div>
      </Section>

      <Section title="三、日志关键片段">
        <div className="rounded-lg border bg-card divide-y">
          {a.logHits.map((h, i) => (
            <div key={i} className="px-3 py-2 text-xs">
              <span className="text-muted-foreground tabular-nums mr-2">{h.time}</span>
              <span className="text-primary mr-2">{h.source}</span>
              <span className="text-foreground/85">{h.text}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="四、知识库引用">
        <div className="space-y-2">
          {a.knowledgeRefs.map((k, i) => (
            <div key={i} className="rounded-lg border bg-card p-3">
              <p className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-info" />{k.title}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{k.snippet}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="五、原因假设">
        <ul className="space-y-1.5 list-none">
          {a.hypotheses.map((h, i) => (
            <li key={i} className="flex gap-2 items-start text-foreground/85">
              <span className="h-5 w-5 rounded-md bg-warning/15 text-warning flex items-center justify-center text-xs font-semibold shrink-0">{i + 1}</span>
              <span className="pt-0.5 text-sm">{h}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="六、处置建议">
        <ol className="space-y-1.5 ml-4 list-decimal text-foreground/85">
          {a.actions.map((s, i) => <li key={i} className="text-sm">{s}</li>)}
        </ol>
      </Section>

      <Section title="七、人工确认事项">
        <ul className="space-y-1.5 list-none">
          {a.humanConfirm.map((s, i) => (
            <li key={i} className="flex gap-2 items-start text-foreground/85 text-sm rounded-md border border-dashed p-2">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />{s}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="八、证据链">
        <ul className="space-y-1 text-xs text-muted-foreground list-disc ml-5">
          {a.evidence.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      </Section>
    </>
  );
}

/* ---------- 知识服务报告 ---------- */
function KnowledgeReport({ report }: { report: ReportItem }) {
  const k = report.knowledge!;
  return (
    <>
      <Section title="一、报告摘要">
        <p>{report.summary}</p>
      </Section>

      <Section title="二、知识支撑能力">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiTile label="问答总次数" value={String(k.totalQA)} hint="本月累计" tone="primary" />
          <KpiTile label="知识命中率" value={`${k.citationRate}%`} hint={`命中 ${k.citedKnowledge} 次`} tone="success" />
          <KpiTile label="新增文档" value={String(k.newDocs)} hint="本月入库" tone="info" />
          <KpiTile label="更新文档" value={String(k.updatedDocs)} hint="持续维护" tone="info" />
        </div>
      </Section>

      <Section title="三、热门问题 Top 5">
        <div className="rounded-lg border bg-card divide-y">
          {k.topQuestions.map((q, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5">
              <span className="h-6 w-6 rounded-full bg-primary-soft text-primary flex items-center justify-center text-xs font-semibold shrink-0">{i + 1}</span>
              <span className="flex-1 text-sm truncate">{q.q}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{q.count} 次</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="四、高频引用文档">
        <div className="space-y-2">
          {k.topDocs.map((d, i) => (
            <div key={i} className="rounded-lg border bg-card p-3 flex items-center gap-3">
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <span className="flex-1 text-sm truncate">{d.title}</span>
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${(d.cited / k.topDocs[0].cited) * 100}%` }} />
                </div>
                <span className="text-xs text-muted-foreground tabular-nums w-14 text-right">{d.cited} 次</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="五、知识盲区与建议">
        <div className="space-y-2">
          {k.coverageGaps.map((g, i) => (
            <div key={i} className="rounded-lg border border-warning/30 bg-warning/5 p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <span className="text-sm text-foreground/85">{g}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          建议针对上述盲区组织 SOP 编写或外部资料引入，预计可将命中率提升 5-8 个百分点。
        </p>
      </Section>
    </>
  );
}

/* ---------- 通用小组件 ---------- */
function Section({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-sm font-semibold mb-2 text-foreground/90">{title}</h3>
      <div className="text-foreground/80">{children}</div>
    </section>
  );
}

function ResultItem({ tone, label, children }: { tone: "success" | "warning" | "destructive"; label: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 items-start rounded-lg border bg-card p-3">
      <StatusBadge tone={tone} className="shrink-0">{label}</StatusBadge>
      <span className="text-xs text-foreground/85">{children}</span>
    </li>
  );
}

function KpiTile({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone: "primary" | "success" | "warning" | "destructive" | "info" }) {
  const toneCls: Record<string, string> = {
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
    info: "text-info",
  };
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold mt-1 tabular-nums ${toneCls[tone]}`}>{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}
