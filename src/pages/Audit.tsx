import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Download, ScrollText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { auditLogs } from "@/lib/mockData";
import { toast } from "@/hooks/use-toast";

export default function Audit() {
  const [searchParams] = useSearchParams();
  const [q, setQ] = useState("");
  const traceFromUrl = searchParams.get("trace") ?? "";

  useEffect(() => {
    if (traceFromUrl) setQ(traceFromUrl);
  }, [traceFromUrl]);

  const list = auditLogs.filter((l) => q === "" || [l.user, l.action, l.target, l.traceId, l.agentName, l.objectId].some((item) => item?.includes(q)));
  const activeTrace = useMemo(() => {
    if (traceFromUrl) return traceFromUrl;
    if (q.startsWith("TRACE-")) return q;
    return "";
  }, [q, traceFromUrl]);
  const traceLogs = activeTrace ? auditLogs.filter((item) => item.traceId === activeTrace) : [];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Tile label="今日操作" value={String(auditLogs.filter((item) => item.time.startsWith("2026-06-26")).length)} />
        <Tile label="智能服务调用" value={String(auditLogs.filter((item) => item.agentName).length)} />
        <Tile label="用户操作" value={String(auditLogs.filter((item) => item.user !== "系统").length)} />
        <Tile label="降级记录" value={String(auditLogs.filter((item) => item.degradation && item.degradation !== "无降级").length)} tone="warning" />
      </div>

      <div className="panel">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary-soft flex items-center justify-center">
              <ScrollText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">审计留痕</h3>
            <p className="text-xs text-muted-foreground">记录任务、智能服务调用、问答、报告、知识维护和用户操作</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜索用户 / 操作 / 对象 / Trace" value={q} onChange={(e) => setQ(e.target.value)} className="w-64 pl-8 h-9" />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast({ title: "已提交导出请求", description: "当前为前端演示反馈，暂不生成真实文件。" })}
            >
              <Download className="h-4 w-4 mr-1" />导出
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-44">时间</TableHead>
              <TableHead>用户</TableHead>
              <TableHead>操作</TableHead>
              <TableHead>对象</TableHead>
              <TableHead>服务 / Trace</TableHead>
              <TableHead>结果</TableHead>
              <TableHead>来源 IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((l) => (
              <TableRow key={l.id} className="hover:bg-secondary/40">
                <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">{l.time}</TableCell>
                <TableCell>
                  <span className={`text-sm font-medium ${l.user === "系统" ? "text-info" : ""}`}>{l.user}</span>
                </TableCell>
                <TableCell><StatusBadge tone="info">{l.action}</StatusBadge></TableCell>
                <TableCell className="text-sm">
                  <div>{l.target}</div>
                  {l.objectType && <div className="text-xs text-muted-foreground mt-0.5">{l.objectType} · {l.objectId}</div>}
                </TableCell>
                <TableCell>
                  {l.traceId ? (
                    <div className="space-y-0.5">
                      <div className="text-xs font-medium">{l.agentName ?? "—"}</div>
                      <div className="text-xs font-mono text-muted-foreground">{l.traceId}</div>
                      {l.degradation && l.degradation !== "无降级" && (
                        <StatusBadge tone="warning">{l.degradation}</StatusBadge>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell><StatusBadge tone={statusTone(l.result)} dot={l.result === "失败"}>{l.result}</StatusBadge></TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{l.ip}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between px-5 py-3 border-t bg-muted/20">
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            日志保留 90 天 · 全过程不可修改 · 支持后续问题复盘与审计检查
          </p>
          <p className="text-xs text-muted-foreground tabular-nums">共 {list.length} 条</p>
        </div>
      </div>

      {activeTrace && (
        <div className="panel p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold">Trace 审计详情</h3>
              <p className="text-xs text-muted-foreground mt-1 font-mono">{activeTrace}</p>
            </div>
            <StatusBadge tone="info">共 {traceLogs.length} 条留痕</StatusBadge>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {traceLogs.map((item) => (
              <div key={item.id} className="rounded-lg border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{item.action}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.time} · {item.user}</p>
                  </div>
                  <StatusBadge tone={statusTone(item.result)}>{item.result}</StatusBadge>
                </div>
                <div className="space-y-2 text-xs leading-relaxed">
                  <InfoLine label="对象" value={`${item.objectType ?? "—"} · ${item.objectId ?? item.target}`} />
                  <InfoLine label="服务" value={item.agentName ?? "用户操作"} />
                  <InfoLine label="输入摘要" value={item.inputSummary ?? "—"} />
                  <InfoLine label="输出摘要" value={item.outputSummary ?? "—"} />
                  <InfoLine label="数据来源" value={item.dataSource ?? "—"} />
                  <InfoLine label="降级信息" value={item.degradation ?? "无降级"} highlight={!!item.degradation && item.degradation !== "无降级"} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: "destructive" | "warning" }) {
  return (
    <div className="stat-card">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p className={`text-3xl font-semibold tabular-nums mt-1 ${tone === "destructive" ? "text-destructive" : tone === "warning" ? "text-warning" : ""}`}>{value}</p>
    </div>
  );
}

function InfoLine({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className={`mt-0.5 ${highlight ? "text-warning font-medium" : "text-foreground/85"}`}>{value}</p>
    </div>
  );
}
