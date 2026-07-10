import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Database, FileSearch, Link2, ListChecks, Server, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import {
  detectableMetrics,
  opsAssets,
  type DetectableMetric,
  type OpsAsset,
} from "@/lib/mockData";
import { useOpsData, zabbixHostOptions, type ObservationMapping } from "@/lib/opsDataStore";
import { toast } from "sonner";

export default function ObservationConfig() {
  const navigate = useNavigate();
  const { assets, observationMappings, saveObservationMapping } = useOpsData();
  const [selectedAsset, setSelectedAsset] = useState<OpsAsset | null>(null);
  const rows = useMemo(() => assets.filter((asset) => asset.type !== "日志源"), [assets]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SourceCard
          icon={Activity}
          title="Zabbix 指标源"
          status="已连接"
          description="用于获取主机、数据库等资产的 Zabbix Host 与 Item 指标。"
          meta="最近同步：2026-06-26 10:20"
          onTest={() => toast.success("Zabbix 连接正常，已获取 Host 与 Item 示例数据")}
        />
        <SourceCard
          icon={Database}
          title="ES 日志库"
          status="已连接"
          description="Filebeat + ES 为系统内置通道，按资产日志定位信息检索日志。"
          meta="最近同步：2026-06-26 10:18"
          onTest={() => toast.success("ES 日志库连接正常，可按资产日志定位信息检索")}
        />
      </div>

      <div className="panel">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-info-soft text-info flex items-center justify-center">
              <Settings2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold">观测配置</h2>
              <p className="text-xs text-muted-foreground mt-0.5">把资产与 Zabbix 指标项、ES 日志源关联起来，供巡检配置和故障分析复用</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => toast.success("已同步 Zabbix Host、Item 与日志源状态")}>同步观测项</Button>
            <Button size="sm" variant="outline" onClick={() => navigate("/inspection-admin")}>去巡检配置</Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>资产对象</TableHead>
              <TableHead>资产类型</TableHead>
              <TableHead>业务系统</TableHead>
              <TableHead>指标源状态</TableHead>
              <TableHead>日志源状态</TableHead>
              <TableHead>可用观测项</TableHead>
              <TableHead>最近同步</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((asset) => {
              const metrics = metricsForAsset(asset);
              const mapping = observationMappings.find((item) => item.assetId === asset.id);
              const logSources = logSourcesForAsset(asset, assets).filter((item) => mapping?.logSourceIds.includes(item.id));
              return (
                <TableRow key={asset.id} className="hover:bg-secondary/40">
                  <TableCell>
                    <div className="font-medium">{asset.name}</div>
                    <div className="text-xs text-muted-foreground">{asset.ip}{asset.port ? `:${asset.port}` : ""}</div>
                  </TableCell>
                  <TableCell><StatusBadge tone="info">{asset.type}</StatusBadge></TableCell>
                  <TableCell>{asset.systemName}</TableCell>
                  <TableCell>
                    <StatusBadge tone={mapping?.zabbixHostId ? "success" : "warning"}>{mapping?.zabbixHostId ? "已映射" : "未映射"}</StatusBadge>
                    <div className="mt-1 text-xs text-muted-foreground">{mapping?.zabbixHostId || "待选择 Zabbix Host"}</div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge tone={logSources.length > 0 ? "success" : "warning"}>{logSources.length > 0 ? "已关联" : "未关联"}</StatusBadge>
                    <div className="mt-1 text-xs text-muted-foreground">{logSources.length > 0 ? `${logSources.length} 个日志源` : "待关联日志源"}</div>
                  </TableCell>
                  <TableCell className="tabular-nums">{(mapping?.metricIds.length ?? metrics.length) + logSources.length} 项</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{mapping?.lastSyncedAt ?? asset.lastUpdatedAt}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" onClick={() => setSelectedAsset(asset)}>
                      配置观测项
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ObservationSheet
        asset={selectedAsset}
        assets={assets}
        mapping={selectedAsset ? observationMappings.find((item) => item.assetId === selectedAsset.id) : undefined}
        onSave={saveObservationMapping}
        onClose={() => setSelectedAsset(null)}
      />
    </div>
  );
}

function ObservationSheet({
  asset,
  assets,
  mapping,
  onSave,
  onClose,
}: {
  asset: OpsAsset | null;
  assets: OpsAsset[];
  mapping?: ObservationMapping;
  onSave: (mapping: ObservationMapping) => void;
  onClose: () => void;
}) {
  const metrics = asset ? metricsForAsset(asset) : [];
  const logSources = asset ? logSourcesForAsset(asset, assets) : [];
  const [draft, setDraft] = useState<ObservationMapping | null>(null);
  const selectedHost = zabbixHostOptions.find((host) => host.hostId === draft?.zabbixHostId);

  useEffect(() => {
    if (!asset) return;
    setDraft(mapping ?? {
      assetId: asset.id,
      zabbixHostId: asset.zabbixHostId,
      zabbixHostName: asset.monitoringObjectName,
      metricIds: metrics.map((item) => item.id),
      logSourceIds: logSources.map((item) => item.id),
      lastSyncedAt: asset.lastUpdatedAt,
    });
  }, [asset, mapping]);

  function toggleMetric(metricId: string) {
    if (!draft) return;
    setDraft({
      ...draft,
      metricIds: draft.metricIds.includes(metricId)
        ? draft.metricIds.filter((item) => item !== metricId)
        : [...draft.metricIds, metricId],
    });
  }

  function toggleLogSource(logSourceId: string) {
    if (!draft) return;
    setDraft({
      ...draft,
      logSourceIds: draft.logSourceIds.includes(logSourceId)
        ? draft.logSourceIds.filter((item) => item !== logSourceId)
        : [...draft.logSourceIds, logSourceId],
    });
  }

  function save() {
    if (!draft) return;
    onSave({ ...draft, lastSyncedAt: "2026-06-26 10:45" });
    toast.success("观测配置已保存");
    onClose();
  }

  function autoDetect() {
    if (!asset || !draft) return;
    const matchedHost = zabbixHostOptions.find((host) => host.ip === asset.ip || host.hostName === asset.hostName) ?? zabbixHostOptions[0];
    setDraft({
      ...draft,
      zabbixHostId: matchedHost.hostId,
      zabbixHostName: matchedHost.hostName,
      metricIds: metrics.map((item) => item.id),
      logSourceIds: logSources.map((item) => item.id),
    });
    toast.success("AI 已根据 IP、主机名、资产类型和日志路径推荐观测关联");
  }

  return (
    <Sheet open={!!asset} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-3xl w-full overflow-y-auto">
        {asset && (
          <>
            <SheetHeader className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <SheetTitle className="text-lg">{asset.name}</SheetTitle>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={autoDetect}>AI 自动识别并关联</Button>
                  <Button size="sm" onClick={save}>保存观测配置</Button>
                </div>
              </div>
              <SheetDescription>选择 Zabbix Host，通过多选下拉关联指标项和日志源；数据量大时可先用 AI 自动识别推荐。</SheetDescription>
            </SheetHeader>

            <div className="mt-5 rounded-lg border border-primary/20 bg-primary-soft/30 p-3">
              <div className="text-sm font-medium">配置步骤</div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                <div className="rounded-md bg-card px-2 py-1.5">1. 选择 Zabbix Host</div>
                <div className="rounded-md bg-card px-2 py-1.5">2. 下拉多选 Zabbix Item</div>
                <div className="rounded-md bg-card px-2 py-1.5">3. 下拉多选日志源并保存</div>
              </div>
            </div>

            <Section title="1. 指标源映射" icon={Link2} />
            <div className="rounded-lg border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">选择该资产对应的 Zabbix Host</div>
                  <div className="text-xs text-muted-foreground mt-1">Zabbix Item 会从当前 Host 下加载，先选 Host 再关联指标项。</div>
                </div>
                <Select
                  value={draft?.zabbixHostId || "none"}
                  onValueChange={(value) => {
                    const host = zabbixHostOptions.find((item) => item.hostId === value);
                    if (!draft || !host) return;
                    setDraft({ ...draft, zabbixHostId: host.hostId, zabbixHostName: host.hostName });
                  }}
                >
                  <SelectTrigger aria-label="Zabbix Host">
                    <SelectValue placeholder="选择 Zabbix Host" />
                  </SelectTrigger>
                  <SelectContent>
                    {zabbixHostOptions.map((host) => (
                      <SelectItem key={host.hostId} value={host.hostId}>{host.hostName} · {host.ip}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <Info label="Host ID" value={draft?.zabbixHostId || "未映射"} />
                <Info label="Host 名称" value={selectedHost?.hostName ?? draft?.zabbixHostName ?? "未映射"} />
                <Info label="Host IP" value={selectedHost?.ip ?? asset.ip} />
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <StatusBadge tone={draft?.zabbixHostId ? "success" : "warning"}>{draft?.zabbixHostId ? "已选择 Host" : "待选择 Host"}</StatusBadge>
                <span>最近同步：{draft?.lastSyncedAt ?? asset.lastUpdatedAt}</span>
              </div>
            </div>

            <Section title="2. 当前 Host 下的 Zabbix Item" icon={ListChecks} />
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">已关联指标项</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {draft?.zabbixHostId ? `候选项来自 ${selectedHost?.hostName ?? draft.zabbixHostName}，用于巡检和故障分析。` : "请先选择 Zabbix Host，系统再加载该 Host 下的 Item。"}
                  </div>
                </div>
                <MultiSelectButton label="选择 Zabbix Item" count={draft?.metricIds.length ?? 0} disabled={!draft?.zabbixHostId}>
                  {metrics.map((metric) => (
                    <DropdownMenuCheckboxItem
                      key={metric.id}
                      checked={draft?.metricIds.includes(metric.id) ?? false}
                      onCheckedChange={() => toggleMetric(metric.id)}
                      onSelect={(event) => event.preventDefault()}
                    >
                      <span>{metric.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{metric.sourceIdentifier}</span>
                    </DropdownMenuCheckboxItem>
                  ))}
                </MultiSelectButton>
              </div>
            </div>
            <div className="mt-3 rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>已选观测项</TableHead>
                    <TableHead>来源标识</TableHead>
                    <TableHead>默认阈值</TableHead>
                    <TableHead>缺项策略</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.filter((metric) => draft?.metricIds.includes(metric.id)).map((metric) => (
                    <TableRow key={metric.id}>
                      <TableCell>
                        <div className="font-medium">{metric.name}</div>
                        <div className="text-xs text-muted-foreground">{metric.dataSource} · {metric.unit}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{metric.sourceIdentifier}</TableCell>
                      <TableCell className="text-xs">关注 {metric.attentionThreshold} / 异常 {metric.abnormalThreshold}</TableCell>
                      <TableCell><StatusBadge tone="warning">{metric.missingPolicy}</StatusBadge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Section title="3. 关联日志源" icon={FileSearch} />
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">已关联日志源</div>
                  <div className="text-xs text-muted-foreground mt-1">从日志源候选中选择故障分析需要回查的日志路径</div>
                </div>
                <MultiSelectButton label="选择日志源" count={draft?.logSourceIds.length ?? 0}>
                  {logSources.map((log) => (
                    <DropdownMenuCheckboxItem
                      key={log.id}
                      checked={draft?.logSourceIds.includes(log.id) ?? false}
                      onCheckedChange={() => toggleLogSource(log.id)}
                      onSelect={(event) => event.preventDefault()}
                    >
                      <span>{log.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{log.logPath}</span>
                    </DropdownMenuCheckboxItem>
                  ))}
                </MultiSelectButton>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {logSources.length === 0 ? (
                <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">暂无关联日志源</div>
              ) : logSources.filter((log) => draft?.logSourceIds.includes(log.id)).map((log) => (
                <div key={log.id} className="rounded-lg border bg-card p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium">{log.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {log.applicationName ?? log.systemName} · {log.ip} · {log.hostName ?? "未填主机名"} · {log.logPath}
                      </div>
                    </div>
                    <StatusBadge tone="info">{log.logType ?? "日志源"}</StatusBadge>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    检索窗口：{log.defaultLogWindow ?? "按异常时间窗口"}；关注关键词：{log.logKeywords?.join("、") || "未配置"}
                  </div>
                </div>
              ))}
            </div>

            <Section title="可用于巡检配置的观测项" icon={Server} />
            <div className="flex flex-wrap gap-2">
              {[...metrics.filter((item) => draft?.metricIds.includes(item.id)).map((item) => item.name), ...logSources.filter((item) => draft?.logSourceIds.includes(item.id)).map((item) => `${item.name} 关键字命中`)].map((name) => (
                <span key={name} className="rounded-md bg-secondary px-2 py-1 text-xs">{name}</span>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>取消</Button>
              <Button variant="outline" onClick={autoDetect}>AI 自动识别并关联</Button>
              <Button onClick={save}>保存观测配置</Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function metricsForAsset(asset: OpsAsset): DetectableMetric[] {
  return detectableMetrics.filter((metric) => metric.assetType === asset.type && metric.status === "启用");
}

function logSourcesForAsset(asset: OpsAsset, assets: OpsAsset[]): OpsAsset[] {
  return assets.filter((item) =>
    item.type === "日志源" && (item.relatedAssetId === asset.id || item.ip === asset.ip || item.systemName === asset.systemName),
  );
}

function SourceCard({ icon: Icon, title, status, description, meta, onTest }: { icon: typeof Activity; title: string; status: string; description: string; meta: string; onTest: () => void }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold">{title}</div>
            <div className="mt-1 text-xs text-muted-foreground">{description}</div>
          </div>
        </div>
        <StatusBadge tone="success">{status}</StatusBadge>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">{meta}</div>
        <Button size="sm" variant="outline" onClick={onTest}>测试连接</Button>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title }: { icon: typeof Activity; title: string }) {
  return (
    <div className="mt-6 mb-3 flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <h3 className="text-sm font-semibold">{title}</h3>
    </div>
  );
}

function MultiSelectButton({ label, count, disabled, children }: { label: string; count: number; disabled?: boolean; children: ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="min-w-[168px] justify-between" disabled={disabled}>
          <span>{label}</span>
          <span className="text-xs text-muted-foreground">已选 {count}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[420px] max-h-[320px] overflow-y-auto">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-1 break-all">{value}</p>
    </div>
  );
}
