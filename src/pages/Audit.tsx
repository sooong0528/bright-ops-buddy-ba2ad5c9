import { useState } from "react";
import { Search, Download, ScrollText, Filter, ShieldCheck } from "lucide-react";
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

const CATEGORIES = ["全部", "用户操作", "任务执行", "Agent 调用", "数据来源"] as const;
type Cat = typeof CATEGORIES[number];

const catTone: Record<string, "info" | "warning" | "success" | "destructive"> = {
  "用户操作": "info",
  "任务执行": "success",
  "Agent 调用": "warning",
  "数据来源": "info",
};

export default function Audit() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Cat>("全部");
  const list = auditLogs.filter((l) => {
    const matchQ = q === "" || l.user.includes(q) || l.action.includes(q) || l.target.includes(q);
    const matchC = cat === "全部" || l.category === cat;
    return matchQ && matchC;
  });

  const counts = CATEGORIES.reduce((acc, c) => {
    acc[c] = c === "全部" ? auditLogs.length : auditLogs.filter((l) => l.category === c).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Tile label="用户操作" value={String(counts["用户操作"])} />
        <Tile label="任务执行" value={String(counts["任务执行"])} />
        <Tile label="Agent 调用" value={String(counts["Agent 调用"])} />
        <Tile label="失败操作" value={String(auditLogs.filter((l) => l.result === "失败").length)} tone="destructive" />
      </div>

      <div className="panel">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary-soft flex items-center justify-center">
              <ScrollText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">审计留痕</h3>
              <p className="text-xs text-muted-foreground">用户操作 · 任务执行 · Agent 调用 · 数据来源 全过程留痕</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜索用户 / 操作 / 对象" value={q} onChange={(e) => setQ(e.target.value)} className="w-64 pl-8 h-9" />
            </div>
            <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-1" />高级筛选</Button>
            <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" />导出</Button>
          </div>
        </div>

        <div className="px-5 pb-3 flex gap-1.5 flex-wrap">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCat(c)}
              className={`text-xs px-2.5 py-1 rounded-full border transition ${
                cat === c ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-secondary"
              }`}>
              {c} <span className="opacity-70 tabular-nums ml-1">{counts[c]}</span>
            </button>
          ))}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-44">时间</TableHead>
              <TableHead className="w-24">类别</TableHead>
              <TableHead>用户</TableHead>
              <TableHead>操作</TableHead>
              <TableHead>对象</TableHead>
              <TableHead>结果</TableHead>
              <TableHead>来源 IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((l) => (
              <TableRow key={l.id} className="hover:bg-secondary/40">
                <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">{l.time}</TableCell>
                <TableCell><StatusBadge tone={catTone[l.category] || "info"}>{l.category}</StatusBadge></TableCell>
                <TableCell>
                  <span className={`text-sm font-medium ${l.user === "系统" ? "text-info" : ""}`}>{l.user}</span>
                </TableCell>
                <TableCell className="text-sm">{l.action}</TableCell>
                <TableCell className="text-sm">{l.target}</TableCell>
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
    </div>
  );
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: "destructive" }) {
  return (
    <div className="stat-card">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p className={`text-3xl font-semibold tabular-nums mt-1 ${tone === "destructive" ? "text-destructive" : ""}`}>{value}</p>
    </div>
  );
}
