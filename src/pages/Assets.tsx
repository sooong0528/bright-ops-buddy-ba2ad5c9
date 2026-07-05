import { useState, useMemo } from "react";
import { Server, Database, Layers, Package, Search, Plus, Settings2, Activity, FileText, Pencil, Trash2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { assets as initialAssets, observationConfigs, type Asset, type AssetType, type Environment } from "@/lib/mockData";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const typeMeta: Record<AssetType, { icon: any; color: string; bg: string }> = {
  主机: { icon: Server, color: "text-primary", bg: "bg-primary-soft" },
  数据库: { icon: Database, color: "text-info", bg: "bg-info/10" },
  应用服务: { icon: Layers, color: "text-success", bg: "bg-success/10" },
  中间件: { icon: Package, color: "text-warning", bg: "bg-warning/10" },
};

const assetTypes: AssetType[] = ["主机", "数据库", "应用服务", "中间件"];
const environments: Environment[] = ["生产", "预生产", "测试"];

function computeObservationStatus(assetId: string): Asset["observationStatus"] {
  const cfg = observationConfigs[assetId];
  if (!cfg) return "未配置";
  const hasItems = (cfg.items?.length ?? 0) > 0;
  const hasLogs = (cfg.logSources?.length ?? 0) > 0;
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
  owner: "",
  description: "",
  observationStatus: "未配置",
};

export default function Assets() {
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [tab, setTab] = useState<"全部" | AssetType>("全部");
  const [keyword, setKeyword] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => assets.filter((a) => {
    if (tab !== "全部" && a.type !== tab) return false;
    if (keyword && ![a.name, a.code, a.ip, a.businessSystem].some((s) => s?.includes(keyword))) return false;
    return true;
  }), [tab, keyword, assets]);

  const selected = openId ? assets.find((a) => a.id === openId) ?? null : null;

  const counts = useMemo(() => ({
    主机: assets.filter((a) => a.type === "主机").length,
    数据库: assets.filter((a) => a.type === "数据库").length,
    应用服务: assets.filter((a) => a.type === "应用服务").length,
    中间件: assets.filter((a) => a.type === "中间件").length,
  }), [assets]);

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
    if (!form.code?.trim() || !form.name?.trim() || !form.ip?.trim() || !form.businessSystem?.trim() || !form.owner?.trim()) {
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
    setAssets((prev) => prev.filter((a) => a.id !== deleteId));
    if (openId === deleteId) setOpenId(null);
    setDeleteId(null);
    toast({ title: "已删除", description: target ? `${target.name} 已从资产列表移除` : undefined });
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(Object.keys(counts) as AssetType[]).map((t) => {
          const meta = typeMeta[t];
          const Icon = meta.icon;
          return (
            <div key={t} className="panel p-4 flex items-center gap-3">
              <div className={`h-11 w-11 rounded-lg ${meta.bg} flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${meta.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t}</p>
                <p className="text-2xl font-bold tabular-nums leading-tight">{counts[t]}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
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
              const obsTone = a.observationStatus === "已配置" ? "success" : a.observationStatus === "部分配置" ? "warning" : "muted";
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
                  <TableCell className="text-sm text-muted-foreground">{a.owner}</TableCell>
                  <TableCell><StatusBadge tone={obsTone} dot>{a.observationStatus}</StatusBadge></TableCell>
                  <TableCell className="text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="ghost" onClick={() => setOpenId(a.id)}>
                      <Settings2 className="h-4 w-4 mr-1" />观测配置
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(a)}>
                      <Pencil className="h-4 w-4 mr-1" />编辑
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(a.id)}>
                      <Trash2 className="h-4 w-4 mr-1" />删除
                    </Button>
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
          {selected && <AssetDetail asset={selected} onEdit={() => { setOpenId(null); openEdit(selected); }} />}
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
              <Input value={form.owner ?? ""} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
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

      {/* 删除确认 */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除该资产？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后将同时移除其在列表中的展示，此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">确认删除</AlertDialogAction>
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

function AssetDetail({ asset, onEdit }: { asset: Asset; onEdit: () => void }) {
  const cfg = observationConfigs[asset.id];
  const meta = typeMeta[asset.type];
  const Icon = meta.icon;

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
            <Info label="重要性" value={asset.importance} />
            <Info label="状态" value={asset.status} />
            <Info label="IP / 端口" value={`${asset.ip}${asset.port ? ` : ${asset.port}` : ""}`} />
            <Info label="责任人" value={asset.owner} />
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

        <Section title={<span className="flex items-center gap-1.5"><Activity className="h-4 w-4 text-primary" />Zabbix 观测项</span>}>
          {cfg ? (
            <div className="rounded-lg border bg-card">
              <div className="px-3 py-2 border-b text-xs text-muted-foreground">映射 Zabbix Host：<span className="text-foreground font-mono">{cfg.zabbixHost}</span></div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>指标</TableHead>
                    <TableHead>Zabbix Key</TableHead>
                    <TableHead>关注 / 异常阈值</TableHead>
                    <TableHead>观察窗口</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cfg.items.map((it) => (
                    <TableRow key={it.key}>
                      <TableCell className="text-sm font-medium">{it.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{it.key}</TableCell>
                      <TableCell className="text-xs">≥ <span className="text-warning">{it.warn}</span> / ≥ <span className="text-destructive">{it.crit}</span></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{it.window}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyHint text="尚未配置 Zabbix 观测项" />
          )}
        </Section>

        <Section title={<span className="flex items-center gap-1.5"><FileText className="h-4 w-4 text-info" />日志观测（Filebeat + ES）</span>}>
          {cfg && cfg.logSources.length ? (
            <div className="space-y-2">
              {cfg.logSources.map((l, i) => (
                <div key={i} className="rounded-lg border bg-card p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-primary">{l.source}</span>
                    <StatusBadge tone="muted">{l.logType}</StatusBadge>
                  </div>
                  <div className="text-muted-foreground">路径：<span className="font-mono text-foreground/80">{l.path}</span></div>
                  <div className="text-muted-foreground">窗口：{l.window} · 关键字：<span className="text-foreground/80">{l.keywords.join("、")}</span></div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyHint text="尚未配置日志观测源" />
          )}
        </Section>

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-1" />编辑资产
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast({ title: "编辑观测配置", description: "Demo 环境暂未开放" })}>
            <Settings2 className="h-4 w-4 mr-1" />编辑观测配置
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
