import { useState, useMemo } from "react";
import { Boxes, Server, Database, Layers, Package, Search, Plus, Settings2, Activity, FileText } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { assets, observationConfigs, type Asset, type AssetType } from "@/lib/mockData";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

const typeMeta: Record<AssetType, { icon: any; color: string; bg: string }> = {
  主机: { icon: Server, color: "text-primary", bg: "bg-primary-soft" },
  数据库: { icon: Database, color: "text-info", bg: "bg-info/10" },
  应用服务: { icon: Layers, color: "text-success", bg: "bg-success/10" },
  中间件: { icon: Package, color: "text-warning", bg: "bg-warning/10" },
};

export default function Assets() {
  const [tab, setTab] = useState<"全部" | AssetType>("全部");
  const [keyword, setKeyword] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => assets.filter((a) => {
    if (tab !== "全部" && a.type !== tab) return false;
    if (keyword && ![a.name, a.code, a.ip, a.businessSystem].some((s) => s?.includes(keyword))) return false;
    return true;
  }), [tab, keyword]);

  const selected = openId ? assets.find((a) => a.id === openId) ?? null : null;

  const counts = useMemo(() => ({
    主机: assets.filter((a) => a.type === "主机").length,
    数据库: assets.filter((a) => a.type === "数据库").length,
    应用服务: assets.filter((a) => a.type === "应用服务").length,
    中间件: assets.filter((a) => a.type === "中间件").length,
  }), []);

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
          <Button size="sm" onClick={() => toast({ title: "新建资产", description: "Demo 环境暂未开放录入" })}>
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
              <TableHead>重要性</TableHead>
              <TableHead>责任人</TableHead>
              <TableHead>观测配置</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
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
                  <TableCell><StatusBadge tone={a.importance === "核心" ? "destructive" : a.importance === "重要" ? "warning" : "muted"}>{a.importance}</StatusBadge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{a.owner}</TableCell>
                  <TableCell><StatusBadge tone={obsTone} dot>{a.observationStatus}</StatusBadge></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setOpenId(a.id); }}>
                      <Settings2 className="h-4 w-4 mr-1" />观测配置
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selected && <AssetDetail asset={selected} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function AssetDetail({ asset }: { asset: Asset }) {
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
