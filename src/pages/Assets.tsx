import { useState, useMemo } from "react";
import { Server, Database, Layers, Package, Search, Plus, Settings2, Activity, FileText, Pencil, Trash2, CheckCircle2, AlertCircle, Check, ChevronDown, ChevronsUpDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import {
  assets as initialAssets,
  inspectionItems,
  observationConfigs,
  registerCustomInspectionItem,
  users,
  zabbixHosts,
  zabbixItems,
  type Asset,
  type AssetType,
  type Environment,
  type InspectionItemMapping,
  type LogSourceEntry,
  type ObservationConfig,
} from "@/lib/mockData";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { StatCard, StatCardGrid } from "@/components/StatCard";
import { TableActions } from "@/components/TableActions";

const typeMeta: Record<AssetType, { icon: any; color: string; bg: string }> = {
  主机: { icon: Server, color: "text-primary", bg: "bg-primary-soft" },
  数据库: { icon: Database, color: "text-info", bg: "bg-info/10" },
  应用服务: { icon: Layers, color: "text-success", bg: "bg-success/10" },
  中间件: { icon: Package, color: "text-warning", bg: "bg-warning/10" },
};

const assetTypes: AssetType[] = ["主机", "数据库", "应用服务", "中间件"];
const environments: Environment[] = ["生产", "预生产", "测试"];

function ownerUsers(ownerIds: string[]) {
  return ownerIds.map((id) => users.find((user) => user.id === id)).filter(Boolean) as typeof users;
}

function ownerNames(ownerIds: string[]) {
  return ownerUsers(ownerIds).map((user) => user.name).join("、") || "—";
}

/* ========= 观测配置可选池 ========= */
const zabbixHostPool = zabbixHosts;

type RecommendedMetric = { name: string; description: string; suggestedItem: string };

// 每类资产的核心推荐巡检项（含建议匹配的 Zabbix Item key）
const recommendedMetricsByType: Record<AssetType, RecommendedMetric[]> = {
  主机: [
    { name: "CPU 利用率", description: "判断计算资源是否过高", suggestedItem: "system.cpu.util" },
    { name: "内存使用率", description: "判断内存是否紧张", suggestedItem: "vm.memory.utilization" },
    { name: "磁盘使用率", description: "判断磁盘是否快满", suggestedItem: "vfs.fs.pused[/]" },
    { name: "Ping 连通性", description: "判断主机网络是否可达", suggestedItem: "icmpping" },
  ],
  数据库: [
    { name: "数据库可用性", description: "MySQL ping / 数据库连通", suggestedItem: "mysql.ping" },
    { name: "端口存活", description: "3306 是否可访问", suggestedItem: "net.tcp.service[tcp,,3306]" },
    { name: "当前连接数", description: "判断连接压力", suggestedItem: "mysql.threads_connected" },
    { name: "最大连接数使用率", description: "判断是否接近连接上限", suggestedItem: "mysql.max_connections.pused" },
    { name: "慢查询数", description: "判断 SQL 性能异常", suggestedItem: "mysql.slow_queries" },
    { name: "主从复制状态", description: "主从场景下判断复制是否中断", suggestedItem: "mysql.replication.status" },
    { name: "主从延迟", description: "主从场景下判断延迟是否过高", suggestedItem: "mysql.seconds_behind_master" },
    { name: "数据盘使用率", description: "判断数据目录磁盘是否快满", suggestedItem: "vfs.fs.pused[/data]" },
  ],
  应用服务: [
    { name: "端口存活", description: "服务端口是否可访问", suggestedItem: "net.tcp.service[tcp,,8080]" },
    { name: "HTTP 状态码", description: "健康检查接口是否返回 200", suggestedItem: "web.page.get[health]" },
    { name: "HTTP 响应时间", description: "判断服务响应是否变慢", suggestedItem: "web.page.perf[health]" },
    { name: "进程存活", description: "应用进程是否存在", suggestedItem: "proc.num[java]" },
    { name: "所在主机 CPU 利用率", description: "承载主机 CPU", suggestedItem: "system.cpu.util" },
    { name: "所在主机内存使用率", description: "承载主机内存", suggestedItem: "vm.memory.utilization" },
    { name: "所在主机磁盘使用率", description: "承载主机磁盘", suggestedItem: "vfs.fs.pused[/]" },
  ],
  中间件: [
    { name: "服务端口存活", description: "判断中间件是否可访问", suggestedItem: "net.tcp.service[tcp,,5672]" },
    { name: "进程存活", description: "判断进程是否存在", suggestedItem: "proc.num[mw]" },
    { name: "连接数", description: "判断连接压力", suggestedItem: "mw.connections" },
    { name: "内存使用", description: "判断运行内存是否紧张", suggestedItem: "vm.memory.utilization" },
    { name: "磁盘使用率", description: "Kafka、MQ 等尤其重要", suggestedItem: "vfs.fs.pused[/data]" },
    { name: "集群状态", description: "集群类中间件需要", suggestedItem: "mw.cluster.status" },
  ],
};

type MetricMapping = InspectionItemMapping;
type EditableConfig = ObservationConfig;

const logTypePresets = ["系统日志", "安全日志", "运行日志", "应用日志", "错误日志", "访问日志"];

// 每类资产的默认日志源（示例）
const recommendedLogsByType: Record<AssetType, LogSourceEntry[]> = {
  主机: [
    { id: "log-host-system", name: "系统错误日志", logType: "系统日志", filter: "level=ERROR", enabled: true },
    { id: "log-host-kernel", name: "OOM / kernel 异常", logType: "系统日志", filter: "oom OR kernel panic OR disk error", enabled: true },
  ],
  数据库: [
    { id: "log-db-error", name: "数据库错误日志", logType: "错误日志", filter: "error OR crash OR aborted OR denied", enabled: true },
    { id: "log-db-slow", name: "慢查询日志", logType: "运行日志", filter: "Query_time OR Lock_time", enabled: true },
  ],
  应用服务: [
    { id: "log-app-error", name: "应用错误日志", logType: "错误日志", filter: "error OR exception OR timeout OR failed", enabled: true },
    { id: "log-app-access", name: "访问日志", logType: "访问日志", filter: "status:500 OR 502 OR 503 OR 504", enabled: true },
  ],
  中间件: [
    { id: "log-mw-error", name: "中间件错误日志", logType: "错误日志", filter: "error OR warning OR timeout OR connection refused", enabled: true },
  ],
};

function initConfigs(): Record<string, EditableConfig> {
  const init: Record<string, EditableConfig> = {};
  Object.values(observationConfigs).forEach((c) => {
    const asset = initialAssets.find((a) => a.id === c.assetId);
    if (!asset) return;
    init[c.assetId] = structuredClone(c);
  });
  return init;
}

function statusOf(cfg?: EditableConfig): Asset["observationStatus"] {
  if (!cfg) return "未配置";
  const hasItems = Boolean(cfg.zabbixHostId) && cfg.itemMappings.some((mapping) => mapping.zabbixItemId);
  const hasLogs = (cfg.logSources?.filter((l) => l.enabled).length ?? 0) > 0;
  if (hasItems && hasLogs) return "已配置";
  if (hasItems || hasLogs) return "部分配置";
  return "未配置";
}


type FormState = Partial<Asset>;

const emptyForm: FormState = {
  code: "",
  name: "",
  type: "主机",
  businessSystem: "",
  ip: "",
  port: "",
  environment: "生产",
  importance: "一般",
  status: "在用",
  ownerIds: [],
  description: "",
  observationStatus: "未配置",
};

export default function Assets() {
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [configs, setConfigs] = useState<Record<string, EditableConfig>>(() => initConfigs());
  const [tab, setTab] = useState<"全部" | AssetType>("全部");
  const [keyword, setKeyword] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [obsEditId, setObsEditId] = useState<string | null>(null);

  const filtered = useMemo(() => assets.filter((a) => {
    if (tab !== "全部" && a.type !== tab) return false;
    if (keyword && ![a.name, a.code, a.ip, a.businessSystem].some((s) => s?.includes(keyword))) return false;
    return true;
  }), [tab, keyword, assets]);

  const selected = openId ? assets.find((a) => a.id === openId) ?? null : null;
  const obsEditAsset = obsEditId ? assets.find((a) => a.id === obsEditId) ?? null : null;

  const observationStats = useMemo(() => {
    const statuses = assets.map((asset) => statusOf(configs[asset.id]));
    return {
      total: assets.length,
      configured: statuses.filter((status) => status === "已配置").length,
      partial: statuses.filter((status) => status === "部分配置").length,
      unconfigured: statuses.filter((status) => status === "未配置").length,
    };
  }, [assets, configs]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setFormOpen(true);
  };

  const openEdit = (a: Asset) => {
    setEditingId(a.id);
    setForm({ ...a });
    setFormOpen(true);
  };

  const handleSave = () => {
    if (!form.code?.trim() || !form.name?.trim() || !form.ip?.trim() || !form.businessSystem?.trim() || !form.ownerIds?.length) {
      toast({ title: "请填写完整", description: "资产编码、名称、业务系统、IP、责任人 均为必填", variant: "destructive" });
      return;
    }
    if (editingId) {
      setAssets((prev) => prev.map((a) => (a.id === editingId ? ({ ...a, ...form } as Asset) : a)));
      toast({ title: "已更新", description: `${form.name} 的信息已保存` });
    } else {
      const id = `asset-${Date.now()}`;
      setAssets((prev) => [{ ...(emptyForm as Asset), ...(form as Asset), id }, ...prev]);
      toast({ title: "已创建", description: `新增资产 ${form.name}` });
    }
    setFormOpen(false);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    const target = assets.find((a) => a.id === deleteId);
    setAssets((prev) => prev.map((asset) => asset.id === deleteId ? { ...asset, status: "停用" } : asset));
    setDeleteId(null);
    toast({ title: "资产已停用", description: target ? `${target.name} 的历史关联记录已保留` : undefined });
  };

  const saveObsConfig = (assetId: string, cfg: EditableConfig) => {
    setConfigs((prev) => ({ ...prev, [assetId]: cfg }));
    setObsEditId(null);
    toast({ title: "观测配置已保存" });
  };

  return (
    <div className="space-y-5">
      <StatCardGrid>
        <StatCard title="资产总数" value={observationStats.total} icon={Server} tone="primary" description="当前纳管资产" />
        <StatCard title="观测已配置" value={observationStats.configured} icon={CheckCircle2} tone="success" description="指标与日志均已配置" />
        <StatCard title="部分配置" value={observationStats.partial} icon={AlertCircle} tone="warning" description="仍有观测配置缺项" />
        <StatCard title="未配置" value={observationStats.unconfigured} icon={Settings2} tone="destructive" description="尚未完成观测接入" />
      </StatCardGrid>

      <div className="filter-bar">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList>
            <TabsTrigger value="全部">全部</TabsTrigger>
            <TabsTrigger value="主机">主机</TabsTrigger>
            <TabsTrigger value="数据库">数据库</TabsTrigger>
            <TabsTrigger value="应用服务">应用服务</TabsTrigger>
            <TabsTrigger value="中间件">中间件</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索名称 / 编码 / IP / 业务系统" className="w-72 pl-8 h-9" />
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />新建资产
          </Button>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>资产编码</TableHead>
              <TableHead>名称</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>业务系统</TableHead>
              <TableHead>IP / 端口</TableHead>
              <TableHead>环境</TableHead>
              <TableHead>责任人</TableHead>
              <TableHead>观测配置</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-10">暂无匹配的资产</TableCell>
              </TableRow>
            )}
            {filtered.map((a) => {
              const meta = typeMeta[a.type];
              const Icon = meta.icon;
              const obsStatus = statusOf(configs[a.id]);
              const obsTone = obsStatus === "已配置" ? "success" : obsStatus === "部分配置" ? "warning" : "muted";
              return (
                <TableRow key={a.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setOpenId(a.id)}>
                  <TableCell className="font-mono text-xs">{a.code}</TableCell>
                  <TableCell className="font-medium text-sm">{a.name}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md ${meta.bg} ${meta.color}`}>
                      <Icon className="h-3 w-3" />{a.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{a.businessSystem}</TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">{a.ip}{a.port ? ` : ${a.port}` : ""}</TableCell>
                  <TableCell><StatusBadge tone={a.environment === "生产" ? "destructive" : "muted"}>{a.environment}</StatusBadge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{ownerNames(a.ownerIds)}</TableCell>
                  <TableCell><StatusBadge tone={obsTone} dot>{obsStatus}</StatusBadge></TableCell>
                  <TableCell className="text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <TableActions actions={[
                      { label: "编辑资产", onClick: () => openEdit(a) },
                      { label: "观测配置", onClick: () => setObsEditId(a.id) },
                      { label: "停用", danger: true, onClick: () => setDeleteId(a.id) },
                    ]} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* 详情 Sheet */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selected && (
            <AssetDetail
              asset={selected}
              cfg={configs[selected.id]}
              onEdit={() => { setOpenId(null); openEdit(selected); }}
              onEditObs={() => { setOpenId(null); setObsEditId(selected.id); }}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* 新建/编辑 Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "编辑资产" : "新建资产"}</DialogTitle>
            <DialogDescription>维护资产基本信息，带 <span className="text-destructive">*</span> 为必填项</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <Field label="资产编码" required>
              <Input value={form.code ?? ""} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="如 HOST-001" />
            </Field>
            <Field label="资产名称" required>
              <Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="类型" required>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as AssetType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {assetTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="业务系统" required>
              <Input value={form.businessSystem ?? ""} onChange={(e) => setForm({ ...form, businessSystem: e.target.value })} />
            </Field>
            <Field label="IP 地址" required>
              <Input value={form.ip ?? ""} onChange={(e) => setForm({ ...form, ip: e.target.value })} placeholder="10.0.0.1" />
            </Field>
            <Field label="端口">
              <Input value={form.port ?? ""} onChange={(e) => setForm({ ...form, port: e.target.value })} />
            </Field>
            <Field label="环境" required>
              <Select value={form.environment} onValueChange={(v) => setForm({ ...form, environment: v as Environment })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {environments.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="状态">
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Asset["status"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="在用">在用</SelectItem>
                  <SelectItem value="停用">停用</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="责任人" required>
              <OwnerMultiSelect
                value={form.ownerIds ?? []}
                onChange={(ownerIds) => setForm({ ...form, ownerIds })}
              />
            </Field>
            <Field label="主机名 / Hostname">
              <Input value={form.hostname ?? ""} onChange={(e) => setForm({ ...form, hostname: e.target.value })} />
            </Field>

            {form.type === "主机" && (
              <>
                <Field label="操作系统"><Input value={form.os ?? ""} onChange={(e) => setForm({ ...form, os: e.target.value })} /></Field>
                <Field label="机房位置"><Input value={form.location ?? ""} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
                <Field label="规格"><Input value={form.spec ?? ""} onChange={(e) => setForm({ ...form, spec: e.target.value })} placeholder="8C16G / 500G" /></Field>
              </>
            )}
            {form.type === "数据库" && (
              <>
                <Field label="数据库类型"><Input value={form.dbType ?? ""} onChange={(e) => setForm({ ...form, dbType: e.target.value })} placeholder="Oracle / MySQL / PG" /></Field>
                <Field label="实例名"><Input value={form.dbInstance ?? ""} onChange={(e) => setForm({ ...form, dbInstance: e.target.value })} /></Field>
                <Field label="Schema"><Input value={form.dbSchema ?? ""} onChange={(e) => setForm({ ...form, dbSchema: e.target.value })} /></Field>
                <Field label="角色"><Input value={form.dbRole ?? ""} onChange={(e) => setForm({ ...form, dbRole: e.target.value })} placeholder="主 / 备" /></Field>
              </>
            )}
            {form.type === "应用服务" && (
              <>
                <Field label="服务类型"><Input value={form.serviceType ?? ""} onChange={(e) => setForm({ ...form, serviceType: e.target.value })} /></Field>
                <Field label="服务编码"><Input value={form.serviceCode ?? ""} onChange={(e) => setForm({ ...form, serviceCode: e.target.value })} /></Field>
                <Field label="访问地址"><Input value={form.serviceUrl ?? ""} onChange={(e) => setForm({ ...form, serviceUrl: e.target.value })} /></Field>
              </>
            )}
            {form.type === "中间件" && (
              <>
                <Field label="中间件类型"><Input value={form.mwType ?? ""} onChange={(e) => setForm({ ...form, mwType: e.target.value })} placeholder="Kafka / Redis / Nginx" /></Field>
                <Field label="版本"><Input value={form.mwVersion ?? ""} onChange={(e) => setForm({ ...form, mwVersion: e.target.value })} /></Field>
              </>
            )}

            <div className="col-span-2">
              <Field label="备注">
                <Textarea rows={2} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </Field>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>取消</Button>
            <Button onClick={handleSave}>{editingId ? "保存" : "创建"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 观测配置编辑 Sheet */}
      <Sheet open={!!obsEditAsset} onOpenChange={(o) => !o && setObsEditId(null)}>
        <SheetContent className="w-full sm:max-w-3xl overflow-y-auto p-0">
          {obsEditAsset && (
            <ObservationEditor
              asset={obsEditAsset}
              value={configs[obsEditAsset.id] ?? { assetId: obsEditAsset.id, zabbixHostId: "", itemMappings: [], logSources: [] }}
              onCancel={() => setObsEditId(null)}
              onSave={(cfg) => saveObsConfig(obsEditAsset.id, cfg)}
            />
          )}
        </SheetContent>
      </Sheet>


      {/* 停用确认 */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认停用该资产？</AlertDialogTitle>
            <AlertDialogDescription>
              停用后不再纳入新的巡检范围，已有巡检、异常、分析和报告关联继续保留。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>确认停用</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">
        {required && <span className="text-destructive mr-0.5">*</span>}
        {label}
      </Label>
      {children}
    </div>
  );
}

function OwnerMultiSelect({ value, onChange }: { value: string[]; onChange: (ownerIds: string[]) => void }) {
  const options = users.filter((user) => user.status === "启用" || value.includes(user.id));

  const toggle = (userId: string) => {
    onChange(value.includes(userId) ? value.filter((id) => id !== userId) : [...value, userId]);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label="选择责任人"
          className="w-full justify-between font-normal"
        >
          <span className={value.length ? "truncate" : "text-muted-foreground"}>
            {value.length ? ownerNames(value) : "请选择责任人"}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[360px]">
        {options.map((user) => (
          <DropdownMenuCheckboxItem
            key={user.id}
            checked={value.includes(user.id)}
            onSelect={(event) => event.preventDefault()}
            onCheckedChange={() => toggle(user.id)}
            className="gap-2 py-2"
          >
            <span className="font-medium">{user.name}</span>
            <span className="font-mono text-xs text-muted-foreground">{user.account}</span>
            <StatusBadge tone={user.role === "系统管理员" ? "destructive" : user.role === "运维人员" ? "info" : "muted"}>
              {user.role}
            </StatusBadge>
            {user.status === "停用" && <span className="text-xs text-destructive">已停用</span>}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ItemPicker({
  value,
  items,
  label,
  onChange,
}: {
  value?: string;
  items: { id: string; label: string }[];
  label: string;
  onChange: (item?: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-label={label}
          aria-expanded={open}
          className="h-8 w-full justify-between px-2 font-mono text-xs font-normal"
        >
          <span className={value ? "truncate" : "truncate text-muted-foreground"}>
            {items.find((item) => item.id === value)?.label ?? "选择 Zabbix Item"}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[420px] p-0">
        <Command>
          <CommandInput placeholder="搜索 Zabbix Item" className="h-9" />
          <CommandList>
            <CommandEmpty>未找到匹配的 Item</CommandEmpty>
            <CommandGroup>
              {value && (
                <CommandItem
                  value="清除当前绑定"
                  onSelect={() => {
                    onChange(undefined);
                    setOpen(false);
                  }}
                >
                  <span className="text-muted-foreground">清除当前绑定</span>
                </CommandItem>
              )}
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.label}
                  onSelect={() => {
                    onChange(item.id);
                    setOpen(false);
                  }}
                >
                  <Check className={`mr-2 h-4 w-4 ${item.id === value ? "opacity-100" : "opacity-0"}`} />
                  <span className="font-mono text-xs">{item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/* ============ 观测配置编辑器：一个资产、一个 Host、一个巡检项对应一个 Item ============ */
function ObservationEditor({ asset, value, onCancel, onSave }: {
  asset: Asset;
  value: EditableConfig;
  onCancel: () => void;
  onSave: (cfg: EditableConfig) => void;
}) {
  const [hostId, setHostId] = useState(value.zabbixHostId ?? "");
  const [itemMappings, setItemMappings] = useState<MetricMapping[]>(value.itemMappings ?? []);
  const [logSources, setLogSources] = useState<LogSourceEntry[]>(
    value.logSources?.length ? value.logSources : recommendedLogsByType[asset.type].map((log) => ({ ...log })),
  );
  const [hostKeyword, setHostKeyword] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [customMetric, setCustomMetric] = useState({ name: "", zabbixItemId: "" });

  const definitions = inspectionItems.filter((item) => item.assetType === asset.type);
  const selectedHost = zabbixHosts.find((host) => host.id === hostId);
  const hostItems = zabbixItems.filter((item) => item.hostId === hostId);
  const filteredHosts = zabbixHostPool.filter((host) => !hostKeyword || host.name.includes(hostKeyword));

  const selectHost = (nextHostId: string) => {
    setHostId(nextHostId);
    setItemMappings(definitions.filter((item) => !item.optional).map((definition) => {
      const recommended = recommendedMetricsByType[asset.type].find((item) => item.name === definition.name);
      const zabbixItem = zabbixItems.find((item) => item.hostId === nextHostId && item.key === recommended?.suggestedItem);
      return { inspectionItemId: definition.id, zabbixItemId: zabbixItem?.id ?? "" };
    }));
    setEditingItemId(null);
  };

  const updateMapping = (inspectionItemId: string, nextZabbixItemId?: string) => {
    if (nextZabbixItemId && itemMappings.some((mapping) =>
      mapping.inspectionItemId !== inspectionItemId && mapping.zabbixItemId === nextZabbixItemId,
    )) {
      toast({ title: "无法重复绑定", description: "该 Item 已关联其他巡检项", variant: "destructive" });
      return;
    }
    setItemMappings((current) => current.map((mapping) =>
      mapping.inspectionItemId === inspectionItemId
        ? { ...mapping, zabbixItemId: nextZabbixItemId ?? "" }
        : mapping,
    ));
  };

  const addCustomMetric = () => {
    if (!hostId || !customMetric.name.trim() || !customMetric.zabbixItemId) {
      toast({ title: "请填写完整", description: "巡检项名称和 Zabbix Item 均为必填", variant: "destructive" });
      return;
    }
    if (itemMappings.some((mapping) => mapping.zabbixItemId === customMetric.zabbixItemId)) {
      toast({ title: "无法重复绑定", description: "该 Item 已关联其他巡检项", variant: "destructive" });
      return;
    }
    const definition = registerCustomInspectionItem({
      key: `custom_${Date.now()}`,
      name: customMetric.name.trim(),
      assetType: asset.type,
      description: "资产观测配置中创建的自定义巡检项",
      defaultWarn: "—",
      defaultCrit: "—",
    });
    setItemMappings((current) => [...current, {
      inspectionItemId: definition.id,
      zabbixItemId: customMetric.zabbixItemId,
    }]);
    setCustomMetric({ name: "", zabbixItemId: "" });
    setCustomOpen(false);
    toast({ title: "自定义巡检项已加入统一目录" });
  };

  const addLogSource = () => setLogSources((current) => [...current, {
    id: `log-${Date.now()}`,
    name: "新日志源",
    logType: "运行日志",
    filter: "",
    enabled: true,
  }]);
  const updateLog = (index: number, patch: Partial<LogSourceEntry>) =>
    setLogSources((current) => current.map((log, currentIndex) => currentIndex === index ? { ...log, ...patch } : log));
  const removeLog = (index: number) => setLogSources((current) => current.filter((_, currentIndex) => currentIndex !== index));

  const matchedCount = itemMappings.filter((mapping) => mapping.zabbixItemId).length;

  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="px-6 pt-6 pb-3 border-b">
        <SheetTitle className="text-base">编辑观测配置 · {asset.name}</SheetTitle>
        <SheetDescription className="text-sm font-normal">
          一个资产关联一个 Zabbix Host；每个巡检项只关联该 Host 下的一个 Item。日志源作为独立数据来源配置。
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 min-h-0">
        <section className="rounded-lg border bg-card">
          <header className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded bg-primary-soft flex items-center justify-center"><Server className="h-4 w-4 text-primary" /></div>
              <div>
                <h4 className="text-sm font-semibold">Zabbix Host 与巡检项映射</h4>
                <p className="text-sm text-muted-foreground">先选择 Host，再为巡检项确认对应 Item</p>
              </div>
            </div>
            {hostId && (
              <Button size="sm" variant="ghost" onClick={() => { setHostId(""); setItemMappings([]); }}>
                <Trash2 className="h-4 w-4 mr-1" />解除关联
              </Button>
            )}
          </header>

          <div className="px-4 py-3 space-y-3">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Label className="text-sm">Zabbix Host</Label>
                <Select value={hostId} onValueChange={selectHost}>
                  <SelectTrigger className="h-9 mt-1"><SelectValue placeholder="选择 Zabbix Host" /></SelectTrigger>
                  <SelectContent>
                    <div className="p-2 border-b">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input value={hostKeyword} onChange={(event) => setHostKeyword(event.target.value)}
                          placeholder="搜索 Host" className="h-8 pl-8" onClick={(event) => event.stopPropagation()} />
                      </div>
                    </div>
                    {filteredHosts.map((host) => (
                      <SelectItem key={host.id} value={host.id}>
                        <span className="font-mono">{host.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">{host.itemCount} Items</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedHost && (
                <div className="pb-2 text-sm text-muted-foreground">
                  共 {selectedHost.itemCount} 个 Item · {matchedCount}/{itemMappings.length} 已匹配
                </div>
              )}
            </div>

            {hostId ? (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[220px]">巡检项</TableHead>
                      <TableHead>关联的 Zabbix Item</TableHead>
                      <TableHead className="w-[90px]">状态</TableHead>
                      <TableHead className="w-[90px] text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itemMappings.map((mapping) => {
                      const definition = inspectionItems.find((item) => item.id === mapping.inspectionItemId);
                      const linkedItem = zabbixItems.find((item) => item.id === mapping.zabbixItemId);
                      const editing = editingItemId === mapping.inspectionItemId;
                      const selectableItems = hostItems
                        .filter((item) => item.id === mapping.zabbixItemId || !itemMappings.some((other) => other.zabbixItemId === item.id))
                        .map((item) => ({ id: item.id, label: item.key }));
                      return (
                        <TableRow key={mapping.inspectionItemId}>
                          <TableCell>
                            <div className="font-medium text-sm">{definition?.name ?? "未知巡检项"}</div>
                            <div className="text-sm text-muted-foreground">{definition?.description}</div>
                          </TableCell>
                          <TableCell>
                            {editing ? (
                              <ItemPicker value={mapping.zabbixItemId || undefined} items={selectableItems}
                                label={`选择 Zabbix Item - ${definition?.name ?? "巡检项"}`}
                                onChange={(itemId) => { updateMapping(mapping.inspectionItemId, itemId); setEditingItemId(null); }} />
                            ) : linkedItem ? (
                              <Badge variant="secondary" className="text-sm font-mono font-normal">{linkedItem.key}</Badge>
                            ) : <span className="text-sm text-muted-foreground">未匹配</span>}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center gap-1 text-sm ${linkedItem ? "text-success" : "text-warning"}`}>
                              {linkedItem ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                              {linkedItem ? "已匹配" : "未匹配"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <TableActions actions={[{
                              label: linkedItem ? "更换" : "配置",
                              onClick: () => setEditingItemId(editing ? null : mapping.inspectionItemId),
                            }]} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                <div className="border-t px-3 py-2 bg-muted/10">
                  <button type="button" className="text-primary text-sm hover:underline inline-flex items-center gap-1"
                    onClick={() => setCustomOpen((current) => !current)}>
                    <Plus className="h-4 w-4" />添加自定义巡检项
                  </button>
                </div>
                {customOpen && (
                  <div className="border-t px-3 py-3 flex gap-2 items-end">
                    <div className="flex-1">
                      <Label className="text-sm">巡检项名称</Label>
                      <Input value={customMetric.name} onChange={(event) => setCustomMetric((current) => ({ ...current, name: event.target.value }))}
                        placeholder="如：GC 停顿时长" className="h-9 mt-1" />
                    </div>
                    <div className="flex-1">
                      <Label className="text-sm">Zabbix Item</Label>
                      <div className="mt-1">
                        <ItemPicker value={customMetric.zabbixItemId || undefined}
                          items={hostItems.filter((item) => !itemMappings.some((mapping) => mapping.zabbixItemId === item.id)).map((item) => ({ id: item.id, label: item.key }))}
                          label="选择 Zabbix Item - 自定义巡检项"
                          onChange={(itemId) => setCustomMetric((current) => ({ ...current, zabbixItemId: itemId ?? "" }))} />
                      </div>
                    </div>
                    <Button size="sm" onClick={addCustomMetric}>添加</Button>
                    <Button size="sm" variant="outline" onClick={() => setCustomOpen(false)}>取消</Button>
                  </div>
                )}
              </div>
            ) : <EmptyHint text="尚未关联 Zabbix Host，请先选择" />}
          </div>
        </section>

        <section className="rounded-lg border bg-card">
          <header className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded bg-info/10 flex items-center justify-center"><FileText className="h-4 w-4 text-info" /></div>
              <div>
                <h4 className="text-sm font-semibold">日志源配置</h4>
                <p className="text-sm text-muted-foreground">已启用 {logSources.filter((log) => log.enabled).length} / {logSources.length}</p>
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={addLogSource}><Plus className="h-4 w-4 mr-1" />新增日志源</Button>
          </header>
          <div className="px-4 py-3 rounded-md overflow-hidden">
            <Table>
              <TableHeader><TableRow><TableHead>日志名称</TableHead><TableHead>日志类型</TableHead><TableHead>ES 索引 / 过滤条件</TableHead><TableHead className="w-[70px]">启用</TableHead><TableHead className="w-[50px]" /></TableRow></TableHeader>
              <TableBody>
                {logSources.map((log, index) => (
                  <TableRow key={log.id}>
                    <TableCell><Input value={log.name} onChange={(event) => updateLog(index, { name: event.target.value })} /></TableCell>
                    <TableCell>
                      <Select value={log.logType} onValueChange={(logType) => updateLog(index, { logType })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{logTypePresets.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell><Input value={log.filter} onChange={(event) => updateLog(index, { filter: event.target.value })} /></TableCell>
                    <TableCell><Switch checked={log.enabled} onCheckedChange={(enabled) => updateLog(index, { enabled })} /></TableCell>
                    <TableCell><TableActions actions={[{ label: "移除", onClick: () => removeLog(index) }]} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>

      <div className="border-t px-6 py-3 flex justify-end gap-2 bg-background">
        <Button variant="outline" size="sm" onClick={onCancel}>取消</Button>
        <Button size="sm" onClick={() => onSave({ assetId: asset.id, zabbixHostId: hostId, itemMappings, logSources })}>保存配置</Button>
      </div>
    </div>
  );
}



function AssetDetail({ asset, cfg, onEdit, onEditObs }: { asset: Asset; cfg?: EditableConfig; onEdit: () => void; onEditObs: () => void }) {
  const meta = typeMeta[asset.type];
  const Icon = meta.icon;
  const host = cfg ? zabbixHosts.find((candidate) => candidate.id === cfg.zabbixHostId) : undefined;
  const logSources = cfg?.logSources ?? [];

  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <div className={`h-9 w-9 rounded-lg ${meta.bg} flex items-center justify-center`}>
            <Icon className={`h-5 w-5 ${meta.color}`} />
          </div>
          <div>
            <div className="text-base">{asset.name}</div>
            <div className="text-xs text-muted-foreground font-normal">{asset.code} · {asset.type}</div>
          </div>
        </SheetTitle>
      </SheetHeader>

      <div className="mt-5 space-y-5">
        <Section title="基本信息">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <Info label="业务系统" value={asset.businessSystem} />
            <Info label="环境" value={asset.environment} />
            <Info label="观测配置" value={statusOf(cfg)} />
            <Info label="状态" value={asset.status} />
            <Info label="IP / 端口" value={`${asset.ip}${asset.port ? ` : ${asset.port}` : ""}`} />
            <Info
              label="责任人"
              value={ownerUsers(asset.ownerIds)
                .map((user) => `${user.name}（${user.account} · ${user.role}${user.status === "停用" ? " · 已停用" : ""}）`)
                .join("、") || "—"}
            />
            {asset.os && <Info label="操作系统" value={asset.os} />}
            {asset.location && <Info label="机房位置" value={asset.location} />}
            {asset.spec && <Info label="规格" value={asset.spec} />}
            {asset.dbType && <Info label="数据库类型" value={asset.dbType} />}
            {asset.dbInstance && <Info label="实例名" value={asset.dbInstance} />}
            {asset.dbSchema && <Info label="Schema" value={asset.dbSchema} />}
            {asset.dbRole && <Info label="角色" value={asset.dbRole} />}
            {asset.serviceType && <Info label="服务类型" value={asset.serviceType} />}
            {asset.serviceCode && <Info label="服务编码" value={asset.serviceCode} />}
            {asset.serviceUrl && <Info label="访问地址" value={asset.serviceUrl} />}
            {asset.mwType && <Info label="中间件类型" value={asset.mwType} />}
            {asset.mwVersion && <Info label="版本" value={asset.mwVersion} />}
          </div>
        </Section>

        <Section title={<span className="flex items-center gap-1.5"><Activity className="h-4 w-4 text-primary" />Zabbix Host / Item 映射</span>}>
          {host && cfg ? (
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-sm text-primary">{host.name}</span>
                <span className="text-sm text-muted-foreground">{cfg.itemMappings.filter((mapping) => mapping.zabbixItemId).length}/{cfg.itemMappings.length} 已匹配</span>
              </div>
              <div className="space-y-1.5">
                {cfg.itemMappings.map((mapping) => {
                  const definition = inspectionItems.find((item) => item.id === mapping.inspectionItemId);
                  const item = zabbixItems.find((candidate) => candidate.id === mapping.zabbixItemId);
                  return (
                    <div key={mapping.inspectionItemId} className="flex items-start justify-between gap-2 text-sm">
                      <span className="text-foreground/90 flex-shrink-0">{definition?.name ?? "未知巡检项"}</span>
                      <span className="text-muted-foreground font-mono text-right truncate">{item?.key ?? "未匹配"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <EmptyHint text="尚未关联 Zabbix Host" />
          )}
        </Section>

        <Section title={<span className="flex items-center gap-1.5"><FileText className="h-4 w-4 text-info" />ES 日志源</span>}>
          {logSources.length ? (
            <div className="space-y-1.5">
              {logSources.map((l, i) => (
                <div key={i} className="flex items-center justify-between rounded-md border bg-card px-2.5 py-1.5 gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-xs font-medium truncate">{l.name}</span>
                    <Badge variant="outline" className="text-sm font-normal">{l.logType}</Badge>
                  </div>
                  <span className="text-sm text-muted-foreground font-mono truncate">{l.filter || "—"}</span>
                  <span className={`text-sm ${l.enabled ? "text-success" : "text-muted-foreground"}`}>
                    {l.enabled ? "启用" : "停用"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyHint text="尚未配置日志源" />
          )}
        </Section>

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-1" />编辑资产
          </Button>
          <Button variant="outline" size="sm" onClick={onEditObs}>
            <Settings2 className="h-4 w-4 mr-1" />观测配置
          </Button>
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-sm font-semibold mb-2 text-foreground/90">{title}</h3>
      {children}
    </section>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground/90">{value}</span>
    </div>
  );
}
function EmptyHint({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">{text}</div>;
}
