import { useEffect, useMemo, useState } from "react";
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
  Lightbulb,
  X,
  ExternalLink,
  Search,
  ClipboardList,
  Target,
  Bell,
  AlertTriangle,
  CheckCircle2,
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
  inspectionTasks as initialTasks,
  inspectionRuns as initialRuns,
  assets,
  observationConfigs,
  defaultCheckItemsByAssetType,
  type Asset,
  type AssetType,
  type Environment,
  type InspectionTask,
  type InspectionRun,
  type CheckItemConfig,
  type SchemeScopeType,
} from "@/lib/mockData";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

async function callInspectionAi(payload: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("inspection-ai", { body: payload });
  if (error) {
    const msg = (data as any)?.error || error.message || "AI 调用失败";
    throw new Error(msg);
  }
  if ((data as any)?.error) throw new Error((data as any).error);
  return (data as any).result;
}

const ASSET_TYPES: AssetType[] = ["主机", "应用服务", "数据库", "中间件"];
const ENVIRONMENTS: Environment[] = ["生产", "预生产", "测试"];

const ITEM_KEY_TO_ZBX: Record<string, string[]> = {
  cpu: ["system.cpu.util"],
  mem: ["vm.memory.utilization"],
  disk: ["vfs.fs.pused"],
  data_disk: ["vfs.fs.pused"],
  ping: ["icmpping"],
  agent: ["agent.ping"],
  port: ["net.tcp.service"],
  http_status: ["web.page.get"],
  http_rt: ["web.page.perf"],
  proc: ["proc.num"],
  conn: ["mysql.status[Threads_connected]", "redis.connected_clients"],
  slow_sql: ["mysql.slow_queries"],
  db_avail: ["mysql.ping"],
  repl_lag: ["mysql.replication_lag"],
  queue_lag: ["rabbitmq.queue.messages"],
  app_err_log: [],
  access_5xx: [],
  err_log: [],
};

/** 一个资产对某个巡检项是否已在观测配置中映射 */
function assetHasItem(asset: Asset, item: CheckItemConfig): "matched" | "unmatched" | "log" {
  const isLog = ["app_err_log", "access_5xx", "err_log"].includes(item.key);
  const cfg = observationConfigs[asset.id];
  if (isLog) return cfg && cfg.logSources.length > 0 ? "matched" : "unmatched";
  const zbxKeys = ITEM_KEY_TO_ZBX[item.key] ?? [];
  if (!cfg) return "unmatched";
  const has = cfg.items.some((it) => zbxKeys.some((k) => it.key.startsWith(k)));
  return has ? "matched" : "unmatched";
}

export default function InspectionAdmin() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<InspectionTask[]>(initialTasks);
  const [runs, setRuns] = useState<InspectionRun[]>(initialRuns);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<InspectionTask | null>(null);
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // 筛选
  const [filterType, setFilterType] = useState<"全部" | AssetType>("全部");
  const [filterSystem, setFilterSystem] = useState<string>("全部");
  const [filterEnabled, setFilterEnabled] = useState<"全部" | "启用" | "停用">("全部");
  const [keyword, setKeyword] = useState("");

  const businessSystems = useMemo(
    () => Array.from(new Set(assets.map((a) => a.businessSystem))),
    [],
  );

  const detailTask = tasks.find((t) => t.id === detailTaskId) || null;

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filterType !== "全部" && t.appliesTo && t.appliesTo !== filterType) return false;
      if (filterSystem !== "全部" && !(t.businessSystems ?? []).includes(filterSystem) && t.scopeType !== "全部") return false;
      if (filterEnabled === "启用" && !t.enabled) return false;
      if (filterEnabled === "停用" && t.enabled) return false;
      if (keyword && !t.name.includes(keyword)) return false;
      return true;
    });
  }, [tasks, filterType, filterSystem, filterEnabled, keyword]);

  function openCreate() { setEditingTask(null); setEditorOpen(true); }
  function openEdit(t: InspectionTask) { setEditingTask(t); setEditorOpen(true); }

  function handleSave(data: InspectionTask) {
    if (editingTask) {
      setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? { ...t, ...data, id: editingTask.id } : t)));
      toast.success("巡检方案已更新");
    } else {
      const id = "t" + Math.random().toString(36).slice(2, 7);
      setTasks((prev) => [
        { ...data, id, lastRun: "—", status: "待运行", normal: 0, attention: 0, abnormal: 0, createdAt: new Date().toISOString().slice(0, 10), lastResult: "—" },
        ...prev,
      ]);
      toast.success("巡检方案已创建");
    }
    setEditorOpen(false);
  }
  function handleDelete() {
    if (!deleteId) return;
    setTasks((prev) => prev.filter((t) => t.id !== deleteId));
    setRuns((prev) => prev.filter((r) => r.taskId !== deleteId));
    toast.success("巡检方案已删除");
    if (detailTaskId === deleteId) setDetailTaskId(null);
    setDeleteId(null);
  }
  function toggleEnabled(t: InspectionTask) {
    setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, enabled: !x.enabled } : x)));
    toast.success(t.enabled ? "已停用" : "已启用");
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
      {/* 筛选栏 + 新建 */}
      <div className="panel p-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={keyword} onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索方案名称" className="h-9 w-56 pl-8" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">资产类型</span>
          <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
            <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="全部">全部</SelectItem>
              {ASSET_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">业务系统</span>
          <Select value={filterSystem} onValueChange={setFilterSystem}>
            <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="全部">全部</SelectItem>
              {businessSystems.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">状态</span>
          <Select value={filterEnabled} onValueChange={(v: any) => setFilterEnabled(v)}>
            <SelectTrigger className="h-9 w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="全部">全部</SelectItem>
              <SelectItem value="启用">启用</SelectItem>
              <SelectItem value="停用">停用</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto">
          <Button className="bg-primary" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />新增巡检方案
          </Button>
        </div>
      </div>

      {/* 列表 */}
      <div className="panel">
        <div className="flex items-center justify-between p-5 pb-3">
          <div>
            <h3 className="font-semibold">巡检方案</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              点击方案名查看详情与历史执行；每个方案面向一类资产，配置巡检范围、巡检项与异常阈值。
            </p>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>方案名称</TableHead>
              <TableHead>适用资产类型</TableHead>
              <TableHead>巡检范围</TableHead>
              <TableHead>巡检项</TableHead>
              <TableHead>巡检频率</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>最近执行</TableHead>
              <TableHead>最近结果</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.map((t) => {
              const scope = summarizeScope(t);
              const itemCount = (t.checkItems ?? []).filter((i) => i.enabled).length
                || t.metrics.length;
              const freq = t.frequency || t.schedule;
              return (
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
                  <TableCell><StatusBadge tone="info">{t.appliesTo ?? "—"}</StatusBadge></TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[220px] truncate" title={scope}>{scope}</TableCell>
                  <TableCell className="text-sm tabular-nums">{itemCount} 项</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{freq}</TableCell>
                  <TableCell>
                    <StatusBadge tone={t.enabled ? "success" : "muted"}>{t.enabled ? "启用" : "停用"}</StatusBadge>
                  </TableCell>
                  <TableCell className="text-sm tabular-nums text-muted-foreground">{t.lastRun}</TableCell>
                  <TableCell>
                    <StatusBadge tone={statusTone(t.lastResult || (t.abnormal > 0 ? "异常" : t.attention > 0 ? "关注" : "正常"))}>
                      {t.lastResult || (t.abnormal > 0 ? "异常" : t.attention > 0 ? "关注" : "正常")}
                    </StatusBadge>
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
              );
            })}
            {filteredTasks.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-10">
                  无匹配的巡检方案
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <SchemeEditorSheet
        open={editorOpen}
        onOpenChange={setEditorOpen}
        task={editingTask}
        onSave={handleSave}
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
            <AlertDialogTitle>删除该巡检方案？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后方案及其执行历史将被移除，此操作不可撤销。
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

function summarizeScope(t: InspectionTask): string {
  const type = t.appliesTo ?? "";
  if (!t.scopeType) return t.targets.slice(0, 3).join("、") || "—";
  if (t.scopeType === "全部") return `全部${type}资产`;
  if (t.scopeType === "指定业务系统") return `业务系统：${(t.businessSystems ?? []).join("、") || "未选"}`;
  return `指定资产：${(t.assetIds ?? []).length} 个`;
}

/* ---------------- 巡检方案编辑器 ---------------- */

function emptyScheme(): InspectionTask {
  return {
    id: "", name: "", type: "日常巡检", schedule: "每日 09:00",
    lastRun: "—", status: "待运行", normal: 0, attention: 0, abnormal: 0,
    description: "",
    assetSelections: [], targets: [], metrics: [],
    enabled: true, owner: "李管理", createdAt: new Date().toISOString().slice(0, 10),
    appliesTo: "主机",
    scopeType: "全部",
    businessSystems: [],
    environments: ["生产"],
    assetIds: [],
    checkItems: JSON.parse(JSON.stringify(defaultCheckItemsByAssetType["主机"])) as CheckItemConfig[],
    scheduleMode: "定时",
    frequency: "每 5 分钟",
    runAt: "",
    notifyMode: "不通知",
    notifyChannels: [],
    generateReport: true,
    lastResult: "—",
  };
}

function SchemeEditorSheet({
  open, onOpenChange, task, onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  task: InspectionTask | null;
  onSave: (data: InspectionTask) => void;
}) {
  const isEdit = !!task;
  const [form, setForm] = useState<InspectionTask>(() => emptyScheme());
  const [nlOpen, setNlOpen] = useState(false);
  const [nlPrompt, setNlPrompt] = useState("");
  const [nlLoading, setNlLoading] = useState(false);
  const [nlReasoning, setNlReasoning] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    if (task) {
      // 补齐可能缺失的方案字段
      const seed = emptyScheme();
      const merged: InspectionTask = {
        ...seed,
        ...task,
        appliesTo: task.appliesTo ?? seed.appliesTo,
        scopeType: task.scopeType ?? seed.scopeType,
        checkItems: task.checkItems ?? JSON.parse(JSON.stringify(defaultCheckItemsByAssetType[task.appliesTo ?? "主机"])),
      };
      setForm(merged);
    } else {
      setForm(emptyScheme());
    }
    setNlReasoning("");
    setNlOpen(false);
    setNlPrompt("");
  }, [open, task]);

  // 切换适用资产类型 → 重置巡检项 & 已选资产
  function changeAppliesTo(t: AssetType) {
    setForm((f) => ({
      ...f,
      appliesTo: t,
      checkItems: JSON.parse(JSON.stringify(defaultCheckItemsByAssetType[t])) as CheckItemConfig[],
      assetIds: [],
    }));
  }

  // 命中资产
  const hitAssets = useMemo(() => {
    if (!form.appliesTo) return [];
    let list = assets.filter((a) => a.type === form.appliesTo);
    if (form.environments && form.environments.length) {
      list = list.filter((a) => form.environments!.includes(a.environment));
    }
    if (form.scopeType === "指定业务系统") {
      list = list.filter((a) => (form.businessSystems ?? []).includes(a.businessSystem));
    }
    if (form.scopeType === "指定资产") {
      list = list.filter((a) => (form.assetIds ?? []).includes(a.id));
    }
    return list;
  }, [form.appliesTo, form.scopeType, form.businessSystems, form.assetIds, form.environments]);

  const uncoveredAssets = useMemo(
    () => hitAssets.filter((a) => a.observationStatus !== "已配置"),
    [hitAssets],
  );

  const enabledItems = (form.checkItems ?? []).filter((i) => i.enabled);

  const businessSystemsOfType = useMemo(
    () => Array.from(new Set(assets.filter((a) => a.type === form.appliesTo).map((a) => a.businessSystem))),
    [form.appliesTo],
  );

  const assetsOfType = useMemo(
    () => assets.filter((a) => a.type === form.appliesTo),
    [form.appliesTo],
  );

  function toggleBusinessSystem(sys: string) {
    setForm((f) => {
      const list = new Set(f.businessSystems ?? []);
      if (list.has(sys)) list.delete(sys); else list.add(sys);
      return { ...f, businessSystems: [...list] };
    });
  }

  function toggleAssetId(id: string) {
    setForm((f) => {
      const list = new Set(f.assetIds ?? []);
      if (list.has(id)) list.delete(id); else list.add(id);
      return { ...f, assetIds: [...list] };
    });
  }

  function toggleEnv(env: Environment) {
    setForm((f) => {
      const list = new Set(f.environments ?? []);
      if (list.has(env)) list.delete(env); else list.add(env);
      return { ...f, environments: [...list] };
    });
  }

  function updateCheckItem(key: string, patch: Partial<CheckItemConfig>) {
    setForm((f) => ({
      ...f,
      checkItems: (f.checkItems ?? []).map((i) => (i.key === key ? { ...i, ...patch } : i)),
    }));
  }

  async function handleNlGenerate() {
    if (!nlPrompt.trim()) { toast.error("请描述你希望的巡检方案"); return; }
    setNlLoading(true);
    try {
      const assetCatalog = assets.map((a) => ({
        id: a.id, name: a.name, type: a.type,
        businessSystem: a.businessSystem, ip: a.ip, environment: a.environment,
      }));
      const res = await callInspectionAi({ mode: "parse", prompt: nlPrompt, assetCatalog });
      setForm((f) => ({
        ...f,
        name: res.name || f.name,
        type: (res.type as any) || f.type,
        frequency: res.schedule || f.frequency,
        owner: res.owner || f.owner,
        description: res.description || f.description,
      }));
      setNlReasoning(res.reasoning || "");
      setNlOpen(false);
      toast.success("已预填方案基础信息，请核对巡检范围与规则");
    } catch (e: any) {
      toast.error(e?.message || "AI 生成失败");
    } finally { setNlLoading(false); }
  }

  function submit() {
    if (!form.name.trim()) { toast.error("请填写方案名称"); return; }
    if (!form.appliesTo) { toast.error("请选择适用资产类型"); return; }
    if (form.scopeType === "指定业务系统" && !(form.businessSystems ?? []).length) {
      toast.error("请选择至少一个业务系统"); return;
    }
    if (form.scopeType === "指定资产" && !(form.assetIds ?? []).length) {
      toast.error("请选择至少一个资产"); return;
    }
    if (enabledItems.length === 0) { toast.error("请至少启用一个巡检项"); return; }

    // 派生兼容字段
    const targets = hitAssets.map((a) => a.name);
    const metrics = enabledItems.map((i) => i.name);
    const assetSelections = hitAssets.map((a) => ({ assetId: a.id, metrics }));
    const schedule = form.scheduleMode === "手动" ? "手动执行" : (form.frequency || "");

    if (uncoveredAssets.length) {
      toast.warning(`${uncoveredAssets.length} 个资产未完成观测接入，已保存但巡检时将显示为未配置`);
    }

    onSave({ ...form, targets, metrics, assetSelections, schedule });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[1080px] p-0 overflow-hidden flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-3 border-b">
          <SheetTitle className="text-base">{isEdit ? "编辑巡检方案" : "新增巡检方案"}</SheetTitle>
          <SheetDescription className="text-xs">
            巡检方案面向资产配置，不直接选择原始 Zabbix Item。具体 Item 来自「资产管理 → 观测接入」。
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* AI 助手 */}
          <div className="rounded-lg border border-primary/20 bg-primary-soft/30 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-medium">AI 助手</span>
                <span className="text-xs text-muted-foreground">用自然语言描述，快速生成方案草稿</span>
              </div>
              <Button size="sm" variant="outline" onClick={() => setNlOpen((v) => !v)}>
                <Wand2 className="h-4 w-4 mr-1" />自然语言生成
              </Button>
            </div>
            {nlOpen && (
              <div className="space-y-2 pt-1">
                <Textarea rows={3} placeholder="例如：每 5 分钟对生产环境的核心交易系统主机做基础巡检"
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
              <div className="rounded-md bg-card border p-2.5 text-xs text-muted-foreground whitespace-pre-line">
                <span className="font-medium text-foreground">AI 推断说明：</span>{nlReasoning}
              </div>
            )}
          </div>

          {/* 1. 基本信息 */}
          <Section icon={ClipboardList} title="1. 基本信息">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs">方案名称</Label>
                <Input className="mt-1.5 h-9" placeholder="例如：主机基础巡检"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">适用资产类型</Label>
                <Select value={form.appliesTo} onValueChange={(v: AssetType) => changeAppliesTo(v)}>
                  <SelectTrigger className="mt-1.5 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">负责人</Label>
                <Input className="mt-1.5 h-9" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">方案说明</Label>
                <Textarea className="mt-1.5" rows={2} placeholder="用于生产主机基础资源巡检"
                  value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="col-span-2 flex items-center justify-between rounded-md border bg-background px-3 py-2">
                <Label className="text-xs">启用该方案</Label>
                <Switch checked={form.enabled} onCheckedChange={(v) => setForm({ ...form, enabled: v })} />
              </div>
            </div>
          </Section>

          {/* 2. 巡检范围 */}
          <Section icon={Target} title="2. 巡检范围">
            <div className="space-y-3">
              <div>
                <Label className="text-xs">范围类型</Label>
                <div className="mt-1.5 flex gap-2">
                  {(["全部", "指定业务系统", "指定资产"] as SchemeScopeType[]).map((s) => (
                    <button key={s} onClick={() => setForm({ ...form, scopeType: s })}
                      className={`px-3 h-8 rounded-md border text-xs ${
                        form.scopeType === s ? "border-primary bg-primary-soft text-primary" : "bg-background hover:bg-secondary/50"
                      }`}>
                      {s === "全部" ? `全部${form.appliesTo}资产` : s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs">运行环境</Label>
                <div className="mt-1.5 flex gap-2">
                  {ENVIRONMENTS.map((env) => {
                    const on = (form.environments ?? []).includes(env);
                    return (
                      <button key={env} onClick={() => toggleEnv(env)}
                        className={`px-3 h-8 rounded-md border text-xs ${
                          on ? "border-primary bg-primary-soft text-primary" : "bg-background hover:bg-secondary/50"
                        }`}>{env}</button>
                    );
                  })}
                </div>
              </div>

              {form.scopeType === "指定业务系统" && (
                <div>
                  <Label className="text-xs">业务系统</Label>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {businessSystemsOfType.map((sys) => {
                      const on = (form.businessSystems ?? []).includes(sys);
                      return (
                        <button key={sys} onClick={() => toggleBusinessSystem(sys)}
                          className={`px-3 h-8 rounded-md border text-xs ${
                            on ? "border-primary bg-primary-soft text-primary" : "bg-background hover:bg-secondary/50"
                          }`}>{sys}</button>
                      );
                    })}
                  </div>
                </div>
              )}

              {form.scopeType === "指定资产" && (
                <div>
                  <Label className="text-xs">指定资产（{(form.assetIds ?? []).length} 已选）</Label>
                  <div className="mt-1.5 rounded-md border max-h-56 overflow-y-auto divide-y">
                    {assetsOfType.map((a) => {
                      const on = (form.assetIds ?? []).includes(a.id);
                      return (
                        <label key={a.id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-secondary/40">
                          <Checkbox checked={on} onCheckedChange={() => toggleAssetId(a.id)} />
                          <div className="flex-1 min-w-0">
                            <div className="truncate font-medium text-[13px]">{a.name}</div>
                            <div className="text-[11px] text-muted-foreground truncate">
                              {a.businessSystem} · {a.ip} · {a.environment}
                            </div>
                          </div>
                          <StatusBadge tone={a.observationStatus === "已配置" ? "success" : a.observationStatus === "部分配置" ? "warning" : "destructive"}>
                            {a.observationStatus}
                          </StatusBadge>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="rounded-md bg-info-soft/40 border border-info/20 px-3 py-2 text-xs text-foreground/80 space-y-1">
                <div>当前方案将巡检 <span className="font-semibold text-info">{hitAssets.length}</span> 个 {form.appliesTo} 资产。</div>
                {uncoveredAssets.length > 0 && (
                  <div className="flex items-center gap-1 text-warning">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    其中 {uncoveredAssets.length} 个资产未完成观测接入，巡检时将显示为「未配置」。
                  </div>
                )}
              </div>
            </div>
          </Section>

          {/* 3. 巡检项与异常规则 */}
          <Section icon={ListChecks} title="3. 巡检项与异常规则">
            <div className="rounded-md bg-secondary/50 px-3 py-2 text-xs text-muted-foreground mb-3">
              巡检项使用资产观测接入中已映射的 Zabbix Item 和日志源。这里配置的是巡检项、频率与异常判定规则，不直接配置原始 Zabbix Item。
            </div>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">启用</TableHead>
                    <TableHead>巡检项</TableHead>
                    <TableHead>关注条件</TableHead>
                    <TableHead>异常条件</TableHead>
                    <TableHead>判定窗口</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(form.checkItems ?? []).map((item) => (
                    <TableRow key={item.key}>
                      <TableCell>
                        <Switch checked={item.enabled} onCheckedChange={(v) => updateCheckItem(item.key, { enabled: v })} />
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{item.name}</div>
                        {item.optional && <span className="text-[11px] text-muted-foreground">可选</span>}
                      </TableCell>
                      <TableCell>
                        <Input className="h-8 w-32" value={item.warn} onChange={(e) => updateCheckItem(item.key, { warn: e.target.value })} />
                      </TableCell>
                      <TableCell>
                        <Input className="h-8 w-32" value={item.crit} onChange={(e) => updateCheckItem(item.key, { crit: e.target.value })} />
                      </TableCell>
                      <TableCell>
                        <Input className="h-8 w-36" value={item.window} onChange={(e) => updateCheckItem(item.key, { window: e.target.value })} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Section>

          {/* 4. 调度与通知 */}
          <Section icon={Bell} title="4. 调度与通知">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">执行方式</Label>
                <Select value={form.scheduleMode} onValueChange={(v: any) => setForm({ ...form, scheduleMode: v })}>
                  <SelectTrigger className="mt-1.5 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="定时">定时执行</SelectItem>
                    <SelectItem value="手动">手动执行</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.scheduleMode === "定时" && (
                <>
                  <div>
                    <Label className="text-xs">巡检频率</Label>
                    <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
                      <SelectTrigger className="mt-1.5 h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="每 5 分钟">每 5 分钟</SelectItem>
                        <SelectItem value="每 10 分钟">每 10 分钟</SelectItem>
                        <SelectItem value="每小时">每小时</SelectItem>
                        <SelectItem value="每日">每日</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {form.frequency === "每日" && (
                    <div>
                      <Label className="text-xs">执行时间</Label>
                      <Input className="mt-1.5 h-9" placeholder="09:00"
                        value={form.runAt ?? ""} onChange={(e) => setForm({ ...form, runAt: e.target.value })} />
                    </div>
                  )}
                </>
              )}
              <div>
                <Label className="text-xs">异常通知</Label>
                <Select value={form.notifyMode} onValueChange={(v: any) => setForm({ ...form, notifyMode: v })}>
                  <SelectTrigger className="mt-1.5 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="不通知">不通知</SelectItem>
                    <SelectItem value="通知资产负责人">通知资产负责人</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.notifyMode === "通知资产负责人" && (
                <div className="col-span-2">
                  <Label className="text-xs">通知方式</Label>
                  <div className="mt-1.5 flex gap-2">
                    {["站内消息", "邮件", "企业微信"].map((c) => {
                      const on = (form.notifyChannels ?? []).includes(c);
                      return (
                        <button key={c} onClick={() => setForm((f) => {
                          const list = new Set(f.notifyChannels ?? []);
                          if (list.has(c)) list.delete(c); else list.add(c);
                          return { ...f, notifyChannels: [...list] };
                        })}
                          className={`px-3 h-8 rounded-md border text-xs ${
                            on ? "border-primary bg-primary-soft text-primary" : "bg-background hover:bg-secondary/50"
                          }`}>{c}</button>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="col-span-2 flex items-center justify-between rounded-md border bg-background px-3 py-2">
                <Label className="text-xs">是否生成巡检报告</Label>
                <Switch checked={!!form.generateReport} onCheckedChange={(v) => setForm({ ...form, generateReport: v })} />
              </div>
            </div>
          </Section>

          {/* 5. 预览影响范围 */}
          <Section icon={CheckCircle2} title="预览影响范围">
            <div className="rounded-md border bg-card px-3 py-2.5 text-sm space-y-1">
              <div>资产类型：<span className="font-medium">{form.appliesTo}</span></div>
              <div>命中资产：<span className="font-medium">{hitAssets.length}</span> 个</div>
              <div>巡检项：<span className="font-medium">{enabledItems.length}</span> 项</div>
              <div>巡检频率：<span className="font-medium">{form.scheduleMode === "手动" ? "手动执行" : form.frequency}</span></div>
              <div>预计每次查询指标：<span className="font-medium">{hitAssets.length * enabledItems.length}</span> 项</div>
              <div>未完成观测接入资产：<span className={`font-medium ${uncoveredAssets.length ? "text-warning" : ""}`}>{uncoveredAssets.length}</span> 个</div>
            </div>

            <div className="mt-3 rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>资产名称</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Zabbix Host</TableHead>
                    <TableHead>观测接入状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hitAssets.slice(0, 20).map((a) => {
                    const cfg = observationConfigs[a.id];
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="text-sm">{a.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground tabular-nums">{a.ip}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{cfg?.zabbixHost || <span className="text-destructive">未绑定</span>}</TableCell>
                        <TableCell>
                          <StatusBadge tone={a.observationStatus === "已配置" ? "success" : a.observationStatus === "部分配置" ? "warning" : "destructive"}>
                            {a.observationStatus === "已配置" ? "已完成" : "未完成"}
                          </StatusBadge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {hitAssets.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-4">未命中任何资产</TableCell></TableRow>
                  )}
                  {hitAssets.length > 20 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-2">
                      仅显示前 20 条，共 {hitAssets.length} 条
                    </TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Section>
        </div>

        <div className="border-t px-6 py-3 flex justify-end gap-2 bg-background">
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={submit}>{isEdit ? "保存修改" : "创建方案"}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b bg-muted/30">
        <Icon className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-semibold">{title}</h4>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/* ---------------- 方案详情抽屉（含历史） ---------------- */

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
              <InfoTile icon={ListChecks} label="适用类型" value={task.appliesTo || "—"} />
              <InfoTile icon={Clock} label="巡检频率" value={task.frequency || task.schedule} />
              <InfoTile icon={UserIcon} label="负责人" value={task.owner} />
              <InfoTile icon={Calendar} label="创建时间" value={task.createdAt} />
            </div>

            <div className="mt-5">
              <div className="text-xs text-muted-foreground mb-2">巡检范围</div>
              <div className="rounded-md border bg-card px-3 py-2 text-sm">{summarizeScope(task)}</div>
            </div>

            <div className="mt-5">
              <div className="text-xs text-muted-foreground mb-2">
                巡检项（{(task.checkItems ?? []).filter((i) => i.enabled).length} 项已启用）
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(task.checkItems ?? []).filter((i) => i.enabled).map((i) => (
                  <span key={i.key} className="text-xs rounded bg-secondary px-2 py-1">
                    {i.name} · <span className="text-warning">关注 {i.warn}</span> · <span className="text-destructive">异常 {i.crit}</span>
                  </span>
                ))}
                {(task.checkItems ?? []).filter((i) => i.enabled).length === 0 && task.metrics.map((m) => (
                  <span key={m} className="text-xs rounded bg-secondary px-2 py-1">{m}</span>
                ))}
              </div>
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
