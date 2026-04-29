import {
  Cpu,
  HardDrive,
  MemoryStick,
  Wifi,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Activity,
  ArrowUpRight,
  Server,
  ClipboardCheck,
  FileText,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import {
  hosts,
  alerts,
  cpuTrend,
  memoryTrend,
  inspectionDistribution,
  weeklyAlertTrend,
  reports,
} from "@/lib/mockData";

const stats = [
  { label: "纳管主机", value: "8", unit: "台", delta: "+0", icon: Server, tone: "info" as const },
  { label: "正常率", value: "75", unit: "%", delta: "-12.5%", icon: CheckCircle2, tone: "success" as const },
  { label: "今日异常", value: "2", unit: "项", delta: "+2", icon: AlertTriangle, tone: "destructive" as const },
  { label: "关注项", value: "2", unit: "项", delta: "+1", icon: TrendingUp, tone: "warning" as const },
];

const toneClass: Record<string, string> = {
  info: "text-info bg-info-soft",
  success: "text-success bg-success-soft",
  warning: "text-warning bg-warning-soft",
  destructive: "text-destructive bg-destructive-soft",
};

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold tabular-nums">{s.value}</span>
                  <span className="text-sm text-muted-foreground">{s.unit}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">较昨日 <span className="text-foreground font-medium">{s.delta}</span></p>
              </div>
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${toneClass[s.tone]}`}>
                <s.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* CPU 趋势 */}
        <div className="panel p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold flex items-center gap-2"><Cpu className="h-4 w-4 text-primary" /> 关键主机 CPU 24h 趋势</h3>
              <p className="text-xs text-muted-foreground mt-0.5">数据源：Zabbix · 单位：%</p>
            </div>
            <StatusBadge tone="info" dot>实时</StatusBadge>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cpuTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} interval={3} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="app-svc-01" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="app-web-01" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="db-master-01" stroke="hsl(var(--warning))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 巡检结果分布 */}
        <div className="panel p-5">
          <h3 className="font-semibold flex items-center gap-2 mb-1"><ClipboardCheck className="h-4 w-4 text-primary" /> 今日巡检分布</h3>
          <p className="text-xs text-muted-foreground mb-2">共 33 项检查</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={inspectionDistribution} dataKey="value" innerRadius={50} outerRadius={75} paddingAngle={2}>
                  {inspectionDistribution.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            {inspectionDistribution.map((d) => (
              <div key={d.name} className="rounded-md bg-muted/40 py-2">
                <div className="text-base font-semibold tabular-nums" style={{ color: d.color }}>{d.value}</div>
                <div className="text-muted-foreground">{d.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 内存趋势 */}
        <div className="panel p-5">
          <h3 className="font-semibold flex items-center gap-2 mb-3"><MemoryStick className="h-4 w-4 text-primary" /> 平均内存使用率</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={memoryTrend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="memg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} interval={3} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="used" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#memg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 周告警趋势 */}
        <div className="panel p-5 lg:col-span-2">
          <h3 className="font-semibold flex items-center gap-2 mb-3"><Activity className="h-4 w-4 text-primary" /> 近 7 日告警趋势</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyAlertTrend} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="提示" stackId="a" fill="hsl(var(--info))" radius={[0, 0, 0, 0]} />
                <Bar dataKey="警告" stackId="a" fill="hsl(var(--warning))" radius={[0, 0, 0, 0]} />
                <Bar dataKey="严重" stackId="a" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 主机健康列表 */}
        <div className="panel p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2"><Server className="h-4 w-4 text-primary" /> 主机健康状态</h3>
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link to="/inspection">全部主机 <ArrowUpRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
          <div className="space-y-2">
            {hosts.slice(0, 6).map((h) => (
              <div key={h.id} className="flex items-center gap-3 rounded-lg border bg-card/50 px-3 py-2.5 hover:bg-secondary/40 transition-colors">
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{h.name}</span>
                    <span className="text-xs text-muted-foreground">{h.ip}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{h.group}</span>
                </div>
                <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
                  <Metric icon={Cpu} value={`${h.cpu}%`} alert={h.cpu > 80} />
                  <Metric icon={MemoryStick} value={`${h.memory}%`} alert={h.memory > 80} />
                  <Metric icon={HardDrive} value={`${h.disk}%`} alert={h.disk > 75} />
                  <Metric icon={Wifi} value={h.ping > 100 ? "超时" : `${h.ping}ms`} alert={h.ping > 100} />
                </div>
                <StatusBadge tone={statusTone(h.status)} dot>{h.status}</StatusBadge>
              </div>
            ))}
          </div>
        </div>

        {/* 最近异常 + 最新报告 */}
        <div className="space-y-4">
          <div className="panel p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-3"><AlertTriangle className="h-4 w-4 text-destructive" /> 最近异常</h3>
            <div className="space-y-2.5">
              {alerts.slice(0, 3).map((a) => (
                <div key={a.id} className="rounded-lg border-l-2 border-destructive bg-destructive-soft/40 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate">{a.host} · {a.metric}</span>
                    <StatusBadge tone={statusTone(a.severity)}>{a.severity}</StatusBadge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{a.time}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="panel p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-3"><FileText className="h-4 w-4 text-primary" /> 最新报告</h3>
            <div className="space-y-2">
              {reports.slice(0, 3).map((r) => (
                <Link key={r.id} to="/reports" className="block rounded-lg border bg-card/50 px-3 py-2 hover:border-primary/40 hover:bg-primary-soft/30 transition">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate">{r.title}</span>
                    <StatusBadge tone="info">{r.frequency}</StatusBadge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{r.generatedAt}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, value, alert }: { icon: any; value: string; alert?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 tabular-nums ${alert ? "text-destructive font-medium" : ""}`}>
      <Icon className="h-3 w-3" />
      {value}
    </span>
  );
}
