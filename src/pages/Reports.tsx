import { useState, useMemo } from "react";
import {
  FileText, Download, Eye, Plus, Calendar, Filter, Quote,
  ShieldCheck, AlertTriangle, BookOpen, TrendingUp, TrendingDown,
  CheckCircle2, XCircle, Sparkles, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { reports, type ReportItem, type ReportCategory } from "@/lib/mockData";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, PolarAngleAxis, CartesianGrid,
} from "recharts";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";

const categoryMeta: Record<ReportCategory, { icon: any; color: string; bg: string; desc: string }> = {
  巡检质量报告: {
    icon: ShieldCheck,
    color: "text-primary",
    bg: "bg-primary-soft",
    desc: "聚焦巡检完成率、覆盖率与异常项分布",
  },
  风险研判报告: {
    icon: AlertTriangle,
    color: "text-warning",
    bg: "bg-warning/10",
    desc: "聚焦异常分析、风险判断与重点关注对象",
  },
  知识服务报告: {
    icon: BookOpen,
    color: "text-info",
    bg: "bg-info/10",
    desc: "聚焦知识库对运维工作的支撑能力",
  },
};

export default function Reports() {
  const [active, setActive] = useState<"全部" | ReportCategory>("全部");
  const [keyword, setKeyword] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      if (active !== "全部" && r.category !== active) return false;
      if (keyword && !r.title.includes(keyword) && !r.summary.includes(keyword)) return false;
      return true;
    });
  }, [active, keyword]);

  const selected = openId ? reports.find((r) => r.id === openId) ?? null : null;

  const stats = useMemo(() => ({
    total: reports.length,
    quality: reports.filter((r) => r.category === "巡检质量报告").length,
    risk: reports.filter((r) => r.category === "风险研判报告").length,
    knowledge: reports.filter((r) => r.category === "知识服务报告").length,
  }), []);

  return (
    <div className="space-y-5">
      {/* 顶部统计概览 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="本月报告总数" value={stats.total} icon={FileText} tone="primary" />
        <SummaryCard label="巡检质量报告" value={stats.quality} icon={ShieldCheck} tone="success" hint="日报 / 周报" />
        <SummaryCard label="风险研判报告" value={stats.risk} icon={AlertTriangle} tone="warning" hint="周报" />
        <SummaryCard label="知识服务报告" value={stats.knowledge} icon={BookOpen} tone="info" hint="月报" />
      </div>

      {/* 工具条 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={active} onValueChange={(v) => setActive(v as any)}>
          <TabsList>
            <TabsTrigger value="全部">全部</TabsTrigger>
            <TabsTrigger value="巡检质量报告">巡检质量</TabsTrigger>
            <TabsTrigger value="风险研判报告">风险研判</TabsTrigger>
            <TabsTrigger value="知识服务报告">知识服务</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索报告名称 / 摘要"
              className="w-56 pl-8 h-9"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="选择日期范围" className="w-44 pl-8 h-9" />
          </div>
          <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-1" />筛选</Button>
          <Button size="sm"><Plus className="h-4 w-4 mr-1" />生成报告</Button>
        </div>
      </div>

      {/* 报告列表卡片（网格） */}
      {filtered.length === 0 ? (
        <div className="panel p-12 text-center text-sm text-muted-foreground">
          没有匹配的报告
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((r) => {
            const meta = categoryMeta[r.category];
            const Icon = meta.icon;
            return (
              <button
                key={r.id}
                onClick={() => setOpenId(r.id)}
                className="text-left panel p-4 transition-all hover:border-primary/50 hover:shadow-elev-md"
              >
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-lg ${meta.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-5 w-5 ${meta.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">{r.title}</h4>
                      <StatusBadge tone={statusTone(r.status)}>{r.status}</StatusBadge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2.5em]">{r.summary}</p>
                    <div className="flex items-center gap-1.5 mt-2.5 text-xs text-muted-foreground flex-wrap">
                      <StatusBadge tone="info">{r.category}</StatusBadge>
                      <StatusBadge tone="muted">{r.frequency}</StatusBadge>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <span>周期 {r.period}</span>
                      <span>{r.generatedAt}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* 右侧抽屉：报告详情 */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full sm:max-w-3xl overflow-y-auto p-0">
          {selected && (
            <>
              <SheetHeader className="sr-only">
                <SheetTitle>{selected.title}</SheetTitle>
              </SheetHeader>
              <div className="p-6">
                <ReportHeader report={selected} />
                <div className="mt-5 space-y-5 text-sm leading-relaxed">
                  {selected.category === "巡检质量报告" && <QualityReport report={selected} />}
                  {selected.category === "风险研判报告" && <RiskReport report={selected} />}
                  {selected.category === "知识服务报告" && <KnowledgeReport report={selected} />}

                  <div className="rounded-lg bg-muted/40 border border-dashed p-3 text-xs text-muted-foreground flex items-start gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                    <span>本报告由报告生成 Agent 自动整理，已存入审计留痕。如需修改，请由具备相应权限的用户在草稿状态下进行调整。</span>
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
function ReportHeader({ report }: { report: ReportItem }) {
  const meta = categoryMeta[report.category];
  const Icon = meta.icon;
  return (
    <div className="flex items-start justify-between gap-3 pb-5 border-b">
      <div className="flex items-start gap-3 min-w-0">
        <div className={`h-12 w-12 rounded-xl ${meta.bg} flex items-center justify-center shrink-0`}>
          <Icon className={`h-6 w-6 ${meta.color}`} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <StatusBadge tone="info">{report.category}</StatusBadge>
            <StatusBadge tone="muted">{report.frequency}</StatusBadge>
            <StatusBadge tone={statusTone(report.status)}>{report.status}</StatusBadge>
          </div>
          <h2 className="text-xl font-semibold leading-snug">{report.title}</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {meta.desc} · 周期 {report.period} · 生成于 {report.generatedAt} · 由 {report.author} 输出
          </p>
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button variant="outline" size="sm"><Eye className="h-4 w-4 mr-1" />预览</Button>
        <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" />导出</Button>
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

/* ---------- 风险研判报告 ---------- */
function RiskReport({ report }: { report: ReportItem }) {
  const r = report.risk!;
  const levelTone = r.riskLevel === "高" ? "destructive" : r.riskLevel === "中" ? "warning" : "success";

  return (
    <>
      <Section title="一、整体风险评估">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className={`rounded-lg border p-4 ${levelTone === "destructive" ? "bg-destructive/5 border-destructive/30" : levelTone === "warning" ? "bg-warning/5 border-warning/30" : "bg-success/5 border-success/30"}`}>
            <p className="text-xs text-muted-foreground mb-1">风险等级</p>
            <p className={`text-3xl font-bold ${levelTone === "destructive" ? "text-destructive" : levelTone === "warning" ? "text-warning" : "text-success"}`}>{r.riskLevel}</p>
            <p className="text-xs text-muted-foreground mt-1">综合评分 {r.riskScore} / 100</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">关键告警</p>
            <p className="text-3xl font-bold">{r.keyAlerts.length}</p>
            <p className="text-xs text-muted-foreground mt-1">需重点关注</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">重点对象</p>
            <p className="text-3xl font-bold">{r.focusHosts.length}</p>
            <p className="text-xs text-muted-foreground mt-1 truncate">{r.focusHosts.join("、")}</p>
          </div>
        </div>
        <p className="mt-3 text-foreground/85">{report.summary}</p>
      </Section>

      <Section title="二、关键异常分析">
        <div className="space-y-2">
          {r.keyAlerts.map((a, i) => (
            <div key={i} className="rounded-lg border bg-card p-3 flex items-start gap-3">
              <StatusBadge
                tone={a.severity === "严重" ? "destructive" : a.severity === "警告" ? "warning" : "info"}
                className="shrink-0 mt-0.5"
              >
                {a.severity}
              </StatusBadge>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {a.host} <span className="text-muted-foreground font-normal">· {a.metric}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-warning" /> {a.trend}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="三、根因研判">
        <ul className="space-y-1.5 list-none">
          {r.rootCauses.map((c, i) => (
            <li key={i} className="flex gap-2 items-start text-foreground/85">
              <span className="h-5 w-5 rounded-md bg-warning/15 text-warning flex items-center justify-center text-xs font-semibold shrink-0">{i + 1}</span>
              <span className="pt-0.5 text-sm">{c}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="四、重点关注对象">
        <div className="flex flex-wrap gap-2">
          {r.focusHosts.map((h) => (
            <span key={h} className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md bg-warning/10 border border-warning/30 text-warning font-medium">
              <AlertTriangle className="h-3.5 w-3.5" /> {h}
            </span>
          ))}
        </div>
      </Section>

      <Section title="五、应对建议">
        <ol className="space-y-2 ml-4 list-decimal text-foreground/85">
          {r.recommendations.map((rec, i) => (
            <li key={i} className="text-sm">{rec}</li>
          ))}
        </ol>
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
function Section({ title, children }: { title: string; children: React.ReactNode }) {
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

function SummaryCard({ label, value, icon: Icon, tone, hint }: { label: string; value: number; icon: any; tone: "primary" | "success" | "warning" | "info"; hint?: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    primary: { bg: "bg-primary-soft", text: "text-primary" },
    success: { bg: "bg-success/10", text: "text-success" },
    warning: { bg: "bg-warning/10", text: "text-warning" },
    info: { bg: "bg-info/10", text: "text-info" },
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
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}
