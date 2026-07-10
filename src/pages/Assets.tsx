import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Download, FileUp, Pencil, Plus, Search, Server, ShieldCheck, SlidersHorizontal, Trash2, Workflow } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import {
  abnormalRecords,
  faultAnalysisTasks,
  inspectionTemplates,
  users,
  type OpsAsset,
  type OpsAssetType,
} from "@/lib/mockData";
import { useOpsData, zabbixHostOptions } from "@/lib/opsDataStore";

type OnboardingPanel = "import" | "template" | null;
type AssetFormMode = "create" | "edit";
type AssetFormState = {
  id?: string;
  type: OpsAssetType;
  name: string;
  systemName: string;
  ip: string;
  hostName: string;
  port: string;
  databaseType: string;
  instanceName: string;
  serviceName: string;
  relatedAssetId: string;
  applicationName: string;
  logPath: string;
  logType: string;
  defaultLogWindow: string;
  logKeywords: string;
  responsibleUserIds: string[];
  zabbixHostId: string;
  description: string;
};

export default function Assets() {
  const navigate = useNavigate();
  const { assets: assetList, saveAsset: saveAssetToStore, deleteAsset: deleteAssetFromStore } = useOpsData();
  const [keyword, setKeyword] = useState("");
  const [detailAsset, setDetailAsset] = useState<OpsAsset | null>(null);
  const [onboardingPanel, setOnboardingPanel] = useState<OnboardingPanel>(null);
  const [formMode, setFormMode] = useState<AssetFormMode | null>(null);
  const [draft, setDraft] = useState<AssetFormState>(() => createEmptyDraft());
  const [deleteAsset, setDeleteAsset] = useState<OpsAsset | null>(null);

  const filtered = useMemo(() => {
    const value = keyword.trim().toLowerCase();
    if (!value) return assetList;
    return assetList.filter((asset) =>
      [asset.systemName, asset.name, asset.ip, asset.hostName, asset.applicationName, asset.port, asset.logPath, asset.owner, asset.type, asset.monitoringObjectName, asset.zabbixHostId]
        .filter(Boolean)
        .some((item) => item!.toLowerCase().includes(value)),
    );
  }, [assetList, keyword]);

  const stats = useMemo(() => ({
    total: assetList.length,
    systems: new Set(assetList.map((asset) => asset.systemName)).size,
    owners: new Set(assetList.flatMap((asset) => asset.notifyUserIds)).size,
    onboarded: assetList.filter((asset) => asset.onboardingStatus === "已纳管").length,
  }), [assetList]);

  function openCreateForm() {
    setDraft(createEmptyDraft());
    setFormMode("create");
  }

  function openEditForm(asset: OpsAsset) {
    setDraft(createDraftFromAsset(asset));
    setFormMode("edit");
    setDetailAsset(null);
  }

  function saveAsset() {
    const asset = buildAssetFromDraft(draft, formMode, assetList.find((item) => item.id === draft.id));
    if (!asset) return;
    saveAssetToStore(asset);
    setFormMode(null);
  }

  function confirmDeleteAsset() {
    if (!deleteAsset) return;
    deleteAssetFromStore(deleteAsset.id);
    if (detailAsset?.id === deleteAsset.id) setDetailAsset(null);
    setDeleteAsset(null);
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="资产总数" value={stats.total} />
        <Stat label="业务系统" value={stats.systems} />
        <Stat label="运维责任人" value={stats.owners} />
        <Stat label="已纳管" value={stats.onboarded} success />
      </div>

      <div className="panel">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-info-soft text-info flex items-center justify-center">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold">资产管理</h2>
              <p className="text-xs text-muted-foreground mt-0.5">维护试点资产、监控对象映射、日志来源和责任人，用于巡检、故障分析和报告追溯</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={openCreateForm}>
              <Plus className="h-4 w-4" />
              新增资产
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate("/observation-config")}>
              去观测配置
            </Button>
            <Button size="sm" variant="outline" onClick={() => setOnboardingPanel("import")}>
              <FileUp className="h-4 w-4" />
              导入资产映射表
            </Button>
            <Button size="sm" variant="outline" onClick={() => setOnboardingPanel("template")}>
              <Download className="h-4 w-4" />
              下载模板
            </Button>
            <div className="relative min-w-[280px]">
              <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索系统 / 资产 / 来源 / 运维责任人" className="h-9 pl-8" />
            </div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>业务系统</TableHead>
              <TableHead>资产类型</TableHead>
              <TableHead>资产对象</TableHead>
              <TableHead>IP / IP:端口</TableHead>
              <TableHead>日志定位</TableHead>
              <TableHead>纳管状态</TableHead>
              <TableHead>运维责任人</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((asset) => (
              <TableRow key={asset.id} className="hover:bg-secondary/40">
                <TableCell className="font-medium">{asset.systemName}</TableCell>
                <TableCell><StatusBadge tone="info">{asset.type}</StatusBadge></TableCell>
                <TableCell>
                  <div className="text-sm">{asset.name}</div>
                  <div className="text-xs text-muted-foreground">{asset.logType ?? asset.databaseType ?? asset.hostName ?? "部署主机"}</div>
                </TableCell>
                <TableCell className="font-mono text-xs">{assetEndpoint(asset)}</TableCell>
                <TableCell>
                  <div className="text-sm">{logLocationLabel(asset)}</div>
                  <div className="text-xs text-muted-foreground">{asset.defaultLogWindow ?? "按异常时间窗口"}</div>
                </TableCell>
                <TableCell>
                  <StatusBadge tone={statusTone(asset.onboardingStatus)}>{asset.onboardingStatus}</StatusBadge>
                  <div className="mt-1 text-xs text-muted-foreground">{asset.onboardingSource}</div>
                </TableCell>
                <TableCell>{responsibleNames(asset).join("、")}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => setDetailAsset(asset)}>
                    查看详情
                  </Button>
                    <Button size="sm" variant="outline" onClick={() => openEditForm(asset)}>
                      <Pencil className="h-3.5 w-3.5" />
                      编辑
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setDeleteAsset(asset)}>
                      <Trash2 className="h-3.5 w-3.5" />
                      删除
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AssetDetailSheet asset={detailAsset} onClose={() => setDetailAsset(null)} />
      <AssetFormSheet
        mode={formMode}
        draft={draft}
        onDraftChange={setDraft}
        onClose={() => setFormMode(null)}
        onSubmit={saveAsset}
        assets={assetList}
      />
      <OnboardingSheet active={onboardingPanel} onClose={() => setOnboardingPanel(null)} />
      <AlertDialog open={!!deleteAsset} onOpenChange={(open) => !open && setDeleteAsset(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除资产</AlertDialogTitle>
            <AlertDialogDescription>
              删除后当前前端列表中将不再显示“{deleteAsset?.name}”。原型不执行真实后台删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAsset}>确认删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AssetFormSheet({
  mode,
  draft,
  onDraftChange,
  onClose,
  onSubmit,
  assets,
}: {
  mode: AssetFormMode | null;
  draft: AssetFormState;
  onDraftChange: (draft: AssetFormState) => void;
  onClose: () => void;
  onSubmit: () => void;
  assets: OpsAsset[];
}) {
  const opsUsers = users.filter((user) => user.role === "运维人员");
  const selectedHost = zabbixHostOptions.find((host) => host.hostId === draft.zabbixHostId);

  function patchDraft(patch: Partial<AssetFormState>) {
    onDraftChange({ ...draft, ...patch });
  }

  function toggleResponsibleUser(userId: string) {
    const exists = draft.responsibleUserIds.includes(userId);
    patchDraft({
      responsibleUserIds: exists
        ? draft.responsibleUserIds.filter((id) => id !== userId)
        : [...draft.responsibleUserIds, userId],
    });
  }

  return (
    <Sheet open={!!mode} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-2xl w-full overflow-y-auto">
        {mode && (
          <>
            <SheetHeader className="space-y-2">
              <SheetTitle className="text-lg">{mode === "create" ? "新增资产" : "编辑资产"}</SheetTitle>
              <SheetDescription>
                维护资产档案、部署信息和证据定位；巡检指标和技术采集通道仍在巡检配置或系统内置能力中维护。
              </SheetDescription>
            </SheetHeader>

            <div className="mt-5 space-y-5">
              <div>
                <SectionTitle icon={Server} title="资产档案" />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="资产名称" id="asset-name">
                    <Input id="asset-name" value={draft.name} onChange={(event) => patchDraft({ name: event.target.value })} />
                  </Field>
                  <Field label="业务系统" id="asset-system">
                    <Input id="asset-system" value={draft.systemName} onChange={(event) => patchDraft({ systemName: event.target.value })} />
                  </Field>
                  <Field label="资产类型">
                    <Select value={draft.type} onValueChange={(value) => patchDraft({ type: value as OpsAssetType })}>
                      <SelectTrigger aria-label="资产类型">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="主机">主机</SelectItem>
                        <SelectItem value="数据库">数据库</SelectItem>
                        <SelectItem value="日志源">日志源</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="运维责任人">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          aria-label="运维责任人"
                          className="w-full justify-between px-3 font-normal"
                        >
                          <span className="truncate">{selectedResponsibleLabel(draft.responsibleUserIds)}</span>
                          <span className="text-xs text-muted-foreground">多选</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-[320px]">
                        {opsUsers.map((user) => (
                          <DropdownMenuCheckboxItem
                            key={user.id}
                            checked={draft.responsibleUserIds.includes(user.id)}
                            onCheckedChange={() => toggleResponsibleUser(user.id)}
                            onSelect={(event) => event.preventDefault()}
                          >
                            <span>{user.name}</span>
                            <span className="ml-2 text-xs text-muted-foreground">{user.phone}</span>
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </Field>
                </div>
              </div>

              <div>
                <SectionTitle icon={SlidersHorizontal} title="部署信息" />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="IP" id="asset-ip">
                    <Input id="asset-ip" value={draft.ip} onChange={(event) => patchDraft({ ip: event.target.value })} />
                  </Field>
                  <Field label="主机名称" id="asset-host-name">
                    <Input id="asset-host-name" value={draft.hostName} onChange={(event) => patchDraft({ hostName: event.target.value })} />
                  </Field>
                  {draft.type === "数据库" && (
                    <>
                      <Field label="端口" id="asset-port">
                        <Input id="asset-port" value={draft.port} onChange={(event) => patchDraft({ port: event.target.value })} />
                      </Field>
                      <Field label="数据库类型">
                        <Select value={draft.databaseType} onValueChange={(value) => patchDraft({ databaseType: value })}>
                          <SelectTrigger aria-label="数据库类型">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MySQL">MySQL</SelectItem>
                            <SelectItem value="Oracle">Oracle</SelectItem>
                            <SelectItem value="PostgreSQL">PostgreSQL</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="实例名称" id="asset-instance-name">
                        <Input id="asset-instance-name" value={draft.instanceName} onChange={(event) => patchDraft({ instanceName: event.target.value })} />
                      </Field>
                      <Field label="服务名称" id="asset-service-name">
                        <Input id="asset-service-name" value={draft.serviceName} onChange={(event) => patchDraft({ serviceName: event.target.value })} />
                      </Field>
                    </>
                  )}
                  {draft.type === "日志源" && (
                    <>
                      <Field label="关联资产">
                        <Select value={draft.relatedAssetId || "none"} onValueChange={(value) => patchDraft({ relatedAssetId: value === "none" ? "" : value })}>
                          <SelectTrigger aria-label="关联资产">
                            <SelectValue placeholder="选择该日志源归属的资产" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">暂不关联</SelectItem>
                            {assets.filter((asset) => asset.type !== "日志源").map((asset) => (
                              <SelectItem key={asset.id} value={asset.id}>{asset.name} · {asset.ip}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="应用名称" id="asset-application-name">
                        <Input id="asset-application-name" value={draft.applicationName} onChange={(event) => patchDraft({ applicationName: event.target.value })} />
                      </Field>
                      <Field label="日志路径" id="asset-log-path">
                        <Input id="asset-log-path" value={draft.logPath} onChange={(event) => patchDraft({ logPath: event.target.value })} />
                      </Field>
                      <Field label="日志类型">
                        <Select value={draft.logType} onValueChange={(value) => patchDraft({ logType: value })}>
                          <SelectTrigger aria-label="日志类型">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="应用日志">应用日志</SelectItem>
                            <SelectItem value="数据库日志">数据库日志</SelectItem>
                            <SelectItem value="中间件日志">中间件日志</SelectItem>
                            <SelectItem value="系统日志">系统日志</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="默认检索窗口" id="asset-default-log-window">
                        <Input id="asset-default-log-window" value={draft.defaultLogWindow} onChange={(event) => patchDraft({ defaultLogWindow: event.target.value })} />
                      </Field>
                      <Field label="关注关键词" id="asset-log-keywords">
                        <Input id="asset-log-keywords" value={draft.logKeywords} onChange={(event) => patchDraft({ logKeywords: event.target.value })} placeholder="error, exception, timeout" />
                      </Field>
                    </>
                  )}
                </div>
              </div>

              {draft.type === "日志源" ? (
                <div>
                  <SectionTitle icon={Workflow} title="日志源定位信息" />
                  <div className="rounded-lg border bg-secondary/40 p-3 text-sm text-muted-foreground">
                    系统将根据部署主机 IP、主机名称、应用名称、日志路径和异常时间窗口检索日志；Filebeat 与 ES 采集通道为系统内置，不在资产管理中配置。
                  </div>
                </div>
              ) : (
                <div>
                  <SectionTitle icon={Workflow} title="Zabbix 监控对象映射" />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Zabbix Host">
                      <Select value={draft.zabbixHostId} onValueChange={(value) => patchDraft({ zabbixHostId: value })}>
                        <SelectTrigger aria-label="Zabbix Host" className="h-auto min-h-[66px] rounded-lg border bg-card p-3 [&>span]:line-clamp-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {zabbixHostOptions.map((host) => (
                            <SelectItem key={host.hostId} value={host.hostId}>{host.hostName} · {host.ip}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Info label="Host ID" value={selectedHost?.hostId ?? "未选择"} />
                    <Info label="Host 名称" value={selectedHost?.hostName ?? "未选择"} />
                    <Info label="同步状态" value="已匹配" />
                  </div>
                </div>
              )}

              <Field label="资产说明" id="asset-description">
                <Input id="asset-description" value={draft.description} onChange={(event) => patchDraft({ description: event.target.value })} />
              </Field>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={onClose}>取消</Button>
                <Button onClick={onSubmit}>{mode === "create" ? "创建资产" : "保存修改"}</Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function AssetDetailSheet({ asset, onClose }: { asset: OpsAsset | null; onClose: () => void }) {
  const templates = asset ? inspectionTemplates.filter((item) => item.targetAssetTypes.includes(asset.type)) : [];
  const relatedRecords = asset
    ? abnormalRecords.filter((record) => record.assetId === asset.id)
    : [];
  const relatedAnalyses = asset
    ? faultAnalysisTasks.filter((task) => task.assetId === asset.id)
    : [];
  const notifyUsers = asset ? users.filter((user) => asset.notifyUserIds.includes(user.id)) : [];

  return (
    <Sheet open={!!asset} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-3xl w-full overflow-y-auto">
        {asset && (
          <>
            <SheetHeader className="space-y-2">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-lg">{asset.name}</SheetTitle>
                <StatusBadge tone="info">{asset.type}</StatusBadge>
                <StatusBadge tone={statusTone(asset.status)}>{asset.status}</StatusBadge>
              </div>
              <SheetDescription className="sr-only">资产详情</SheetDescription>
            </SheetHeader>

            <SectionTitle icon={Server} title="资产档案" />
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Info label="资产名称" value={asset.name} />
              <Info label="资产类型" value={asset.type} />
              <Info label="业务系统" value={asset.systemName} />
              <Info label="运维责任人" value={responsibleNames(asset).join("、") || "暂无"} />
              <Info label="资产说明" value={asset.description} />
            </div>

            <SectionTitle icon={ShieldCheck} title="纳管信息（只读）" />
            <div className="grid grid-cols-2 gap-3">
              <Info label="纳管来源" value={`${asset.onboardingSource} / ${asset.lastUpdatedAt}`} />
              <Info label="资产状态" value={asset.status} />
              <Info label="纳管状态" value={asset.onboardingStatus} />
            </div>

            <SectionTitle icon={SlidersHorizontal} title="部署信息" />
            <div className="grid grid-cols-2 gap-3">
              <Info label="IP" value={asset.ip} />
              {asset.hostName && <Info label="主机名称" value={asset.hostName} />}
              {asset.port && <Info label="端口" value={asset.port} />}
              {asset.databaseType && <Info label="数据库类型" value={asset.databaseType} />}
              {asset.instanceName && <Info label="实例名称" value={asset.instanceName} />}
              {asset.serviceName && <Info label="服务名称" value={asset.serviceName} />}
              {asset.applicationName && <Info label="应用名称" value={asset.applicationName} />}
              {asset.logPath && <Info label="日志路径" value={asset.logPath} />}
              {asset.logType && <Info label="日志类型" value={asset.logType} />}
              {asset.defaultLogWindow && <Info label="默认检索窗口" value={asset.defaultLogWindow} />}
              {asset.logKeywords && <Info label="关注关键词" value={asset.logKeywords.join("、")} />}
            </div>

            {asset.type === "日志源" ? (
              <>
                <SectionTitle icon={Workflow} title="日志源定位信息" />
                <div className="grid grid-cols-2 gap-3">
                  <Info label="检索依据" value={`${asset.ip} / ${asset.hostName ?? "未填主机名"} / ${asset.applicationName ?? "未填应用"} / ${asset.logPath ?? "未填路径"}`} />
                  <Info label="系统检索说明" value="按 IP、主机名称、应用名称、日志路径和异常时间窗口检索日志；Filebeat 与 ES 通道系统内置。" />
                </div>
              </>
            ) : (
              <>
                <SectionTitle icon={Workflow} title="Zabbix 监控对象映射" />
                <div className="grid grid-cols-2 gap-3">
                  <Info label="Zabbix Host" value={asset.monitoringObjectName} />
                  <Info label="Host ID" value={asset.zabbixHostId} />
                  <Info label="同步状态" value={asset.zabbixSyncStatus} />
                </div>
              </>
            )}

            <SectionTitle icon={AlertTriangle} title="关联信息（只读）" />
            <div className="grid grid-cols-2 gap-3">
              <Info label="被巡检配置引用" value={templates.map((item) => item.name).join("、") || "暂无"} />
              <Info label="关联异常/关注记录" value={`${relatedRecords.length} 条`} />
              <Info label="关联故障分析任务" value={`${relatedAnalyses.length} 条`} />
              <Info label="运维责任人来源" value={notifyUsers.map((user) => user.name).join("、") || "暂无"} />
            </div>

            <SectionTitle icon={AlertTriangle} title="关联异常与分析" />
            <div className="space-y-2">
              {relatedRecords.length === 0 ? (
                <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">暂无关联异常/关注记录</div>
              ) : (
                relatedRecords.map((record) => {
                  const analysis = faultAnalysisTasks.find((item) => item.abnormalRecordId === record.id);
                  return (
                    <div key={record.id} className="rounded-lg border bg-card p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="text-sm font-medium">{record.id} · {record.abnormalType}</div>
                          <div className="text-xs text-muted-foreground mt-1">{record.metricValue} · 阈值 {record.threshold}</div>
                        </div>
                        <div className="flex gap-1.5 flex-wrap justify-end">
                          <StatusBadge tone={statusTone(record.analysisLinkStatus)}>{record.analysisLinkStatus}</StatusBadge>
                          <StatusBadge tone={statusTone(record.handlingStatus)}>{record.handlingStatus}</StatusBadge>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        分析任务：{analysis?.taskNo ?? "未生成"} · {analysis?.owner ?? record.triggerSource}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function OnboardingSheet({ active, onClose }: { active: OnboardingPanel; onClose: () => void }) {
  const titleMap = {
    import: "导入资产映射表",
    template: "下载模板",
  };

  return (
    <Sheet open={!!active} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
        {active && (
          <>
            <SheetHeader className="space-y-2">
              <SheetTitle className="text-lg">{titleMap[active]}</SheetTitle>
              <SheetDescription>
                {active === "import" && "演示从客户资产映射表批量纳管资产，当前原型不做真实文件解析。"}
                {active === "template" && "模板用于收集业务系统、资产类型、部署信息、指标对象、日志定位和运维责任人。"}
              </SheetDescription>
            </SheetHeader>

            {active === "import" && (
              <div className="mt-5 space-y-3">
                <div className="rounded-lg border bg-secondary/40 p-4">
                  <p className="text-sm font-medium">导入预览样例</p>
                  <p className="mt-2 text-sm text-muted-foreground">新增 3 条，更新 1 条，1 条日志源缺少日志路径，需要补齐后才能被故障分析引用。</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Info label="可纳管" value="4 条" />
                  <Info label="待配置" value="1 条" />
                  <Info label="冲突" value="0 条" />
                </div>
              </div>
            )}

            {active === "template" && (
              <div className="mt-5 rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>模板字段</TableHead>
                      <TableHead>示例</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      ["业务系统", "营销系统"],
                      ["资产类型", "主机 / 数据库 / 日志源"],
                      ["IP", "10.20.2.21"],
                      ["主机名称", "app-svc-01"],
                      ["端口", "3306"],
                      ["实例/服务名称", "marketing_mysql_primary"],
                      ["Zabbix Host", "app-svc-01"],
                      ["Host ID", "zbx-10021"],
                      ["应用名称", "营销服务"],
                      ["日志路径", "/data/logs/app/error.log"],
                      ["默认检索窗口", "异常前后 30 分钟"],
                      ["关注关键词", "error, exception, timeout"],
                      ["运维责任人", "张运维 / 刘值班"],
                    ].map(([field, sample]) => (
                      <TableRow key={field}>
                        <TableCell className="font-medium">{field}</TableCell>
                        <TableCell className="text-muted-foreground">{sample}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function createEmptyDraft(): AssetFormState {
  const firstOpsUser = users.find((user) => user.role === "运维人员");
  return {
    type: "主机",
    name: "",
    systemName: "营销系统",
    ip: "",
    hostName: "",
    port: "",
    databaseType: "MySQL",
    instanceName: "",
    serviceName: "",
    relatedAssetId: "",
    applicationName: "",
    logPath: "",
    logType: "应用日志",
    defaultLogWindow: "异常前后 30 分钟",
    logKeywords: "error, exception, timeout",
    responsibleUserIds: firstOpsUser ? [firstOpsUser.id] : [],
    zabbixHostId: zabbixHostOptions[0].hostId,
    description: "",
  };
}

function createDraftFromAsset(asset: OpsAsset): AssetFormState {
  return {
    id: asset.id,
    type: asset.type,
    name: asset.name,
    systemName: asset.systemName,
    ip: asset.ip,
    hostName: asset.hostName ?? "",
    port: asset.port ?? "",
    databaseType: asset.databaseType ?? "MySQL",
    instanceName: asset.instanceName ?? "",
    serviceName: asset.serviceName ?? "",
    relatedAssetId: asset.relatedAssetId ?? "",
    applicationName: asset.applicationName ?? "",
    logPath: asset.logPath ?? "",
    logType: asset.logType ?? "应用日志",
    defaultLogWindow: asset.defaultLogWindow ?? "异常前后 30 分钟",
    logKeywords: asset.logKeywords?.join(", ") ?? "error, exception, timeout",
    responsibleUserIds: asset.notifyUserIds.length > 0 ? asset.notifyUserIds : [asset.ownerUserId],
    zabbixHostId: asset.zabbixHostId,
    description: asset.description,
  };
}

function buildAssetFromDraft(draft: AssetFormState, mode: AssetFormMode | null, existing?: OpsAsset): OpsAsset | null {
  const name = draft.name.trim();
  const systemName = draft.systemName.trim();
  const ip = draft.ip.trim();
  const responsibleUsers = users.filter((user) => draft.responsibleUserIds.includes(user.id));
  const primaryUser = responsibleUsers[0];
  const selectedHost = zabbixHostOptions.find((host) => host.hostId === draft.zabbixHostId);
  if (!mode || !name || !systemName || !ip || !primaryUser) return null;
  if (draft.type !== "日志源" && !selectedHost) return null;

  const hostName = draft.hostName.trim();
  const port = draft.type === "数据库" ? draft.port.trim() : "";
  const logPath = draft.type === "日志源" ? draft.logPath.trim() : "";
  const applicationName = draft.type === "日志源" ? draft.applicationName.trim() : "";
  const defaultLogWindow = draft.type === "日志源" ? draft.defaultLogWindow.trim() : "";
  const logKeywords = draft.type === "日志源"
    ? draft.logKeywords.split(/[,，]/).map((item) => item.trim()).filter(Boolean)
    : [];
  const id = existing?.id ?? `asset-${Date.now()}`;
  const notifyUserIds = responsibleUsers.map((user) => user.id);
  const monitoringObjectName = draft.type === "日志源" ? "" : selectedHost?.hostName ?? "";
  const zabbixHostId = draft.type === "日志源" ? "" : selectedHost?.hostId ?? "";

  return {
    id,
    type: draft.type,
    name,
    systemName,
    address: port ? `${ip}:${port}` : ip,
    ip,
    ...(hostName ? { hostName } : {}),
    ...(port ? { port } : {}),
    ...(draft.type === "数据库" ? { databaseType: draft.databaseType as OpsAsset["databaseType"] } : {}),
    ...(draft.type === "数据库" && draft.instanceName.trim() ? { instanceName: draft.instanceName.trim() } : {}),
    ...(draft.type === "数据库" && draft.serviceName.trim() ? { serviceName: draft.serviceName.trim() } : {}),
    ...(draft.relatedAssetId ? { relatedAssetId: draft.relatedAssetId } : {}),
    ...(applicationName ? { applicationName } : {}),
    ...(logPath ? { logPath } : {}),
    ...(draft.type === "日志源" ? { logType: draft.logType as OpsAsset["logType"] } : {}),
    ...(defaultLogWindow ? { defaultLogWindow } : {}),
    ...(logKeywords.length ? { logKeywords } : {}),
    owner: primaryUser.name,
    ownerUserId: primaryUser.id,
    notifyUserIds,
    status: existing?.status ?? "运行中",
    onboardingSource: existing?.onboardingSource ?? "手工录入",
    onboardingStatus: existing?.onboardingStatus ?? "已纳管",
    monitoringPlatform: "Zabbix",
    monitoringObjectName,
    zabbixHostId,
    zabbixSyncStatus: draft.type === "日志源" ? "未匹配" : "已匹配",
    lastUpdatedAt: "2026-06-26 10:30",
    notifyTarget: responsibleUsers.map((user) => user.name).join(" / "),
    description: draft.description.trim() || defaultAssetDescription(draft.type, name),
  };
}

function assetEndpoint(asset: OpsAsset) {
  return asset.port ? `${asset.ip}:${asset.port}` : asset.ip;
}

function responsibleNames(asset: OpsAsset) {
  const selectedUsers = users.filter((user) => asset.notifyUserIds.includes(user.id));
  return selectedUsers.length > 0 ? selectedUsers.map((user) => user.name) : [asset.owner];
}

function selectedResponsibleLabel(userIds: string[]) {
  const names = users.filter((user) => userIds.includes(user.id)).map((user) => user.name);
  return names.length > 0 ? names.join("、") : "请选择运维责任人";
}

function logLocationLabel(asset: OpsAsset) {
  if (asset.type === "日志源") return asset.logPath || "待补充日志路径";
  return asset.type === "数据库" ? "关联数据库日志" : "关联主机日志";
}

function defaultAssetDescription(type: OpsAssetType, name: string) {
  if (type === "日志源") return `${name} 日志源，维护日志业务含义和检索定位信息。`;
  if (type === "数据库") return `${name} 数据库资产，维护实例位置、运维责任人和 Zabbix Host 映射。`;
  return `${name} 主机资产，维护部署位置、运维责任人和 Zabbix Host 映射。`;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-1 break-all">{value}</p>
    </div>
  );
}

function Field({ label, id, children }: { label: string; id?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="mt-6 mb-3 flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <h3 className="text-sm font-semibold">{title}</h3>
    </div>
  );
}

function Stat({ label, value, success }: { label: string; value: number; success?: boolean }) {
  return (
    <div className="stat-card flex items-center gap-3">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${success ? "bg-success-soft text-success" : "bg-info-soft text-info"}`}>
        <ShieldCheck className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
