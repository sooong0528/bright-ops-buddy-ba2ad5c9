import { useState } from "react";
import { Plus, Pencil, Trash2, AlertCircle, Eye, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";

type Verdict = "异常" | "关注" | "正常";
type Source = "Zabbix Trigger" | "智慧运维自定义";
type Op = ">" | ">=" | "<" | "<=" | "=";
type Metric = "CPU" | "内存" | "磁盘" | "Ping" | "其他";

export type JudgmentRule = {
  id: string;
  name: string;
  verdict: Verdict;
  source: Source;
  metric: Metric;
  op: Op;
  threshold: string;       // 例如 "90%" 或 "3 次"
  duration: string;        // 例如 "10 分钟" / "—"
  description: string;
  enabled: boolean;
  updatedAt: string;
};

const initialRules: JudgmentRule[] = [
  { id: "r1", name: "Zabbix Problem 触发", verdict: "异常", source: "Zabbix Trigger", metric: "其他", op: "=", threshold: "Problem", duration: "—", description: "Zabbix 已产生 Problem，直接判定为异常。", enabled: true, updatedAt: "2026-04-20" },
  { id: "r2", name: "CPU 超 90% 持续 10 分钟", verdict: "异常", source: "Zabbix Trigger", metric: "CPU", op: ">", threshold: "90%", duration: "10 分钟", description: "CPU 利用率高于 90% 且持续 10 分钟以上。", enabled: true, updatedAt: "2026-04-20" },
  { id: "r3", name: "内存超 90% 持续 30 分钟", verdict: "异常", source: "Zabbix Trigger", metric: "内存", op: ">", threshold: "90%", duration: "30 分钟", description: "内存利用率高于 90% 且持续 30 分钟以上。", enabled: true, updatedAt: "2026-04-20" },
  { id: "r4", name: "磁盘超 90%", verdict: "异常", source: "Zabbix Trigger", metric: "磁盘", op: ">", threshold: "90%", duration: "—", description: "磁盘使用率高于 90%。", enabled: true, updatedAt: "2026-04-20" },
  { id: "r5", name: "Ping 连续失败 3 次", verdict: "异常", source: "Zabbix Trigger", metric: "Ping", op: ">=", threshold: "3 次", duration: "—", description: "Ping 连续失败次数达到 3 次。", enabled: true, updatedAt: "2026-04-20" },

  { id: "r6", name: "CPU 介于 75%~90%", verdict: "关注", source: "智慧运维自定义", metric: "CPU", op: ">", threshold: "75%", duration: "—", description: "CPU 高于 75% 但未超过 90%，需关注趋势。", enabled: true, updatedAt: "2026-04-22" },
  { id: "r7", name: "内存介于 80%~90%", verdict: "关注", source: "智慧运维自定义", metric: "内存", op: ">", threshold: "80%", duration: "—", description: "内存高于 80% 但未超过 90%。", enabled: true, updatedAt: "2026-04-22" },
  { id: "r8", name: "磁盘介于 75%~90%", verdict: "关注", source: "智慧运维自定义", metric: "磁盘", op: ">", threshold: "75%", duration: "—", description: "磁盘高于 75% 但未超过 90%。", enabled: true, updatedAt: "2026-04-22" },
  { id: "r9", name: "Ping 偶发失败 1 次", verdict: "关注", source: "智慧运维自定义", metric: "Ping", op: "=", threshold: "1 次", duration: "—", description: "Ping 偶发失败 1 次。", enabled: true, updatedAt: "2026-04-22" },
  { id: "r10", name: "近几次巡检反复接近阈值", verdict: "关注", source: "智慧运维自定义", metric: "其他", op: "=", threshold: "趋势异常", duration: "—", description: "某设备近几次巡检反复接近阈值或指标短时间内波动明显。", enabled: true, updatedAt: "2026-04-22" },
];

const VERDICTS: Verdict[] = ["异常", "关注", "正常"];
const SOURCES: Source[] = ["Zabbix Trigger", "智慧运维自定义"];
const METRICS: Metric[] = ["CPU", "内存", "磁盘", "Ping", "其他"];
const OPS: Op[] = [">", ">=", "<", "<=", "="];

function verdictTone(v: Verdict) {
  if (v === "异常") return "destructive" as const;
  if (v === "关注") return "warning" as const;
  return "success" as const;
}

function emptyRule(): JudgmentRule {
  return {
    id: "", name: "", verdict: "关注", source: "智慧运维自定义",
    metric: "CPU", op: ">", threshold: "", duration: "—",
    description: "", enabled: true, updatedAt: new Date().toISOString().slice(0, 10),
  };
}

export function JudgmentRulesPanel() {
  const [rules, setRules] = useState<JudgmentRule[]>(initialRules);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<JudgmentRule | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"全部" | Verdict>("全部");

  const filtered = filter === "全部" ? rules : rules.filter((r) => r.verdict === filter);

  function openCreate() { setEditing(null); setEditorOpen(true); }
  function openEdit(r: JudgmentRule) { setEditing(r); setEditorOpen(true); }

  function handleSave(data: JudgmentRule) {
    if (editing) {
      setRules((prev) => prev.map((r) => (r.id === editing.id ? { ...data, id: editing.id, updatedAt: new Date().toISOString().slice(0, 10) } : r)));
      toast.success("判定规则已更新");
    } else {
      const id = "r" + Math.random().toString(36).slice(2, 7);
      setRules((prev) => [{ ...data, id, updatedAt: new Date().toISOString().slice(0, 10) }, ...prev]);
      toast.success("判定规则已创建");
    }
    setEditorOpen(false);
  }
  function handleDelete() {
    if (!deleteId) return;
    setRules((prev) => prev.filter((r) => r.id !== deleteId));
    toast.success("判定规则已删除");
    setDeleteId(null);
  }
  function toggleEnabled(r: JudgmentRule) {
    setRules((prev) => prev.map((x) => (x.id === r.id ? { ...x, enabled: !x.enabled } : x)));
  }

  const stats = {
    abnormal: rules.filter((r) => r.verdict === "异常").length,
    attention: rules.filter((r) => r.verdict === "关注").length,
    normal: rules.filter((r) => r.verdict === "正常").length,
  };

  return (
    <div className="space-y-4">
      {/* 说明卡 */}
      <div className="grid gap-3 md:grid-cols-3">
        <RuleSummaryCard
          icon={<AlertCircle className="h-4 w-4 text-destructive" />}
          title="异常"
          count={stats.abnormal}
          desc="优先使用 Zabbix Trigger / Problem 判断，命中即判异常"
        />
        <RuleSummaryCard
          icon={<Eye className="h-4 w-4 text-warning" />}
          title="关注"
          count={stats.attention}
          desc="智慧运维自定义阈值或趋势规则，提示值班关注"
        />
        <RuleSummaryCard
          icon={<CheckCircle2 className="h-4 w-4 text-success" />}
          title="正常"
          count={stats.normal}
          desc="未触发关注或异常规则时，判定为正常"
        />
      </div>

      <div className="panel">
        <div className="flex items-center justify-between p-5 pb-3 gap-3 flex-wrap">
          <div>
            <h3 className="font-semibold">巡检判定规则</h3>
            <p className="text-xs text-muted-foreground mt-0.5">用于将巡检指标与告警判定为「异常 / 关注 / 正常」三种结果</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
              <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="全部">全部判定</SelectItem>
                <SelectItem value="异常">仅异常</SelectItem>
                <SelectItem value="关注">仅关注</SelectItem>
                <SelectItem value="正常">仅正常</SelectItem>
              </SelectContent>
            </Select>
            <Button className="bg-primary" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" />新增规则
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>规则名称</TableHead>
              <TableHead>判定</TableHead>
              <TableHead>来源</TableHead>
              <TableHead>指标</TableHead>
              <TableHead>条件</TableHead>
              <TableHead>持续时间</TableHead>
              <TableHead>启用</TableHead>
              <TableHead>更新时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id} className="hover:bg-secondary/40">
                <TableCell>
                  <div className="font-medium">{r.name}</div>
                  {r.description && (
                    <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-md" title={r.description}>
                      {r.description}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge tone={verdictTone(r.verdict)} dot={r.verdict === "异常"}>{r.verdict}</StatusBadge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.source}</TableCell>
                <TableCell className="text-sm">{r.metric}</TableCell>
                <TableCell className="text-sm tabular-nums">
                  {r.metric === "其他" ? r.threshold : `${r.op} ${r.threshold}`}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.duration}</TableCell>
                <TableCell>
                  <Switch checked={r.enabled} onCheckedChange={() => toggleEnabled(r)} />
                </TableCell>
                <TableCell className="text-sm tabular-nums text-muted-foreground">{r.updatedAt}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>
                      <Pencil className="h-4 w-4 mr-1" />编辑
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(r.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-8">暂无规则</TableCell></TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex items-start gap-2 p-4 text-xs text-muted-foreground border-t">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>判定优先级：<span className="text-destructive font-medium">异常</span> &gt; <span className="text-warning font-medium">关注</span> &gt; <span className="text-success font-medium">正常</span>。同一指标命中多条规则时，按高优先级判定。</span>
        </div>
      </div>

      <RuleEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        rule={editing}
        onSave={handleSave}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除该判定规则？</AlertDialogTitle>
            <AlertDialogDescription>删除后将不再用于巡检结果判定，此操作不可撤销。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function RuleSummaryCard({ icon, title, count, desc }: { icon: React.ReactNode; title: string; count: number; desc: string }) {
  return (
    <div className="panel p-4">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-medium">{title}</span>
        <span className="ml-auto text-2xl font-semibold tabular-nums">{count}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{desc}</p>
    </div>
  );
}

function RuleEditorDialog({
  open, onOpenChange, rule, onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  rule: JudgmentRule | null;
  onSave: (data: JudgmentRule) => void;
}) {
  const [form, setForm] = useState<JudgmentRule>(emptyRule());

  // reset on open
  useState(() => {});
  if (open && form.id !== (rule?.id ?? "")) {
    // sync when opening
    setTimeout(() => setForm(rule ? { ...rule } : emptyRule()), 0);
  }

  function submit() {
    if (!form.name.trim()) { toast.error("请填写规则名称"); return; }
    if (form.metric !== "其他" && !form.threshold.trim()) { toast.error("请填写阈值"); return; }
    onSave(form);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{rule ? "编辑判定规则" : "新增判定规则"}</DialogTitle>
          <DialogDescription>
            定义将巡检指标判定为「异常 / 关注 / 正常」的条件。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label><span className="text-destructive mr-0.5">*</span>规则名称</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="例如：CPU 超 90% 持续 10 分钟" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>判定结果</Label>
              <Select value={form.verdict} onValueChange={(v) => setForm({ ...form, verdict: v as Verdict })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VERDICTS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>判定来源</Label>
              <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v as Source })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>指标</Label>
              <Select value={form.metric} onValueChange={(v) => setForm({ ...form, metric: v as Metric })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METRICS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>比较</Label>
              <Select value={form.op} onValueChange={(v) => setForm({ ...form, op: v as Op })} disabled={form.metric === "其他"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OPS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label><span className="text-destructive mr-0.5">*</span>阈值</Label>
              <Input value={form.threshold} onChange={(e) => setForm({ ...form, threshold: e.target.value })} placeholder="如 90% 或 3 次" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>持续时间</Label>
            <Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="如 10 分钟，无要求填 —" />
          </div>

          <div className="space-y-1.5">
            <Label>规则说明</Label>
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="简要说明该规则的含义与适用场景" />
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={form.enabled} onCheckedChange={(v) => setForm({ ...form, enabled: v })} />
            <Label>启用此规则</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>取消</Button>
          <Button className="bg-primary" onClick={submit}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
