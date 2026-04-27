import { useMemo, useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import {
  hosts,
  inspectionTasks as initialTasks,
  inspectionRuns as initialRuns,
  alerts,
  type InspectionTask,
  type InspectionRun,
} from "@/lib/mockData";
import { toast } from "sonner";

type Metric = "CPU" | "内存" | "磁盘" | "Ping";
const METRICS: Metric[] = ["CPU", "内存", "磁盘", "Ping"];
const TARGET_GROUPS = ["全部主机组", "Web 接入层", "应用服务层", "数据库", "缓存层", "消息中间件"];

export default function Inspection() {
  const [tasks, setTasks] = useState<InspectionTask[]>(initialTasks);
  const [runs, setRuns] = useState<InspectionRun[]>(initialRuns);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<InspectionTask | null>(null);

  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const detailTask = tasks.find((t) => t.id === detailTaskId) || null;

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [selectedHost, setSelectedHost] = useState(hosts[2]);

  function openCreate() {
    setEditingTask(null);
    setEditorOpen(true);
  }
  function openEdit(t: InspectionTask) {
    setEditingTask(t);
    setEditorOpen(true);
  }
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
    const now = new Date();
    const fmt = now.toISOString().replace("T", " ").slice(0, 19);
    const newRun: InspectionRun = {
      id,
      taskId: t.id,
      startTime: fmt,
      endTime: "—",
      duration: "进行中",
      status: "运行中",
      trigger: "手动",
      operator: "李管理",
      normal: 0,
      attention: 0,
      abnormal: 0,
      summary: "已触发，等待巡检分析 Agent 返回结果...",
    };
    setRuns((prev) => [newRun, ...prev]);
    setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, status: "运行中", lastRun: fmt } : x)));
    toast.success(`已触发 "${t.name}"`);
  }

  return (
    <div className="space-y-6">
      {/* 顶部统计 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
          <SummaryTile icon={CheckCircle2} label="正常" value="23" tone="success" />
          <SummaryTile icon={AlertCircle} label="关注" value="7" tone="warning" />
          <SummaryTile icon={AlertTriangle} label="异常" value="3" tone="destructive" />
          <SummaryTile icon={Calendar} label="今日任务" value={String(tasks.length)} tone="info" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><RefreshCw className="h-4 w-4 mr-2" />刷新</Button>
          <Button className="bg-primary" onClick={openCreate}><Plus className="h-4 w-4 mr-2" />新建巡检任务</Button>
        </div>
      </div>

      {/* 巡检任务管理 */}
      <div className="panel">
        <div className="flex items-center justify-between p-5 pb-3">
          <div>
            <h3 className="font-semibold">巡检任务</h3>
            <p className="text-xs text-muted-foreground mt-0.5">支持创建、编辑、启停与立即执行；点击任务名查看执行历史</p>
          </div>
          <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" />新建</Button>
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

      {/* 主机巡检结果 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                onClick={() => setSelectedHost(h)}
                className={`w-full text-left rounded-lg border px-3 py-2.5 transition-all ${
                  selectedHost.id === h.id
                    ? "border-primary bg-primary-soft/60 shadow-elev-sm"
                    : "bg-card hover:bg-secondary/50 hover:border-border"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate">{h.name}</span>
                  <StatusBadge tone={statusTone(h.status)} dot>{h.status}</StatusBadge>
                </div>
                <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                  <span>{h.ip}</span>
                  <span>{h.group}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="panel p-5 lg:col-span-2 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{selectedHost.name}</h3>
                <StatusBadge tone={statusTone(selectedHost.status)} dot>{selectedHost.status}</StatusBadge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedHost.ip} · {selectedHost.group} · 运行时长 {selectedHost.uptime}
              </p>
            </div>
            <Button variant="outline" size="sm">查看 Zabbix 原始数据</Button>
          </div>

          <Tabs defaultValue="metrics">
            <TabsList>
              <TabsTrigger value="metrics">指标巡检</TabsTrigger>
              <TabsTrigger value="alerts">关注项</TabsTrigger>
            </TabsList>

            <TabsContent value="metrics" className="space-y-3 mt-4">
              <MetricRow icon={Cpu} label="CPU 使用率" value={selectedHost.cpu} threshold={85} desc="阈值：>85% 持续 10 分钟" />
              <MetricRow icon={MemoryStick} label="内存使用率" value={selectedHost.memory} threshold={80} desc="阈值：>80% 持续 30 分钟" />
              <MetricRow icon={HardDrive} label="磁盘使用率" value={selectedHost.disk} threshold={75} desc="阈值：>75% 触发关注，>90% 严重" />
              <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${selectedHost.ping > 100 ? "bg-destructive-soft text-destructive" : "bg-success-soft text-success"}`}>
                  <Wifi className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Ping / ICMP</span>
                    <span className={`text-sm tabular-nums font-medium ${selectedHost.ping > 100 ? "text-destructive" : "text-success"}`}>
                      {selectedHost.ping > 100 ? "超时" : `${selectedHost.ping} ms`}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">阈值：连续 3 次失败触发严重</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="alerts" className="mt-4 space-y-3">
              {alerts.filter((a) => a.host === selectedHost.name).length === 0 ? (
                <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                  当前无关注项 ✓
                </div>
              ) : (
                alerts.filter((a) => a.host === selectedHost.name).map((a) => (
                  <div key={a.id} className="rounded-lg border-l-2 border-destructive bg-destructive-soft/40 p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-semibold">{a.metric} · {a.value}</span>
                      <StatusBadge tone={statusTone(a.severity)}>{a.severity}</StatusBadge>
                    </div>
                    <p className="text-xs text-foreground/80">{a.description}</p>
                    <div className="mt-2 rounded-md bg-card border p-2.5">
                      <p className="text-xs font-medium text-muted-foreground mb-1">知识问答 Agent 建议</p>
                      <p className="text-xs text-foreground/90 whitespace-pre-line">{a.suggestion}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{a.time} · 阈值规则：{a.threshold}</p>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* 任务编辑/创建 */}
      <TaskEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        task={editingTask}
        onSave={handleSave}
        existingTasks={tasks}
      />

      {/* 任务详情（含执行历史） */}
      <TaskDetailSheet
        task={detailTask}
        runs={runs.filter((r) => r.taskId === detailTask?.id)}
        onClose={() => setDetailTaskId(null)}
        onEdit={(t) => { setDetailTaskId(null); openEdit(t); }}
        onRun={(t) => runNow(t)}
      />

      {/* 删除确认 */}
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

/* ---------------- 子组件 ---------------- */

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
          <p className="text-xs text-muted-foreground mt-1.5">{desc}</p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 任务编辑器 ---------------- */

function TaskEditorDialog({
  open,
  onOpenChange,
  task,
  onSave,
  existingTasks,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  task: InspectionTask | null;
  onSave: (data: InspectionTask) => void;
  existingTasks: InspectionTask[];
}) {
  const isEdit = !!task;
  const [form, setForm] = useState<InspectionTask>(() => emptyForm());

  // AI 自然语言生成
  const [nlOpen, setNlOpen] = useState(false);
  const [nlPrompt, setNlPrompt] = useState("");
  const [nlLoading, setNlLoading] = useState(false);
  const [nlReasoning, setNlReasoning] = useState<string>("");

  // AI 合并建议
  const [mergeLoading, setMergeLoading] = useState(false);
  const [mergeResult, setMergeResult] = useState<MergeSuggestion | null>(null);

  // 当弹窗打开或目标任务变化时重置表单
  useMemo(() => {
    if (open) {
      setForm(task ? { ...task } : emptyForm());
      setNlReasoning("");
      setMergeResult(null);
    }
  }, [open, task]);

  function emptyForm(): InspectionTask {
    return {
      id: "",
      name: "",
      type: "日常巡检",
      schedule: "每日 08:00",
      lastRun: "—",
      status: "待运行",
      normal: 0,
      attention: 0,
      abnormal: 0,
      description: "",
      targets: ["全部主机组"],
      metrics: ["CPU", "内存", "磁盘", "Ping"],
      enabled: true,
      owner: "李管理",
      createdAt: new Date().toISOString().slice(0, 10),
    };
  }

  function toggleMetric(m: Metric) {
    setForm((f) => ({
      ...f,
      metrics: f.metrics.includes(m) ? f.metrics.filter((x) => x !== m) : [...f.metrics, m],
    }));
  }
  function toggleTarget(t: string) {
    setForm((f) => ({
      ...f,
      targets: f.targets.includes(t) ? f.targets.filter((x) => x !== t) : [...f.targets, t],
    }));
  }

  async function handleNlGenerate() {
    if (!nlPrompt.trim()) {
      toast.error("请描述你希望的巡检规则");
      return;
    }
    setNlLoading(true);
    try {
      const res = await callInspectionAi({ mode: "parse", prompt: nlPrompt });
      const r = res as ParsedTask;
      setForm((f) => ({
        ...f,
        name: r.name || f.name,
        type: (r.type as any) || f.type,
        schedule: r.schedule || f.schedule,
        metrics: r.metrics?.length ? r.metrics : f.metrics,
        targets: r.targets?.length ? r.targets : f.targets,
        owner: r.owner || f.owner,
        description: r.description || f.description,
      }));
      setNlReasoning(r.reasoning || "");
      setMergeResult(null);
      toast.success("已根据描述填充任务字段");
      setNlOpen(false);
    } catch (e: any) {
      toast.error(e?.message || "AI 生成失败");
    } finally {
      setNlLoading(false);
    }
  }

  async function handleMergeCheck() {
    if (!form.name.trim() || form.metrics.length === 0 || form.targets.length === 0) {
      toast.error("请先完善任务名称、指标与目标，再请 AI 评估");
      return;
    }
    setMergeLoading(true);
    setMergeResult(null);
    try {
      const draft = {
        name: form.name,
        type: form.type,
        schedule: form.schedule,
        metrics: form.metrics,
        targets: form.targets,
        description: form.description ?? "",
      };
      const peers = existingTasks
        .filter((t) => t.id !== form.id)
        .map((t) => ({
          id: t.id,
          name: t.name,
          type: t.type,
          schedule: t.schedule,
          metrics: t.metrics,
          targets: t.targets,
          description: t.description ?? "",
        }));
      const res = await callInspectionAi({
        mode: "merge",
        draft,
        existingTasks: peers,
      });
      setMergeResult(res as MergeSuggestion);
    } catch (e: any) {
      toast.error(e?.message || "AI 评估失败");
    } finally {
      setMergeLoading(false);
    }
  }

  function applySuggestion() {
    if (!mergeResult) return;
    const s = mergeResult.suggestedTask;
    setForm((f) => ({
      ...f,
      name: s.name,
      type: s.type as any,
      schedule: s.schedule,
      metrics: s.metrics,
      targets: s.targets,
      description: s.description,
    }));
    toast.success("已应用 AI 建议");
    setMergeResult(null);
  }

  function submit() {
    if (!form.name.trim()) {
      toast.error("请填写任务名称");
      return;
    }
    if (form.metrics.length === 0) {
      toast.error("请至少选择一项巡检指标");
      return;
    }
    if (form.targets.length === 0) {
      toast.error("请至少选择一个巡检目标");
      return;
    }
    onSave(form);
  }

  const mergeTargetTask = mergeResult?.mergeIntoTaskId
    ? existingTasks.find((t) => t.id === mergeResult.mergeIntoTaskId)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? "编辑巡检任务" : "新建巡检任务"}
          </DialogTitle>
          <DialogDescription>
            可手工配置，也可通过自然语言让 AI 生成草稿；保存前可让 AI 评估与现有规则的重叠情况。
          </DialogDescription>
        </DialogHeader>

        {/* AI 工具条 */}
        <div className="rounded-lg border border-primary/20 bg-primary-soft/30 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-medium">AI 助手</span>
              <span className="text-xs text-muted-foreground">由 Lovable AI 提供</span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setNlOpen((v) => !v)}
              >
                <Wand2 className="h-4 w-4 mr-1" />
                自然语言生成
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleMergeCheck}
                disabled={mergeLoading}
              >
                {mergeLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <GitMerge className="h-4 w-4 mr-1" />}
                评估合并建议
              </Button>
            </div>
          </div>

          {nlOpen && (
            <div className="space-y-2 pt-1">
              <Textarea
                rows={3}
                placeholder="例如：每天早上 7 点对数据库主机做一次内存和磁盘巡检，由 DBA 负责"
                value={nlPrompt}
                onChange={(e) => setNlPrompt(e.target.value)}
              />
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
            <MergeSuggestionCard
              suggestion={mergeResult}
              targetTask={mergeTargetTask}
              onApply={applySuggestion}
              onDismiss={() => setMergeResult(null)}
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label className="text-sm">任务名称</Label>
            <Input
              className="mt-1.5"
              placeholder="例如：核心数据库专项巡检"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
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
            <Input
              className="mt-1.5"
              placeholder="例如：每日 08:00 / 每 30 分钟"
              value={form.schedule}
              onChange={(e) => setForm({ ...form, schedule: e.target.value })}
            />
          </div>

          <div className="col-span-2">
            <Label className="text-sm">巡检指标</Label>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {METRICS.map((m) => (
                <label
                  key={m}
                  className={`flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer text-sm ${
                    form.metrics.includes(m) ? "border-primary bg-primary-soft/40" : "bg-card hover:bg-secondary/50"
                  }`}
                >
                  <Checkbox
                    checked={form.metrics.includes(m)}
                    onCheckedChange={() => toggleMetric(m)}
                  />
                  {m}
                </label>
              ))}
            </div>
          </div>

          <div className="col-span-2">
            <Label className="text-sm">巡检目标</Label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {TARGET_GROUPS.map((g) => (
                <label
                  key={g}
                  className={`flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer text-sm ${
                    form.targets.includes(g) ? "border-primary bg-primary-soft/40" : "bg-card hover:bg-secondary/50"
                  }`}
                >
                  <Checkbox
                    checked={form.targets.includes(g)}
                    onCheckedChange={() => toggleTarget(g)}
                  />
                  {g}
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm">负责人</Label>
            <Input
              className="mt-1.5"
              value={form.owner}
              onChange={(e) => setForm({ ...form, owner: e.target.value })}
            />
          </div>
          <div className="flex items-end">
            <div className="flex items-center justify-between w-full rounded-md border bg-card px-3 h-10">
              <Label className="text-sm">启用任务</Label>
              <Switch
                checked={form.enabled}
                onCheckedChange={(v) => setForm({ ...form, enabled: v })}
              />
            </div>
          </div>

          <div className="col-span-2">
            <Label className="text-sm">任务描述</Label>
            <Textarea
              className="mt-1.5"
              rows={3}
              placeholder="说明该巡检任务的业务背景、关注点等"
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
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

/* ---------------- AI 合并建议卡片 ---------------- */

function MergeSuggestionCard({
  suggestion,
  targetTask,
  onApply,
  onDismiss,
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
        <Button size="sm" variant="ghost" onClick={onDismiss}>
          <X className="h-4 w-4" />
        </Button>
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
  task,
  runs,
  onClose,
  onEdit,
  onRun,
}: {
  task: InspectionTask | null;
  runs: InspectionRun[];
  onClose: () => void;
  onEdit: (t: InspectionTask) => void;
  onRun: (t: InspectionTask) => void;
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
              <SheetDescription className="text-sm">
                {task.description || "暂无描述"}
              </SheetDescription>
            </SheetHeader>

            {/* 概览信息 */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <InfoTile icon={ListChecks} label="任务类型" value={task.type} />
              <InfoTile icon={Clock} label="调度" value={task.schedule} />
              <InfoTile icon={UserIcon} label="负责人" value={task.owner} />
              <InfoTile icon={Calendar} label="创建时间" value={task.createdAt} />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground">指标：</span>
              {task.metrics.map((m) => (
                <span key={m} className="text-xs rounded bg-secondary px-2 py-0.5">{m}</span>
              ))}
              <span className="text-xs text-muted-foreground ml-3">目标：</span>
              {task.targets.map((t) => (
                <span key={t} className="text-xs rounded bg-secondary px-2 py-0.5">{t}</span>
              ))}
            </div>

            {/* 执行统计 */}
            <div className="mt-5 grid grid-cols-3 gap-3">
              <RunStat label="累计执行" value={totalRuns} />
              <RunStat label="成功率" value={`${successRate}%`} tone="success" />
              <RunStat label="失败次数" value={failedRuns} tone={failedRuns > 0 ? "destructive" : undefined} />
            </div>

            {/* 历史执行 */}
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
                    <div key={r.id} className="rounded-lg border bg-card p-3 hover:shadow-elev-sm transition-shadow">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-medium tabular-nums">#{r.id.replace("run-", "")}</span>
                          <StatusBadge tone={statusTone(r.status)} dot={r.status === "运行中"}>{r.status}</StatusBadge>
                          <span className="text-xs text-muted-foreground truncate">{r.trigger} · {r.operator}</span>
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums shrink-0">{r.duration}</span>
                      </div>
                      <div className="mt-1.5 text-xs text-muted-foreground tabular-nums">
                        {r.startTime} → {r.endTime}
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-xs tabular-nums">
                        <span className="text-success">正常 {r.normal}</span>
                        <span className="text-warning">关注 {r.attention}</span>
                        <span className="text-destructive">异常 {r.abnormal}</span>
                      </div>
                      <p className="mt-2 text-xs text-foreground/80 leading-relaxed">{r.summary}</p>
                    </div>
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
