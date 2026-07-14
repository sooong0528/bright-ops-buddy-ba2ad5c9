import { describe, expect, it } from "vitest";
import {
  abnormalRecords,
  analysisTasks,
  auditLogs,
  inspectionItems,
  inspectionRuns,
  inspectionRunSnapshots,
  inspectionSchemeVersions,
  observationConfigs,
  reports,
  zabbixHosts,
  zabbixItems,
} from "@/lib/mockData";

describe("core data relationships", () => {
  it("uses one stable Host and one Item for every observation mapping", () => {
    const hostIds = new Set(zabbixHosts.map((host) => host.id));
    const itemById = new Map(zabbixItems.map((item) => [item.id, item]));
    const inspectionItemIds = new Set(inspectionItems.map((item) => item.id));

    Object.values(observationConfigs).forEach((config) => {
      expect(hostIds.has(config.zabbixHostId)).toBe(true);
      expect(new Set(config.itemMappings.map((mapping) => mapping.inspectionItemId)).size)
        .toBe(config.itemMappings.length);

      config.itemMappings.forEach((mapping) => {
        expect(inspectionItemIds.has(mapping.inspectionItemId)).toBe(true);
        expect(itemById.get(mapping.zabbixItemId)?.hostId).toBe(config.zabbixHostId);
      });
    });
  });

  it("binds every inspection run to a scheme version and a stable result snapshot", () => {
    const versionIds = new Set(inspectionSchemeVersions.map((version) => version.id));

    inspectionRuns.forEach((run) => {
      expect(versionIds.has(run.schemeVersionId)).toBe(true);
      expect(inspectionRunSnapshots[run.id]?.runId).toBe(run.id);
      expect(inspectionRunSnapshots[run.id]?.schemeVersionId).toBe(run.schemeVersionId);
    });
  });

  it("keeps abnormal, analysis, report, and audit records traceable by ids", () => {
    const runResultIds = new Set(
      Object.values(inspectionRunSnapshots).flatMap((snapshot) => snapshot.results.map((result) => result.id)),
    );
    const analysisById = new Map(analysisTasks.map((task) => [task.id, task]));

    abnormalRecords.forEach((record) => {
      expect(runResultIds.has(record.sourceResultId)).toBe(true);
    });

    reports.filter((report) => report.category === "故障分析报告").forEach((report) => {
      const task = analysisById.get(report.source.id);
      expect(report.source.type).toBe("故障分析任务");
      expect(task?.reportId).toBe(report.id);
      expect(auditLogs.some((log) => log.traceId === task?.traceId)).toBe(true);
    });
  });
});
