import { createContext, useContext, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import {
  detectableMetrics,
  opsAssets,
  type OpsAsset,
} from "@/lib/mockData";

export type ObservationMapping = {
  assetId: string;
  zabbixHostId: string;
  zabbixHostName: string;
  metricIds: string[];
  logSourceIds: string[];
  lastSyncedAt: string;
};

export const zabbixHostOptions = [
  { hostId: "zbx-10021", hostName: "app-svc-01", ip: "10.20.2.21" },
  { hostId: "zbx-10031", hostName: "db-master-01", ip: "10.20.3.31" },
  { hostId: "zbx-10088", hostName: "app-cache-01", ip: "10.20.2.88" },
  { hostId: "zbx-10091", hostName: "mq-01", ip: "10.20.4.11" },
];

type OpsDataContextValue = {
  assets: OpsAsset[];
  setAssets: Dispatch<SetStateAction<OpsAsset[]>>;
  observationMappings: ObservationMapping[];
  saveAsset: (asset: OpsAsset) => void;
  deleteAsset: (assetId: string) => void;
  saveObservationMapping: (mapping: ObservationMapping) => void;
};

const OpsDataContext = createContext<OpsDataContextValue | null>(null);

export function OpsDataProvider({ children }: { children: ReactNode }) {
  const [assets, setAssets] = useState<OpsAsset[]>(opsAssets);
  const [observationMappings, setObservationMappings] = useState<ObservationMapping[]>(() => createInitialMappings(opsAssets));

  function saveAsset(asset: OpsAsset) {
    const nextAssets = assets.some((item) => item.id === asset.id)
      ? assets.map((item) => (item.id === asset.id ? asset : item))
      : [asset, ...assets];
    setAssets((items) => {
      const exists = items.some((item) => item.id === asset.id);
      return exists ? items.map((item) => (item.id === asset.id ? asset : item)) : [asset, ...items];
    });
    if (asset.type !== "日志源") {
      const option = zabbixHostOptions.find((item) => item.hostId === asset.zabbixHostId);
      setObservationMappings((items) => upsertMapping(items, {
        assetId: asset.id,
        zabbixHostId: asset.zabbixHostId,
        zabbixHostName: option?.hostName ?? asset.monitoringObjectName,
        metricIds: detectableMetrics.filter((metric) => metric.assetType === asset.type).map((metric) => metric.id),
        logSourceIds: nextAssets.filter((item) => item.type === "日志源" && (item.relatedAssetId === asset.id || item.ip === asset.ip)).map((item) => item.id),
        lastSyncedAt: asset.lastUpdatedAt,
      }));
    } else {
      const relatedAssets = nextAssets.filter((item) => item.type !== "日志源" && (asset.relatedAssetId === item.id || asset.ip === item.ip));
      setObservationMappings((items) => relatedAssets.reduce((current, relatedAsset) => {
        const existing = current.find((item) => item.assetId === relatedAsset.id);
        const option = zabbixHostOptions.find((item) => item.hostId === relatedAsset.zabbixHostId);
        return upsertMapping(current, {
          assetId: relatedAsset.id,
          zabbixHostId: existing?.zabbixHostId ?? relatedAsset.zabbixHostId,
          zabbixHostName: existing?.zabbixHostName ?? option?.hostName ?? relatedAsset.monitoringObjectName,
          metricIds: existing?.metricIds ?? detectableMetrics.filter((metric) => metric.assetType === relatedAsset.type).map((metric) => metric.id),
          logSourceIds: nextAssets.filter((item) => item.type === "日志源" && (item.relatedAssetId === relatedAsset.id || item.ip === relatedAsset.ip)).map((item) => item.id),
          lastSyncedAt: "2026-06-26 10:45",
        });
      }, items));
    }
  }

  function deleteAsset(assetId: string) {
    setAssets((items) => items.filter((item) => item.id !== assetId));
    setObservationMappings((items) => items
      .filter((item) => item.assetId !== assetId)
      .map((item) => ({ ...item, logSourceIds: item.logSourceIds.filter((id) => id !== assetId) })));
  }

  function saveObservationMapping(mapping: ObservationMapping) {
    setObservationMappings((items) => upsertMapping(items, mapping));
  }

  const value = useMemo(() => ({
    assets,
    setAssets,
    observationMappings,
    saveAsset,
    deleteAsset,
    saveObservationMapping,
  }), [assets, observationMappings]);

  return <OpsDataContext.Provider value={value}>{children}</OpsDataContext.Provider>;
}

export function useOpsData() {
  const value = useContext(OpsDataContext);
  if (!value) throw new Error("useOpsData must be used inside OpsDataProvider");
  return value;
}

function createInitialMappings(assets: OpsAsset[]): ObservationMapping[] {
  return assets
    .filter((asset) => asset.type !== "日志源")
    .map((asset) => {
      const option = zabbixHostOptions.find((item) => item.hostId === asset.zabbixHostId);
      return {
        assetId: asset.id,
        zabbixHostId: asset.zabbixHostId,
        zabbixHostName: option?.hostName ?? asset.monitoringObjectName,
        metricIds: detectableMetrics.filter((metric) => metric.assetType === asset.type).map((metric) => metric.id),
        logSourceIds: assets.filter((item) => item.type === "日志源" && (item.relatedAssetId === asset.id || item.ip === asset.ip)).map((item) => item.id),
        lastSyncedAt: asset.lastUpdatedAt,
      };
    });
}

function upsertMapping(items: ObservationMapping[], mapping: ObservationMapping) {
  return items.some((item) => item.assetId === mapping.assetId)
    ? items.map((item) => (item.assetId === mapping.assetId ? mapping : item))
    : [mapping, ...items];
}
