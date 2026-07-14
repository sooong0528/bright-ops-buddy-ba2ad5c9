import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  Server,
  FileText,
  Bot,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import {
  weeklyInspectionTrend,
  reports,
  abnormalRecords,
  agentRuns,
  assets,
  inspectionRuns,
} from "@/lib/mockData";
import { StatCard, StatCardGrid } from "@/components/StatCard";

const latestCompletedRun = inspectionRuns.find((run) => run.status === "已完成");
const validResultCount = latestCompletedRun
  ? latestCompletedRun.normal + latestCompletedRun.attention + latestCompletedRun.abnormal
  : 0;
const normalRate = validResultCount && latestCompletedRun
  ? Math.round(latestCompletedRun.normal / validResultCount * 100)
  : 0;
const activeAbnormalCount = abnormalRecords.filter((record) => record.lifecycleStatus === "活跃").length;
const agentSuccessRate = agentRuns.length
  ? Math.round(agentRuns.filter((run) => run.status === "成功").length / agentRuns.length * 100)
  : 0;

const stats = [
  { label: "纳管资产", value: String(assets.filter((asset) => asset.status === "在用").length), unit: "个", description: "当前在用资产", icon: Server, tone: "info" as const },
  { label: "最近巡检正常率", value: String(normalRate), unit: "%", description: latestCompletedRun?.id ?? "暂无执行", icon: CheckCircle2, tone: "success" as const },
  { label: "活跃异常记录", value: String(activeAbnormalCount), unit: "项", description: "含关注与异常", icon: TrendingUp, tone: "warning" as const },
  { label: "Agent 调用", value: String(agentRuns.length), unit: "次", description: "当前样例数据", icon: Bot, tone: "info" as const },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Hero 概览条 */}
      <div className="rounded-2xl bg-gradient-hero p-6 md:p-8 text-primary-foreground shadow-elev-lg relative overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-60" />
        <div className="absolute inset-0 data-grid opacity-[0.07]" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-glow/30 blur-3xl" />
        <div className="absolute -left-10 -bottom-20 h-48 w-48 rounded-full bg-info/30 blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-medium px-2.5 py-1 rounded-full bg-white/15 backdrop-blur mb-3 border border-white/20">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-soft" />
              平台运行正常 · Zabbix 7.0.21 已对接
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">业务系统运维态势 · 2025-04-22</h2>
            <p className="text-sm opacity-85 mt-2 max-w-2xl leading-relaxed">
              指挥调度 Agent 已完成今日 3 项巡检任务，识别 2 项异常与 2 项关注，建议优先处理 app-svc-01 与 mq-01。
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button asChild variant="secondary" className="bg-white/15 text-primary-foreground hover:bg-white/25 border border-white/20 backdrop-blur">
              <Link to="/inspection">查看巡检</Link>
            </Button>
            <Button asChild className="bg-white text-primary hover:bg-white/95 shadow-lg">
              <Link to="/assistant">向助手提问 <ArrowUpRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </div>

      {/* 关键指标 */}
      <StatCardGrid>
        {stats.map((s) => (
          <StatCard
            key={s.label}
            title={s.label}
            value={s.value}
            unit={s.unit}
            description={s.description}
            icon={s.icon}
            tone={s.tone}
          />
        ))}
      </StatCardGrid>

      {/* 异常记录 & Agent 工作情况 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="panel p-5 lg:col-span-2 lg:h-[500px] 2xl:h-[520px] flex min-h-0 flex-col overflow-hidden">
          <div className="flex shrink-0 items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" /> 异常记录
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">来自巡检异常与关注记录 · 建议尽快处置</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link to="/inspection/abnormal">更多 <ArrowUpRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
          <div className="grid flex-1 min-h-0 auto-rows-fr gap-2 overflow-hidden">
            {abnormalRecords.slice(0, 5).map((r) => (
              <Link key={r.id} to={`/analysis?record=${r.id}`}
                className="flex items-center gap-3 rounded-lg border bg-card/50 px-3 py-2.5 hover:border-primary/40 hover:bg-primary-soft/30 transition group">
                <StatusBadge tone={r.currentLevel === "异常" ? "destructive" : "warning"}>{r.currentLevel}</StatusBadge>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{r.assetName} · {r.metric}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{r.value}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{r.description}</p>
                </div>
                <StatusBadge tone={r.lifecycleStatus === "已恢复" ? "success" : r.status === "已忽略" ? "muted" : "warning"}>
                  {r.lifecycleStatus === "已恢复" ? "已恢复" : r.status}
                </StatusBadge>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </div>

        <div className="panel p-5 flex min-h-0 flex-col overflow-hidden lg:h-[500px] 2xl:h-[520px]">
          <div className="flex shrink-0 items-center justify-between mb-3">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Agent 工作情况
            </h3>
            <Button asChild variant="ghost" size="sm" className="text-sm">
              <Link to="/audit">调用日志 <ArrowUpRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid shrink-0 grid-cols-3 gap-2 mb-3">
            <div className="rounded-md bg-muted/40 py-2 text-center">
              <div className="text-lg font-semibold text-success tabular-nums">{agentSuccessRate}%</div>
              <div className="text-xs text-muted-foreground">成功率</div>
            </div>
            <div className="rounded-md bg-muted/40 py-2 text-center">
              <div className="text-lg font-semibold text-primary tabular-nums">{agentRuns.length}</div>
              <div className="text-xs text-muted-foreground">今日调用</div>
            </div>
            <div className="rounded-md bg-muted/40 py-2 text-center">
              <div className="text-lg font-semibold text-info tabular-nums">720ms</div>
              <div className="text-xs text-muted-foreground">平均耗时</div>
            </div>
          </div>
          <div className="grid flex-1 auto-rows-fr gap-1.5 min-h-0">
            {agentRuns.slice(0, 5).map((a) => (
              <div key={a.id} className="flex flex-col justify-center rounded-md border bg-card/50 px-2.5 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium truncate">{a.agent}</span>
                  <StatusBadge tone={a.status === "成功" ? "success" : "destructive"}>{a.status}</StatusBadge>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{a.task}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-0.5">
                  <span className="tabular-nums">{a.startTime.split(" ")[1]}</span>
                  <span className="tabular-nums">{a.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 近 7 天巡检异常趋势 */}
        <div className="panel p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />近 7 天巡检异常趋势
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">每日巡检产生的关注项与异常项数量</p>
            </div>
            <StatusBadge tone="info">近 7 天</StatusBadge>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyInspectionTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={14} interval={0} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={14} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 14 }} />
                <Legend wrapperStyle={{ fontSize: 14 }} />
                <Line type="monotone" dataKey="关注项" stroke="hsl(var(--warning))" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="异常项" stroke="hsl(var(--destructive))" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 最新报告 */}
        <div className="panel p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> 最新报告
            </h3>
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link to="/reports">全部 <ArrowUpRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
          <div className="space-y-2">
            {reports.slice(0, 5).map((r) => (
              <Link key={r.id} to={`/reports?report=${r.id}`}
                className="block rounded-lg border bg-card/50 px-3 py-2.5 hover:border-primary/40 hover:bg-primary-soft/30 transition">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate">{r.title}</span>
                  <StatusBadge tone={statusTone(r.status)}>{r.status}</StatusBadge>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <StatusBadge tone="info">{r.category}</StatusBadge>
                  {r.frequency && <StatusBadge tone="muted">{r.frequency}</StatusBadge>}
                  <span className="ml-auto tabular-nums">{r.generatedAt}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
