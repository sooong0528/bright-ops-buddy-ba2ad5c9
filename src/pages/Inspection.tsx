import { useState } from "react";
import {
  PlayCircle,
  Calendar,
  Cpu,
  MemoryStick,
  HardDrive,
  Wifi,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Filter,
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
import { Progress } from "@/components/ui/progress";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { hosts, inspectionTasks, alerts } from "@/lib/mockData";

export default function Inspection() {
  const [selected, setSelected] = useState(hosts[2]);

  return (
    <div className="space-y-6">
      {/* 顶部操作 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
          <SummaryTile icon={CheckCircle2} label="正常" value="23" tone="success" />
          <SummaryTile icon={AlertCircle} label="关注" value="7" tone="warning" />
          <SummaryTile icon={AlertTriangle} label="异常" value="3" tone="destructive" />
          <SummaryTile icon={Calendar} label="今日任务" value="5" tone="info" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><RefreshCw className="h-4 w-4 mr-2" />刷新</Button>
          <Button className="bg-primary"><PlayCircle className="h-4 w-4 mr-2" />立即巡检</Button>
        </div>
      </div>

      {/* 巡检任务 */}
      <div className="panel">
        <div className="flex items-center justify-between p-5 pb-3">
          <div>
            <h3 className="font-semibold">巡检任务</h3>
            <p className="text-xs text-muted-foreground mt-0.5">由指挥调度 Agent 编排，巡检分析 Agent 执行</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm"><Filter className="h-4 w-4 mr-1" />筛选</Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>任务名称</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>调度</TableHead>
              <TableHead>最近执行</TableHead>
              <TableHead className="text-right">结果分布</TableHead>
              <TableHead>状态</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inspectionTasks.map((t) => (
              <TableRow key={t.id} className="hover:bg-secondary/40">
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell><StatusBadge tone="info">{t.type}</StatusBadge></TableCell>
                <TableCell className="text-sm text-muted-foreground">{t.schedule}</TableCell>
                <TableCell className="text-sm tabular-nums text-muted-foreground">{t.lastRun}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-3 text-xs tabular-nums">
                    <span className="text-success">正常 {t.normal}</span>
                    <span className="text-warning">关注 {t.attention}</span>
                    <span className="text-destructive">异常 {t.abnormal}</span>
                  </div>
                </TableCell>
                <TableCell><StatusBadge tone={statusTone(t.status)} dot={t.status === "运行中"}>{t.status}</StatusBadge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 主机列表 */}
        <div className="panel p-4 lg:col-span-1">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="font-semibold text-sm">主机清单</h3>
            <span className="text-xs text-muted-foreground">{hosts.length} 台</span>
          </div>
          <Input placeholder="搜索主机名 / IP" className="mb-3 h-9" />
          <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
            {hosts.map((h) => (
              <button
                key={h.id}
                onClick={() => setSelected(h)}
                className={`w-full text-left rounded-lg border px-3 py-2.5 transition-all ${
                  selected.id === h.id
                    ? "border-primary bg-primary-soft/60 shadow-elev-sm"
                    : "bg-card hover:bg-secondary/50 hover:border-border"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate">{h.name}</span>
                  <StatusBadge tone={statusTone(h.status)} dot>{h.status}</StatusBadge>
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px] text-muted-foreground">
                  <span>{h.ip}</span>
                  <span>{h.group}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 主机详情 */}
        <div className="panel p-5 lg:col-span-2 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{selected.name}</h3>
                <StatusBadge tone={statusTone(selected.status)} dot>{selected.status}</StatusBadge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {selected.ip} · {selected.group} · 运行时长 {selected.uptime}
              </p>
            </div>
            <Button variant="outline" size="sm">查看 Zabbix 原始数据</Button>
          </div>

          <Tabs defaultValue="metrics">
            <TabsList>
              <TabsTrigger value="metrics">指标巡检</TabsTrigger>
              <TabsTrigger value="alerts">关注项</TabsTrigger>
              <TabsTrigger value="history">历史巡检</TabsTrigger>
            </TabsList>

            <TabsContent value="metrics" className="space-y-3 mt-4">
              <MetricRow icon={Cpu} label="CPU 使用率" value={selected.cpu} threshold={85} desc="阈值：>85% 持续 10 分钟" />
              <MetricRow icon={MemoryStick} label="内存使用率" value={selected.memory} threshold={80} desc="阈值：>80% 持续 30 分钟" />
              <MetricRow icon={HardDrive} label="磁盘使用率" value={selected.disk} threshold={75} desc="阈值：>75% 触发关注，>90% 严重" />
              <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${selected.ping > 100 ? "bg-destructive-soft text-destructive" : "bg-success-soft text-success"}`}>
                  <Wifi className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Ping / ICMP</span>
                    <span className={`text-sm tabular-nums font-medium ${selected.ping > 100 ? "text-destructive" : "text-success"}`}>
                      {selected.ping > 100 ? "超时" : `${selected.ping} ms`}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">阈值：连续 3 次失败触发严重</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="alerts" className="mt-4 space-y-3">
              {alerts.filter((a) => a.host === selected.name).length === 0 ? (
                <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                  当前无关注项 ✓
                </div>
              ) : (
                alerts.filter((a) => a.host === selected.name).map((a) => (
                  <div key={a.id} className="rounded-lg border-l-2 border-destructive bg-destructive-soft/40 p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-semibold">{a.metric} · {a.value}</span>
                      <StatusBadge tone={statusTone(a.severity)}>{a.severity}</StatusBadge>
                    </div>
                    <p className="text-xs text-foreground/80">{a.description}</p>
                    <div className="mt-2 rounded-md bg-card border p-2.5">
                      <p className="text-[11px] font-medium text-muted-foreground mb-1">知识问答 Agent 建议</p>
                      <p className="text-xs text-foreground/90 whitespace-pre-line">{a.suggestion}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">{a.time} · 阈值规则：{a.threshold}</p>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <div className="space-y-2">
                {["2025-04-22 08:00", "2025-04-21 08:00", "2025-04-20 08:00", "2025-04-19 08:00"].map((t, i) => (
                  <div key={t} className="flex items-center justify-between rounded-lg border bg-card px-3 py-2.5">
                    <div>
                      <span className="text-sm font-medium">日常巡检 #{1024 - i}</span>
                      <p className="text-[11px] text-muted-foreground">{t}</p>
                    </div>
                    <StatusBadge tone={i === 0 ? statusTone(selected.status) : "success"}>
                      {i === 0 ? selected.status : "正常"}
                    </StatusBadge>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function SummaryTile({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: "success" | "warning" | "destructive" | "info" }) {
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
      <div>
        <div className="text-2xl font-semibold tabular-nums leading-none">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </div>
    </div>
  );
}

function MetricRow({ icon: Icon, label, value, threshold, desc }: { icon: any; label: string; value: number; threshold: number; desc: string }) {
  const danger = value > threshold;
  const warn = !danger && value > threshold * 0.85;
  const tone = danger ? "destructive" : warn ? "warning" : "success";
  const colorMap: Record<string, string> = {
    destructive: "bg-destructive-soft text-destructive",
    warning: "bg-warning-soft text-warning",
    success: "bg-success-soft text-success",
  };
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${colorMap[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{label}</span>
            <span className={`text-sm tabular-nums font-medium ${danger ? "text-destructive" : warn ? "text-warning" : ""}`}>{value}%</span>
          </div>
          <Progress value={value} className="mt-2 h-1.5" />
          <p className="text-[11px] text-muted-foreground mt-1.5">{desc}</p>
        </div>
      </div>
    </div>
  );
}
