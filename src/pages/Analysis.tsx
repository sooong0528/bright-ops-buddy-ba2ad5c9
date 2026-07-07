import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wrench, AlertTriangle, Search, BookOpen, MessageSquare, Bot,
  Play, CheckCircle2, Clock, ArrowRight, TrendingUp, FileText,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { abnormalRecords, analysisTasks, type AbnormalRecord } from "@/lib/mockData";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { toast } from "@/hooks/use-toast";

export default function Analysis() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"待处理" | "分析中" | "已恢复" | "已忽略" | "全部">("全部");
  const [keyword, setKeyword] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => abnormalRecords.filter((r) => {
    if (tab !== "全部" && r.status !== tab) return false;
    if (keyword && ![r.assetName, r.metric, r.description].some((s) => s.includes(keyword))) return false;
    return true;
  }), [tab, keyword]);

  const selected = openId ? abnormalRecords.find((r) => r.id === openId) ?? null : null;
  const analysis = selected?.analysisTaskId ? analysisTasks.find((t) => t.id === selected.analysisTaskId) ?? null : null;

  const stats = useMemo(() => ({
    total: abnormalRecords.length,
    pending: abnormalRecords.filter((r) => r.status === "待处理").length,
    analyzing: abnormalRecords.filter((r) => r.status === "分析中").length,
    closed: abnormalRecords.filter((r) => r.status === "已恢复").length,
  }), []);

  const handleStart = (r: AbnormalRecord) => {
    toast({ title: "已发起故障分析", description: `记录 ${r.id} · ${r.assetName} · ${r.metric}` });
    setOpenId(r.id);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="异常/关注总数" value={stats.total} icon={AlertTriangle} tone="primary" />
        <SummaryCard label="待处理" value={stats.pending} icon={Clock} tone="warning" />
        <SummaryCard label="分析中" value={stats.analyzing} icon={Bot} tone="info" />
        <SummaryCard label="已恢复" value={stats.closed} icon={CheckCircle2} tone="success" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList>
            <TabsTrigger value="全部">全部</TabsTrigger>
            <TabsTrigger value="待处理">待处理</TabsTrigger>
            <TabsTrigger value="分析中">分析中</TabsTrigger>
            <TabsTrigger value="已恢复">已恢复</TabsTrigger>
            <TabsTrigger value="已忽略">已忽略</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索资产 / 指标 / 描述" className="w-64 pl-8 h-9" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((r) => (
          <div
            key={r.id}
            onClick={() => setOpenId(r.id)}
            className="panel p-4 cursor-pointer hover:border-primary/50 hover:shadow-elev-md transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge tone={r.level === "异常" ? "destructive" : "warning"}>{r.level}</StatusBadge>
              <StatusBadge tone={r.status === "待处理" ? "warning" : r.status === "分析中" ? "info" : "success"}>{r.status}</StatusBadge>
              <span className="text-xs text-muted-foreground ml-auto">{r.time}</span>
            </div>
            <p className="text-sm font-medium truncate">{r.assetName} · {r.metric}</p>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 min-h-[2.5em]">{r.description}</p>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">当前 <span className="text-foreground font-medium">{r.value}</span> · 阈值 {r.threshold}</span>
              {r.status === "待处理" ? (
                <Button size="sm" variant="outline" className="h-7" onClick={(e) => { e.stopPropagation(); handleStart(r); }}>
                  <Play className="h-3 w-3 mr-1" />发起分析
                </Button>
              ) : (
                <span className="text-primary flex items-center gap-1">查看 <ArrowRight className="h-3 w-3" /></span>
              )}
            </div>
          </div>
        ))}
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-primary" />
                  <span>{selected.assetName} · {selected.metric}</span>
                </SheetTitle>
              </SheetHeader>

              <div className="mt-4 flex flex-wrap gap-2">
                <StatusBadge tone={selected.level === "异常" ? "destructive" : "warning"}>{selected.level}</StatusBadge>
                <StatusBadge tone="muted">异常记录 {selected.id}</StatusBadge>
                <StatusBadge tone="muted">来源任务 {selected.taskId}</StatusBadge>
                <StatusBadge tone="muted">巡检 {selected.runId}</StatusBadge>
              </div>

              <div className="mt-4 rounded-lg border bg-card p-3 text-sm space-y-1">
                <p><span className="text-muted-foreground">观测值：</span><span className="font-medium">{selected.value}</span> · <span className="text-muted-foreground">阈值：</span>{selected.threshold}</p>
                <p className="text-foreground/85">{selected.description}</p>
                <p className="text-xs text-muted-foreground">{selected.evidenceSnapshot}</p>
              </div>

              {!analysis ? (
                <div className="mt-6 text-center rounded-lg border border-dashed p-8">
                  <Bot className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">该记录尚未发起故障分析</p>
                  <Button size="sm" onClick={() => toast({ title: "已发起故障分析" })}>
                    <Play className="h-4 w-4 mr-1" />立即发起分析
                  </Button>
                </div>
              ) : (
                <div className="mt-5 space-y-5">
                  <Section title={<span className="flex items-center gap-1.5"><TrendingUp className="h-4 w-4 text-primary" />指标趋势</span>}>
                    <div className="rounded-lg border bg-card p-3">
                      <p className="text-xs text-muted-foreground mb-2">{analysis.metricTrend.metric} · 基线 {analysis.metricTrend.baseline}</p>
                      <ResponsiveContainer width="100%" height={160}>
                        <LineChart data={analysis.metricTrend.points}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="time" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                          <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                          <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                      <p className="text-xs text-foreground/85 mt-2">{analysis.metricTrend.observation}</p>
                    </div>
                  </Section>

                  <Section title={<span className="flex items-center gap-1.5"><FileText className="h-4 w-4 text-info" />日志关键片段（Filebeat + ES）</span>}>
                    <div className="rounded-lg border bg-card divide-y text-xs">
                      {analysis.logSnippets.map((l, i) => (
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
                      {analysis.knowledgeRefs.map((k) => (
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
                      {analysis.hypotheses.map((h, i) => (
                        <li key={i} className="flex gap-2 items-start text-sm">
                          <span className="h-5 w-5 rounded-md bg-warning/15 text-warning flex items-center justify-center text-xs font-semibold shrink-0">{i + 1}</span>
                          <span className="pt-0.5">{h}</span>
                        </li>
                      ))}
                    </ul>
                  </Section>

                  <Section title="处置建议">
                    <ol className="ml-4 list-decimal space-y-1 text-sm">
                      {analysis.actions.map((a, i) => <li key={i}>{a}</li>)}
                    </ol>
                  </Section>

                  <Section title="人工确认事项">
                    <ul className="space-y-1.5 list-none">
                      {analysis.humanConfirm.map((s, i) => (
                        <li key={i} className="text-sm rounded-md border border-dashed p-2 flex gap-2 items-start">
                          <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />{s}
                        </li>
                      ))}
                    </ul>
                  </Section>

                  <Section title={<span className="flex items-center gap-1.5"><Bot className="h-4 w-4 text-primary" />Agent 调用轨迹</span>}>
                    <div className="rounded-lg border bg-card divide-y text-xs">
                      {analysis.agentTrace.map((t, i) => (
                        <div key={i} className="px-3 py-2 flex items-center gap-3">
                          <StatusBadge tone="info">{t.agent}</StatusBadge>
                          <span className="text-muted-foreground truncate flex-1">{t.input} → {t.output}</span>
                          <span className="text-muted-foreground tabular-nums">{t.duration}</span>
                        </div>
                      ))}
                    </div>
                  </Section>

                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button variant="outline" size="sm" onClick={() => {
                      sessionStorage.setItem("assistant.pendingReportContext", JSON.stringify({
                        id: selected.id, title: `${selected.assetName} · ${selected.metric}`, type: "故障分析",
                      }));
                      navigate("/assistant");
                    }}>
                      <MessageSquare className="h-4 w-4 mr-1" />追问
                    </Button>
                    <Button size="sm" onClick={() => { toast({ title: "已生成故障分析报告", description: "可在报告中心查看" }); navigate("/reports"); }}>
                      <FileText className="h-4 w-4 mr-1" />生成故障分析报告
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
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

function SummaryCard({ label, value, icon: Icon, tone }: { label: string; value: number; icon: any; tone: "primary" | "success" | "warning" | "info" }) {
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
      </div>
    </div>
  );
}
