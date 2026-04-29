import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, AlertCircle, Eye, CheckCircle2, Info, Cpu, MemoryStick, HardDrive, Activity, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

type Metric = "CPU" | "内存" | "磁盘" | "Ping" | "其他";
type Op = ">" | ">=" | "<" | "<=" | "=" | "区间";
type Source = "Zabbix Trigger" | "智慧运维自定义";

/** 单条判定条件 —— 每个指标下可以同时配置「异常」「关注」多条 */
type Condition = {
  id: string;
  verdict: "异常" | "关注";
  source: Source;
  op: Op;
  threshold: string;     // 90% / 75%~90% / 3 次 / Problem
  duration: string;      // 10 分钟 / —
  description: string;
  enabled: boolean;
};

/** 一个指标对应一组规则 */
export type MetricRule = {
  id: string;
  metric: Metric;
  name: string;          // 自定义名称，例如「CPU 利用率判定」
  unit: string;          // %, 次, —
  conditions: Condition[];
  updatedAt: string;
};

const METRICS: Metric[] = ["CPU", "内存", "磁盘", "Ping", "其他"];
const OPS: Op[] = [">", ">=", "<", "<=", "=", "区间"];
const SOURCES: Source[] = ["Zabbix Trigger", "智慧运维自定义"];

const METRIC_ICON: Record<Metric, React.ComponentType<{ className?: string }>> = {
  CPU: Cpu, 内存: MemoryStick, 磁盘: HardDrive, Ping: Activity, 其他: Settings,
};

const initialRules: MetricRule[] = [
  {
    id: "m1", metric: "CPU", name: "CPU 利用率判定", unit: "%",
    updatedAt: "2026-04-25",
    conditions: [
      { id: "c1", verdict: "异常", source: "Zabbix Trigger", op: ">", threshold: "90%", duration: "10 分钟", description: "CPU 高于 90% 且持续 10 分钟以上，判定为异常。", enabled: true },
      { id: "c2", verdict: "关注", source: "智慧运维自定义", op: "区间", threshold: "75%~90%", duration: "—", description: "CPU 高于 75% 但未超过 90%，提示关注。", enabled: true },
    ],
  },
  {
    id: "m2", metric: "内存", name: "内存利用率判定", unit: "%",
    updatedAt: "2026-04-25",
    conditions: [
      { id: "c3", verdict: "异常", source: "Zabbix Trigger", op: ">", threshold: "90%", duration: "30 分钟", description: "内存高于 90% 且持续 30 分钟以上。", enabled: true },
      { id: "c4", verdict: "关注", source: "智慧运维自定义", op: "区间", threshold: "80%~90%", duration: "—", description: "内存高于 80% 但未超过 90%。", enabled: true },
    ],
  },
  {
    id: "m3", metric: "磁盘", name: "磁盘使用率判定", unit: "%",
    updatedAt: "2026-04-25",
    conditions: [
      { id: "c5", verdict: "异常", source: "Zabbix Trigger", op: ">", threshold: "90%", duration: "—", description: "磁盘使用率高于 90%。", enabled: true },
      { id: "c6", verdict: "关注", source: "智慧运维自定义", op: "区间", threshold: "75%~90%", duration: "—", description: "磁盘高于 75% 但未超过 90%。", enabled: true },
    ],
  },
  {
    id: "m4", metric: "Ping", name: "Ping 连通性判定", unit: "次",
    updatedAt: "2026-04-25",
    conditions: [
      { id: "c7", verdict: "异常", source: "Zabbix Trigger", op: ">=", threshold: "3 次", duration: "—", description: "Ping 连续失败次数达到 3 次。", enabled: true },
      { id: "c8", verdict: "关注", source: "智慧运维自定义", op: "=", threshold: "1 次", duration: "—", description: "Ping 偶发失败 1 次。", enabled: true },
    ],
  },
  {
    id: "m5", metric: "其他", name: "趋势与 Zabbix Problem", unit: "—",
    updatedAt: "2026-04-25",
    conditions: [
      { id: "c9", verdict: "异常", source: "Zabbix Trigger", op: "=", threshold: "Problem", duration: "—", description: "Zabbix 已产生 Problem，直接判定为异常。", enabled: true },
      { id: "c10", verdict: "关注", source: "智慧运维自定义", op: "=", threshold: "趋势异常", duration: "—", description: "近几次巡检反复接近阈值或指标短时间波动明显。", enabled: true },
    ],
  },
];

function newCondition(verdict: "异常" | "关注" = "关注"): Condition {
  return {
    id: "c" + Math.random().toString(36).slice(2, 7),
    verdict,
    source: verdict === "异常" ? "Zabbix Trigger" : "智慧运维自定义",
    op: ">", threshold: "", duration: "—", description: "", enabled: true,
  };
}
function emptyRule(): MetricRule {
  return {
    id: "",
    metric: "CPU",
    name: "",
    unit: "%",
    conditions: [newCondition("异常"), newCondition("关注")],
    updatedAt: new Date().toISOString().slice(0, 10),
  };
}

export function JudgmentRulesPanel({ createSignal = 0 }: { createSignal?: number } = {}) {
  const [rules, setRules] = useState<MetricRule[]>(initialRules);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<MetricRule | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const totalConditions = rules.reduce((s, r) => s + r.conditions.length, 0);
  const abnormalCount = rules.reduce((s, r) => s + r.conditions.filter((c) => c.verdict === "异常").length, 0);
  const attentionCount = rules.reduce((s, r) => s + r.conditions.filter((c) => c.verdict === "关注").length, 0);

  function openCreate() { setEditing(null); setEditorOpen(true); }
  function openEdit(r: MetricRule) { setEditing(r); setEditorOpen(true); }

  // 外部触发新增
  useEffect(() => {
    if (createSignal > 0) openCreate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createSignal]);

  function handleSave(data: MetricRule) {
    const today = new Date().toISOString().slice(0, 10);
    if (editing) {
      setRules((prev) => prev.map((r) => (r.id === editing.id ? { ...data, id: editing.id, updatedAt: today } : r)));
      toast.success("判定规则已更新");
    } else {
      const id = "m" + Math.random().toString(36).slice(2, 7);
      setRules((prev) => [{ ...data, id, updatedAt: today }, ...prev]);
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
  function toggleCondition(ruleId: string, condId: string) {
    setRules((prev) => prev.map((r) => r.id !== ruleId ? r : {
      ...r,
      conditions: r.conditions.map((c) => c.id === condId ? { ...c, enabled: !c.enabled } : c),
    }));
  }

  return (
    <div className="space-y-4">
      {/* 概览 */}
      <div className="grid gap-3 md:grid-cols-3">
        <SummaryCard icon={<Settings className="h-4 w-4 text-primary" />} title="监测指标" count={rules.length} desc="按监测指标组织判定规则，每个指标可配置多条条件" />
        <SummaryCard icon={<AlertCircle className="h-4 w-4 text-destructive" />} title="异常条件" count={abnormalCount} desc="优先依赖 Zabbix Trigger / Problem 触发判定" />
        <SummaryCard icon={<Eye className="h-4 w-4 text-warning" />} title="关注条件" count={attentionCount} desc="智慧运维自定义阈值或趋势规则，提示值班关注" />
      </div>

      {/* 规则卡片列表 */}
      <div className="grid gap-3">
        {rules.map((rule) => {
          const Icon = METRIC_ICON[rule.metric];
          const abn = rule.conditions.filter((c) => c.verdict === "异常");
          const att = rule.conditions.filter((c) => c.verdict === "关注");
          return (
            <div key={rule.id} className="panel">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{rule.name}</span>
                      <span className="text-xs text-muted-foreground">监测指标：{rule.metric}{rule.unit !== "—" ? ` (${rule.unit})` : ""}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      共 {rule.conditions.length} 条条件 · 异常 {abn.length} · 关注 {att.length} · 更新于 {rule.updatedAt}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(rule)}>
                    <Pencil className="h-4 w-4 mr-1" />编辑
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(rule.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
                <ConditionGroup
                  title="异常"
                  tone="destructive"
                  icon={<AlertCircle className="h-4 w-4 text-destructive" />}
                  conditions={abn}
                  onToggle={(cid) => toggleCondition(rule.id, cid)}
                />
                <ConditionGroup
                  title="关注"
                  tone="warning"
                  icon={<Eye className="h-4 w-4 text-warning" />}
                  conditions={att}
                  onToggle={(cid) => toggleCondition(rule.id, cid)}
                />
              </div>
            </div>
          );
        })}

        {rules.length === 0 && (
          <div className="panel p-12 text-center text-sm text-muted-foreground">暂无判定规则</div>
        )}
      </div>

      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>判定优先级：<span className="text-destructive font-medium">异常</span> &gt; <span className="text-warning font-medium">关注</span> &gt; <span className="text-success font-medium">正常</span>。同一指标命中多条条件时，按高优先级判定；未命中任何条件即为正常。</span>
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
            <AlertDialogTitle>删除该指标规则？</AlertDialogTitle>
            <AlertDialogDescription>删除后该监测指标下的所有判定条件将一并移除，此操作不可撤销。</AlertDialogDescription>
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

function SummaryCard({ icon, title, count, desc }: { icon: React.ReactNode; title: string; count: number; desc: string }) {
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

function ConditionGroup({
  title, tone, icon, conditions, onToggle,
}: {
  title: string;
  tone: "destructive" | "warning";
  icon: React.ReactNode;
  conditions: Condition[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-sm font-medium">{title}条件</span>
        <span className="text-xs text-muted-foreground">（{conditions.length} 条）</span>
      </div>
      {conditions.length === 0 ? (
        <div className="text-xs text-muted-foreground py-3">未配置{title}条件</div>
      ) : (
        <ul className="space-y-2.5">
          {conditions.map((c) => (
            <li key={c.id} className="rounded-md border bg-secondary/30 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge tone={tone} dot={tone === "destructive"}>{c.verdict}</StatusBadge>
                    <span className="text-sm font-medium tabular-nums">
                      {c.op === "区间" ? c.threshold : `${c.op} ${c.threshold}`}
                    </span>
                    {c.duration && c.duration !== "—" && (
                      <span className="text-xs text-muted-foreground">持续 {c.duration}</span>
                    )}
                    <span className="text-xs text-muted-foreground">· {c.source}</span>
                  </div>
                  {c.description && (
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{c.description}</p>
                  )}
                </div>
                <Switch checked={c.enabled} onCheckedChange={() => onToggle(c.id)} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RuleEditorDialog({
  open, onOpenChange, rule, onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  rule: MetricRule | null;
  onSave: (data: MetricRule) => void;
}) {
  const [form, setForm] = useState<MetricRule>(emptyRule());

  useEffect(() => {
    if (open) setForm(rule ? JSON.parse(JSON.stringify(rule)) : emptyRule());
  }, [open, rule]);

  function updateCond(id: string, patch: Partial<Condition>) {
    setForm((f) => ({ ...f, conditions: f.conditions.map((c) => c.id === id ? { ...c, ...patch } : c) }));
  }
  function addCond(verdict: "异常" | "关注") {
    setForm((f) => ({ ...f, conditions: [...f.conditions, newCondition(verdict)] }));
  }
  function removeCond(id: string) {
    setForm((f) => ({ ...f, conditions: f.conditions.filter((c) => c.id !== id) }));
  }

  function submit() {
    if (!form.name.trim()) { toast.error("请填写规则名称"); return; }
    if (form.conditions.length === 0) { toast.error("至少配置一条判定条件"); return; }
    for (const c of form.conditions) {
      if (!c.threshold.trim()) { toast.error("请填写所有条件的阈值"); return; }
    }
    onSave(form);
  }

  const abn = form.conditions.filter((c) => c.verdict === "异常");
  const att = form.conditions.filter((c) => c.verdict === "关注");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rule ? "编辑指标判定规则" : "新增指标判定规则"}</DialogTitle>
          <DialogDescription>
            按监测指标组织：先选择指标，再为该指标配置「异常」「关注」多条判定条件。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>监测指标</Label>
              <Select value={form.metric} onValueChange={(v) => setForm({ ...form, metric: v as Metric })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METRICS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>单位</Label>
              <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="如 %、次、—" />
            </div>
            <div className="space-y-1.5 col-span-1">
              <Label><span className="text-destructive mr-0.5">*</span>规则名称</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="如 CPU 利用率判定" />
            </div>
          </div>

          <ConditionEditor
            title="异常条件"
            tone="destructive"
            conditions={abn}
            onAdd={() => addCond("异常")}
            onRemove={removeCond}
            onUpdate={updateCond}
          />
          <ConditionEditor
            title="关注条件"
            tone="warning"
            conditions={att}
            onAdd={() => addCond("关注")}
            onRemove={removeCond}
            onUpdate={updateCond}
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>取消</Button>
          <Button className="bg-primary" onClick={submit}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConditionEditor({
  title, tone, conditions, onAdd, onRemove, onUpdate,
}: {
  title: string;
  tone: "destructive" | "warning";
  conditions: Condition[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Condition>) => void;
}) {
  return (
    <div className="rounded-md border">
      <div className="flex items-center justify-between p-3 border-b bg-secondary/40">
        <div className="flex items-center gap-2">
          {tone === "destructive" ? <AlertCircle className="h-4 w-4 text-destructive" /> : <Eye className="h-4 w-4 text-warning" />}
          <span className="text-sm font-medium">{title}</span>
          <span className="text-xs text-muted-foreground">（{conditions.length} 条）</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onAdd}>
          <Plus className="h-3.5 w-3.5 mr-1" />添加条件
        </Button>
      </div>
      <div className="p-3 space-y-3">
        {conditions.length === 0 && (
          <div className="text-xs text-muted-foreground py-2 text-center">暂无{title}，点击右上角添加</div>
        )}
        {conditions.map((c) => (
          <div key={c.id} className="rounded-md border p-3 space-y-2.5">
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-3 space-y-1">
                <Label className="text-xs">来源</Label>
                <Select value={c.source} onValueChange={(v) => onUpdate(c.id, { source: v as Source })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">比较</Label>
                <Select value={c.op} onValueChange={(v) => onUpdate(c.id, { op: v as Op })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {OPS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-3 space-y-1">
                <Label className="text-xs">阈值</Label>
                <Input className="h-9" value={c.threshold} onChange={(e) => onUpdate(c.id, { threshold: e.target.value })} placeholder="90% 或 75%~90%" />
              </div>
              <div className="col-span-3 space-y-1">
                <Label className="text-xs">持续时间</Label>
                <Input className="h-9" value={c.duration} onChange={(e) => onUpdate(c.id, { duration: e.target.value })} placeholder="10 分钟 / —" />
              </div>
              <div className="col-span-1 flex items-end justify-end">
                <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => onRemove(c.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Textarea
              rows={2}
              value={c.description}
              onChange={(e) => onUpdate(c.id, { description: e.target.value })}
              placeholder="条件说明（可选）"
            />
            <div className="flex items-center gap-2">
              <Switch checked={c.enabled} onCheckedChange={(v) => onUpdate(c.id, { enabled: v })} />
              <Label className="text-xs">启用此条件</Label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
