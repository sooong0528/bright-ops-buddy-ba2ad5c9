import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlayCircle,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Power,
  PowerOff,
  History,
  ListChecks,
  Clock,
  User as UserIcon,
  Calendar,
  Sparkles,
  Wand2,
  Loader2,
  GitMerge,
  Lightbulb,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { JudgmentRulesPanel } from "@/components/JudgmentRulesPanel";
import {
  inspectionTasks as initialTasks,
  inspectionRuns as initialRuns,
  assets,
  type Asset,
  type AssetType,
  type InspectionTask,
  type InspectionRun,
} from "@/lib/mockData";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type ParsedTask = {
  name: string; type: string; schedule: string;
  metrics: string[]; targets: string[]; owner: string;
  description: string; reasoning: string;
};
type MergeSuggestion = {
  verdict: "merge" | "adjust" | "keep";
  summary: string;
  mergeIntoTaskId: string;
  suggestedTask: { name: string; type: string; schedule: string; metrics: string[]; targets: string[]; description: string };
  reasoning: string;
  risks: string[];
};

async function callInspectionAi(payload: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("inspection-ai", { body: payload });
  if (error) {
    const msg = (data as any)?.error || error.message || "AI 调用失败";
    throw new Error(msg);
  }
  if ((data as any)?.error) throw new Error((data as any).error);
  return (data as any).result;
}

// 每类资源的可选指标池（与 资产管理 观测项保持一致）
const metricPoolByType: Record<AssetType, string[]> = {
  主机: ["CPU", "内存", "磁盘", "Ping"],
  应用服务: ["端口", "HTTP 健康检查", "应用错误日志"],
  数据库: ["连接数", "慢查询", "锁等待", "数据库日志"],
  中间件: ["存活状态", "连接数", "队列堆积", "错误日志"],
};

export default function InspectionAdmin() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<InspectionTask[]>(initialTasks);
  const [runs, setRuns] = useState<InspectionRun[]>(initialRuns);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<InspectionTask | null>(null);
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"tasks" | "rules">("tasks");
  const [ruleCreateSignal, setRuleCreateSignal] = useState(0);


  const detailTask = tasks.find((t) => t.id === detailTaskId) || null;

  function openCreate() { setEditingTask(null); setEditorOpen(true); }
  function openEdit(t: InspectionTask) { setEditingTask(t); setEditorOpen(true); }

  function handleSave(data: InspectionTask) {
    if (editingTask) {
      setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? { ...t, ...data, id: editingTask.id } : t)));
      toast.success("巡检任务已更新");
    } else {
      const id = "t" + (Math.random().toString(36).slice(2, 7));
      setTasks((prev) => [{ ...data, id, lastRun: "—", status: "待运行", normal: 0, attention: 0, abnormal: 0, createdAt: new Date().toISOString().slice(0, 10) }, ...prev]);
      toast.success("巡检任务已创建");
    }
    setEditorOpen(false);
  }
  function handleDelete() {
    if (!deleteId) return;
    setTasks((prev) => prev.filter((t) => t.id !== deleteId));
    setRuns((prev) => prev.filter((r) => r.taskId !== deleteId));
    toast.success("巡检任务已删除");
    if (detailTaskId === deleteId) setDetailTaskId(null);
    setDeleteId(null);
  }
  function toggleEnabled(t: InspectionTask) {
    setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, enabled: !x.enabled } : x)));
    toast.success(t.enabled ? "已停用任务" : "已启用任务");
  }
  function runNow(t: InspectionTask) {
    const id = "run-" + Math.floor(Math.random() * 9000 + 1000);
    const fmt = new Date().toISOString().replace("T", " ").slice(0, 19);
    const newRun: InspectionRun = {
      id, taskId: t.id, startTime: fmt, endTime: "—", duration: "进行中",
      status: "运行中", trigger: "手动", operator: "李管理",
      normal: 0, attention: 0, abnormal: 0,
      summary: "已触发，等待巡检分析 Agent 返回结果...",
    };
    setRuns((prev) => [newRun, ...prev]);
    setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, status: "运行中", lastRun: fmt } : x)));
    toast.success(`已触发 "${t.name}"`);
  }

  function gotoRunDetail(runId: string) {
    navigate(`/inspection?run=${encodeURIComponent(runId)}`);
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "tasks" | "rules")} className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <TabsList>
            <TabsTrigger value="tasks">巡检任务</TabsTrigger>
            <TabsTrigger value="rules">巡检判定规则</TabsTrigger>
          </TabsList>
          {activeTab === "tasks" ? (
            <Button className="bg-primary" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />新建巡检任务
            </Button>
          ) : (
            <Button className="bg-primary" onClick={() => setRuleCreateSignal((v) => v + 1)}>
              <Plus className="h-4 w-4 mr-2" />新增指标规则
            </Button>
          )}
        </div>

        <TabsContent value="tasks" className="space-y-4 mt-0">
          <div className="panel">
            <div className="flex items-center justify-between p-5 pb-3">
              <div>
                <h3 className="font-semibold">巡检任务</h3>
                <p className="text-xs text-muted-foreground mt-0.5">点击任务名查看任务详情与历史执行；可跳转到具体一次巡检结果</p>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>任务名称</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>调度</TableHead>
                  <TableHead>巡检指标</TableHead>
                  <TableHead>负责人</TableHead>
                  <TableHead>最近执行</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((t) => (
                  <TableRow key={t.id} className="hover:bg-secondary/40">
                    <TableCell>
                      <button
                        className="font-medium text-left hover:text-primary transition-colors"
                        onClick={() => setDetailTaskId(t.id)}
                      >
                        {t.name}
                      </button>
                      {!t.enabled && <span className="ml-2 text-xs text-muted-foreground">(已停用)</span>}
                    </TableCell>
                    <TableCell><StatusBadge tone="info">{t.type}</StatusBadge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.schedule}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {t.metrics.map((m) => (
                          <span key={m} className="text-xs rounded bg-secondary px-1.5 py-0.5 text-muted-foreground">{m}</span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.owner}</TableCell>
                    <TableCell className="text-sm tabular-nums text-muted-foreground">{t.lastRun}</TableCell>
                    <TableCell>
                      <StatusBadge tone={statusTone(t.status)} dot={t.status === "运行中"}>{t.status}</StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => runNow(t)} disabled={!t.enabled}>
                          <PlayCircle className="h-4 w-4 mr-1" />执行
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => setDetailTaskId(t.id)}>
                              <History className="h-4 w-4 mr-2" />查看详情
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(t)}>
                              <Pencil className="h-4 w-4 mr-2" />编辑
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleEnabled(t)}>
                              {t.enabled ? <PowerOff className="h-4 w-4 mr-2" /> : <Power className="h-4 w-4 mr-2" />}
                              {t.enabled ? "停用" : "启用"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteId(t.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="rules" className="mt-0">
          <JudgmentRulesPanel createSignal={ruleCreateSignal} />
        </TabsContent>
      </Tabs>

      <TaskEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        task={editingTask}
        onSave={handleSave}
        existingTasks={tasks}
      />

      <TaskDetailSheet
        task={detailTask}
        runs={runs.filter((r) => r.taskId === detailTask?.id)}
        onClose={() => setDetailTaskId(null)}
        onEdit={(t) => { setDetailTaskId(null); openEdit(t); }}
        onRun={runNow}
        onOpenRunDetail={gotoRunDetail}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除该巡检任务？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后该任务及其全部执行历史将被移除，此操作不可撤销。
            </AlertDialogDescription>
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

/* ---------------- 任务编辑器 ---------------- */

function TaskEditorDialog({
  open, onOpenChange, task, onSave, existingTasks,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  task: InspectionTask | null;
  onSave: (data: InspectionTask) => void;
  existingTasks: InspectionTask[];
}) {
  const isEdit = !!task;
  const [form, setForm] = useState<InspectionTask>(() => emptyForm());
  const [nlOpen, setNlOpen] = useState(false);
  const [nlPrompt, setNlPrompt] = useState("");
  const [nlLoading, setNlLoading] = useState(false);
  const [nlReasoning, setNlReasoning] = useState<string>("");
  const [mergeLoading, setMergeLoading] = useState(false);
  const [mergeResult, setMergeResult] = useState<MergeSuggestion | null>(null);

  useMemo(() => {
    if (open) {
      setForm(task ? { ...task } : emptyForm());
      setNlReasoning("");
      setMergeResult(null);
    }
  }, [open, task]);

  function emptyForm(): InspectionTask {
    return {
      id: "", name: "", type: "日常巡检", schedule: "每日 08:00",
      lastRun: "—", status: "待运行", normal: 0, attention: 0, abnormal: 0,
      description: "", assetSelections: [], targets: [], metrics: [],
      enabled: true, owner: "李管理", createdAt: new Date().toISOString().slice(0, 10),
    };
  }

  // 已选资源 & 每个资源上勾选的指标（关联关系明确存储）
  const selectedAssetIds = form.assetSelections.map((s) => s.assetId);

  function toggleAsset(a: Asset) {
    setForm((f) => {
      const exists = f.assetSelections.find((s) => s.assetId === a.id);
      let next;
      if (exists) {
        next = f.assetSelections.filter((s) => s.assetId !== a.id);
      } else {
        // 默认勾选该资源类型下的全部推荐指标
        next = [...f.assetSelections, { assetId: a.id, metrics: [...metricPoolByType[a.type]] }];
      }
      return syncFlat({ ...f, assetSelections: next });
    });
  }

  function toggleAssetMetric(assetId: string, metric: string) {
    setForm((f) => {
      const next = f.assetSelections.map((s) => {
        if (s.assetId !== assetId) return s;
        const has = s.metrics.includes(metric);
        return { ...s, metrics: has ? s.metrics.filter((m) => m !== metric) : [...s.metrics, metric] };
      });
      return syncFlat({ ...f, assetSelections: next });
    });
  }

  function setAssetMetricsAll(assetId: string, checked: boolean) {
    setForm((f) => {
      const next = f.assetSelections.map((s) => {
        if (s.assetId !== assetId) return s;
        const a = assets.find((x) => x.id === assetId);
        return { ...s, metrics: checked && a ? [...metricPoolByType[a.type]] : [] };
      });
      return syncFlat({ ...f, assetSelections: next });
    });
  }

  // 同步兼容字段：targets = 资源名称，metrics = 指标去重
  function syncFlat(f: InspectionTask): InspectionTask {
    const targets = f.assetSelections
      .map((s) => assets.find((a) => a.id === s.assetId)?.name)
      .filter(Boolean) as string[];
    const metrics = Array.from(new Set(f.assetSelections.flatMap((s) => s.metrics)));
    return { ...f, targets, metrics };
  }

  async function handleNlGenerate() {
    if (!nlPrompt.trim()) { toast.error("请描述你希望的巡检规则"); return; }
    setNlLoading(true);
    try {
      const res = await callInspectionAi({ mode: "parse", prompt: nlPrompt });
      const r = res as ParsedTask;
      setForm((f) => ({
        ...f,
        name: r.name || f.name, type: (r.type as any) || f.type, schedule: r.schedule || f.schedule,
        owner: r.owner || f.owner, description: r.description || f.description,
      }));
      setNlReasoning(r.reasoning || "");
      setMergeResult(null);
      toast.success("已根据描述填充任务基础字段，请在下方选择资源与指标");
      setNlOpen(false);
    } catch (e: any) {
      toast.error(e?.message || "AI 生成失败");
    } finally { setNlLoading(false); }
  }

  async function handleMergeCheck() {
    if (!form.name.trim() || form.assetSelections.length === 0) {
      toast.error("请先完善任务名称并至少选择一个资源，再请 AI 评估");
      return;
    }
    setMergeLoading(true); setMergeResult(null);
    try {
      const draft = { name: form.name, type: form.type, schedule: form.schedule, metrics: form.metrics, targets: form.targets, description: form.description ?? "" };
      const peers = existingTasks.filter((t) => t.id !== form.id).map((t) => ({
        id: t.id, name: t.name, type: t.type, schedule: t.schedule, metrics: t.metrics, targets: t.targets, description: t.description ?? "",
      }));
      const res = await callInspectionAi({ mode: "merge", draft, existingTasks: peers });
      setMergeResult(res as MergeSuggestion);
    } catch (e: any) {
      toast.error(e?.message || "AI 评估失败");
    } finally { setMergeLoading(false); }
  }

  function applySuggestion() {
    if (!mergeResult) return;
    const s = mergeResult.suggestedTask;
    setForm((f) => ({
      ...f, name: s.name, type: s.type as any, schedule: s.schedule,
      description: s.description,
    }));
    toast.success("已应用 AI 建议（资源与指标请手工确认）");
    setMergeResult(null);
  }

  function submit() {
    if (!form.name.trim()) { toast.error("请填写任务名称"); return; }
    if (form.assetSelections.length === 0) { toast.error("请至少选择一个巡检资源"); return; }
    const emptyOne = form.assetSelections.find((s) => s.metrics.length === 0);
    if (emptyOne) {
      const a = assets.find((x) => x.id === emptyOne.assetId);
      toast.error(`请为「${a?.name ?? emptyOne.assetId}」至少选择一项指标`);
      return;
    }
    onSave(form);
  }

  const mergeTargetTask = mergeResult?.mergeIntoTaskId ? existingTasks.find((t) => t.id === mergeResult.mergeIntoTaskId) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "编辑巡检任务" : "新建巡检任务"}</DialogTitle>
          <DialogDescription>
            可手工配置，也可通过自然语言让 AI 生成草稿；保存前可让 AI 评估与现有规则的重叠情况。
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-primary/20 bg-primary-soft/30 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-medium">AI 助手</span>
              <span className="text-xs text-muted-foreground">由 Lovable AI 提供</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setNlOpen((v) => !v)}>
                <Wand2 className="h-4 w-4 mr-1" />自然语言生成
              </Button>
              <Button size="sm" variant="outline" onClick={handleMergeCheck} disabled={mergeLoading}>
                {mergeLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <GitMerge className="h-4 w-4 mr-1" />}
                评估合并建议
              </Button>
            </div>
          </div>

          {nlOpen && (
            <div className="space-y-2 pt-1">
              <Textarea rows={3} placeholder="例如：每天早上 7 点对数据库主机做一次内存和磁盘巡检，由 DBA 负责"
                value={nlPrompt} onChange={(e) => setNlPrompt(e.target.value)} />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setNlOpen(false)}>取消</Button>
                <Button size="sm" onClick={handleNlGenerate} disabled={nlLoading}>
                  {nlLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
                  生成草稿
                </Button>
              </div>
            </div>
          )}

          {nlReasoning && !nlOpen && (
            <div className="rounded-md bg-card border p-2.5 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">AI 推断说明：</span>{nlReasoning}
            </div>
          )}

          {mergeResult && (
            <MergeSuggestionCard suggestion={mergeResult} targetTask={mergeTargetTask} onApply={applySuggestion} onDismiss={() => setMergeResult(null)} />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label className="text-sm">任务名称</Label>
            <Input className="mt-1.5" placeholder="例如：核心数据库专项巡检" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>

          <div>
            <Label className="text-sm">任务类型</Label>
            <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="日常巡检">日常巡检</SelectItem>
                <SelectItem value="周巡检">周巡检</SelectItem>
                <SelectItem value="手动巡检">手动巡检</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm">调度策略</Label>
            <Input className="mt-1.5" placeholder="例如：每日 08:00 / 每 30 分钟" value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} />
          </div>

          <div className="col-span-2">
            <Label className="text-sm">巡检指标</Label>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {METRICS.map((m) => (
                <label key={m} className={`flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer text-sm ${
                  form.metrics.includes(m) ? "border-primary bg-primary-soft/40" : "bg-card hover:bg-secondary/50"
                }`}>
                  <Checkbox checked={form.metrics.includes(m)} onCheckedChange={() => toggleMetric(m)} />
                  {m}
                </label>
              ))}
            </div>
          </div>

          <div className="col-span-2">
            <Label className="text-sm">巡检目标</Label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {TARGET_GROUPS.map((g) => (
                <label key={g} className={`flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer text-sm ${
                  form.targets.includes(g) ? "border-primary bg-primary-soft/40" : "bg-card hover:bg-secondary/50"
                }`}>
                  <Checkbox checked={form.targets.includes(g)} onCheckedChange={() => toggleTarget(g)} />
                  {g}
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm">负责人</Label>
            <Input className="mt-1.5" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
          </div>
          <div className="flex items-end">
            <div className="flex items-center justify-between w-full rounded-md border bg-card px-3 h-10">
              <Label className="text-sm">启用任务</Label>
              <Switch checked={form.enabled} onCheckedChange={(v) => setForm({ ...form, enabled: v })} />
            </div>
          </div>

          <div className="col-span-2">
            <Label className="text-sm">任务描述</Label>
            <Textarea className="mt-1.5" rows={3} placeholder="说明该巡检任务的业务背景、关注点等"
              value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={submit}>{isEdit ? "保存修改" : "创建任务"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MergeSuggestionCard({
  suggestion, targetTask, onApply, onDismiss,
}: {
  suggestion: MergeSuggestion;
  targetTask: InspectionTask | null | undefined;
  onApply: () => void;
  onDismiss: () => void;
}) {
  const verdictMap: Record<string, { label: string; tone: "success" | "warning" | "destructive" | "info" }> = {
    keep: { label: "无冲突", tone: "success" },
    adjust: { label: "建议调整", tone: "warning" },
    merge: { label: "建议合并", tone: "destructive" },
  };
  const v = verdictMap[suggestion.verdict] ?? verdictMap.keep;

  return (
    <div className="rounded-md border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-warning" />
          <span className="text-sm font-semibold">AI 评估结果</span>
          <StatusBadge tone={v.tone}>{v.label}</StatusBadge>
        </div>
        <Button size="sm" variant="ghost" onClick={onDismiss}><X className="h-4 w-4" /></Button>
      </div>
      <p className="text-sm text-foreground/90">{suggestion.summary}</p>

      {suggestion.verdict === "merge" && targetTask && (
        <div className="rounded-md bg-secondary/50 px-2.5 py-2 text-xs">
          <span className="text-muted-foreground">建议合并到现有任务：</span>
          <span className="font-medium ml-1">{targetTask.name}</span>
          <span className="text-muted-foreground ml-2">({targetTask.schedule})</span>
        </div>
      )}

      {suggestion.reasoning && (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer hover:text-foreground">查看推理过程</summary>
          <p className="mt-1.5 whitespace-pre-line leading-relaxed">{suggestion.reasoning}</p>
        </details>
      )}

      {suggestion.risks?.length > 0 && (
        <div className="text-xs">
          <div className="text-muted-foreground mb-1">潜在风险</div>
          <ul className="list-disc list-inside space-y-0.5 text-foreground/80">
            {suggestion.risks.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      )}

      <div className="rounded-md border bg-background p-2.5 space-y-1">
        <div className="text-xs font-medium text-muted-foreground">建议任务字段</div>
        <div className="text-sm font-medium">{suggestion.suggestedTask.name}</div>
        <div className="text-xs text-muted-foreground">
          {suggestion.suggestedTask.type} · {suggestion.suggestedTask.schedule}
        </div>
        <div className="flex flex-wrap gap-1 pt-1">
          {suggestion.suggestedTask.metrics.map((m) => (
            <span key={m} className="text-xs rounded bg-secondary px-1.5 py-0.5">{m}</span>
          ))}
          {suggestion.suggestedTask.targets.map((t) => (
            <span key={t} className="text-xs rounded bg-primary-soft text-primary px-1.5 py-0.5">{t}</span>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button size="sm" variant="ghost" onClick={onDismiss}>忽略</Button>
        <Button size="sm" onClick={onApply}>应用建议</Button>
      </div>
    </div>
  );
}

/* ---------------- 任务详情抽屉（含历史） ---------------- */

function TaskDetailSheet({
  task, runs, onClose, onEdit, onRun, onOpenRunDetail,
}: {
  task: InspectionTask | null;
  runs: InspectionRun[];
  onClose: () => void;
  onEdit: (t: InspectionTask) => void;
  onRun: (t: InspectionTask) => void;
  onOpenRunDetail: (runId: string) => void;
}) {
  const totalRuns = runs.length;
  const successRuns = runs.filter((r) => r.status === "已完成").length;
  const failedRuns = runs.filter((r) => r.status === "失败").length;
  const successRate = totalRuns ? Math.round((successRuns / totalRuns) * 100) : 0;

  return (
    <Sheet open={!!task} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="sm:max-w-2xl w-full overflow-y-auto">
        {task && (
          <>
            <SheetHeader className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <SheetTitle className="text-lg">{task.name}</SheetTitle>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => onEdit(task)}>
                    <Pencil className="h-4 w-4 mr-1" />编辑
                  </Button>
                  <Button size="sm" onClick={() => onRun(task)} disabled={!task.enabled}>
                    <PlayCircle className="h-4 w-4 mr-1" />立即执行
                  </Button>
                </div>
              </div>
              <SheetDescription className="text-sm">{task.description || "暂无描述"}</SheetDescription>
            </SheetHeader>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <InfoTile icon={ListChecks} label="任务类型" value={task.type} />
              <InfoTile icon={Clock} label="调度" value={task.schedule} />
              <InfoTile icon={UserIcon} label="负责人" value={task.owner} />
              <InfoTile icon={Calendar} label="创建时间" value={task.createdAt} />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground">指标：</span>
              {task.metrics.map((m) => <span key={m} className="text-xs rounded bg-secondary px-2 py-0.5">{m}</span>)}
              <span className="text-xs text-muted-foreground ml-3">目标：</span>
              {task.targets.map((t) => <span key={t} className="text-xs rounded bg-secondary px-2 py-0.5">{t}</span>)}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <RunStat label="累计执行" value={totalRuns} />
              <RunStat label="成功率" value={`${successRate}%`} tone="success" />
              <RunStat label="失败次数" value={failedRuns} tone={failedRuns > 0 ? "destructive" : undefined} />
            </div>

            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <History className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-semibold text-sm">执行历史</h4>
                <span className="text-xs text-muted-foreground">共 {runs.length} 条</span>
              </div>
              {runs.length === 0 ? (
                <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                  暂无执行记录
                </div>
              ) : (
                <div className="space-y-2">
                  {runs.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => onOpenRunDetail(r.id)}
                      className="w-full text-left rounded-lg border bg-card p-3 hover:border-primary hover:shadow-elev-sm transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-medium tabular-nums">#{r.id.replace("run-", "")}</span>
                          <StatusBadge tone={statusTone(r.status)} dot={r.status === "运行中"}>{r.status}</StatusBadge>
                          <span className="text-xs text-muted-foreground truncate">{r.trigger} · {r.operator}</span>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      </div>
                      <div className="mt-1.5 text-xs text-muted-foreground tabular-nums">
                        {r.startTime} → {r.endTime} · {r.duration}
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-xs tabular-nums">
                        <span className="text-success">正常 {r.normal}</span>
                        <span className="text-warning">关注 {r.attention}</span>
                        <span className="text-destructive">异常 {r.abnormal}</span>
                      </div>
                      <p className="mt-2 text-xs text-foreground/80 leading-relaxed line-clamp-2">{r.summary}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function InfoTile({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2.5 flex items-center gap-2.5">
      <div className="h-8 w-8 rounded-md bg-primary-soft text-primary flex items-center justify-center">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-medium truncate">{value}</div>
      </div>
    </div>
  );
}

function RunStat({ label, value, tone }: { label: string; value: number | string; tone?: "success" | "destructive" }) {
  const color = tone === "success" ? "text-success" : tone === "destructive" ? "text-destructive" : "text-foreground";
  return (
    <div className="rounded-lg border bg-card px-3 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 text-xl font-semibold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}
