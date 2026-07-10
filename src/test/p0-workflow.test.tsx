import { describe, expect, it } from "vitest";
import {
  abnormalRecords,
  assetHosts,
  auditLogs,
  detectableMetrics,
  faultAnalysisTasks,
  inspectionMetricResults,
  inspectionTemplates,
  knowledge,
  knowledgeGaps,
  opsAssets,
  reports,
  roleBoundaries,
} from "@/lib/mockData";

describe("P0P1 workflow mock data", () => {
  it("links abnormal and attention records to assets and fault analysis tasks", () => {
    expect(abnormalRecords).toHaveLength(2);
    expect(abnormalRecords.map((item) => item.triggerSource)).toEqual(["巡检异常", "关注记录"]);

    for (const abnormal of abnormalRecords) {
      const asset = assetHosts.find((item) => item.id === abnormal.assetId);
      expect(asset?.systemName).toBe("营销系统");

      const analysis = faultAnalysisTasks.find((item) => item.abnormalRecordId === abnormal.id);
      expect(analysis?.triggerSource).toBe(abnormal.triggerSource);
      expect(analysis?.handlingStatus).toBe("待处理");
      expect(analysis?.traceId).toMatch(/^TRACE-/);
    }
  });

  it("keeps generated fault report and audit trace connected to analysis task", () => {
    const analysis = faultAnalysisTasks.find((item) => item.taskNo === "FA-20260626-001");
    expect(analysis?.reportStatus).toBe("已生成");

    const report = reports.find((item) => item.id === analysis?.reportId);
    expect(report?.category).toBe("故障分析报告");
    expect(report?.sourceTaskNo).toBe("FA-20260626-001");
    expect(report?.auditTraceId).toBe(analysis?.traceId);

    const audit = auditLogs.find((item) => item.traceId === analysis?.traceId);
    expect(audit?.objectId).toBe("FA-20260626-001");
  });

  it("keeps knowledge gaps connected to the fault analysis baseline", () => {
    const gap = knowledgeGaps.find((item) => item.id === "kg-001");
    expect(gap?.source).toBe("故障分析");
    expect(gap?.status).toBe("待补充");
  });

  it("links P1 MVP assets, metrics, inspection results and analysis sources", () => {
    expect(opsAssets.map((item) => item.type)).toEqual(["主机", "数据库", "日志源"]);
    expect(opsAssets.map((item) => item.type)).not.toEqual(expect.arrayContaining(["系统", "应用服务"]));
    expect(inspectionTemplates.map((item) => item.name)).toEqual(
      expect.arrayContaining(["主机基础巡检", "数据库专项巡检", "日志异常巡检"]),
    );
    expect(inspectionTemplates.map((item) => item.name)).not.toContain("应用服务巡检");
    expect(inspectionTemplates.map((item) => item.name)).not.toContain("URL/接口拨测");

    for (const asset of opsAssets) {
      const metrics = detectableMetrics.filter((item) => item.assetType === asset.type);
      expect(metrics.length).toBeGreaterThan(0);
    }

    const hostAsset = opsAssets.find((item) => item.id === "asset-app-svc-01");
    expect(hostAsset?.ip).toBe("10.20.2.21");
    expect(hostAsset?.monitoringPlatform).toBe("Zabbix");
    expect(hostAsset?.zabbixHostId).toBe("zbx-10021");

    const logAsset = opsAssets.find((item) => item.id === "asset-log-app-error");
    expect(logAsset?.ip).toBe("10.20.2.21");
    expect(logAsset?.logPath).toBe("/data/logs/app/error.log");

    const logMetric = detectableMetrics.find((item) => item.code === "log.error.count");
    expect(logMetric?.sourceIdentifier).toBe("/data/logs/app/error.log");
    expect(logMetric?.missingPolicy).toBe("标记缺项");

    const logResult = inspectionMetricResults.find((item) => item.metricId === logMetric?.id);
    expect(logResult?.evidenceSnapshot).toContain("error");
    expect(logResult?.logEvidence?.path).toBe("/data/logs/app/error.log");
    expect(logResult?.logEvidence?.keywords).toEqual(expect.arrayContaining(["error", "exception", "timeout", "failed"]));

    const abnormal = abnormalRecords.find((item) => item.id === "AR-20260626-001");
    expect(abnormal?.metricResultId).toBe(logResult?.id);
    expect(abnormal?.analysisLinkStatus).toBe("已生成分析结果");

    const analysis = faultAnalysisTasks.find((item) => item.abnormalRecordId === abnormal?.id);
    expect(analysis?.sourceMetricResultIds).toContain(logResult?.id);
  });

  it("supports P1 extension knowledge, degradation audit and role boundary data", () => {
    const citedKnowledge = knowledge.find((item) => item.id === "k2");
    expect(citedKnowledge?.citationStats.total).toBeGreaterThan(0);
    expect(citedKnowledge?.citationStats.faultAnalysis).toBeGreaterThan(0);

    const handledGap = knowledgeGaps.find((item) => item.status === "已补充");
    expect(handledGap?.linkedDocTitle).toBeTruthy();

    const degradedTask = faultAnalysisTasks.find((item) => item.degradation === "知识未命中" || item.degradation === "日志不可用");
    expect(degradedTask?.traceId).toMatch(/^TRACE-/);
    expect(auditLogs.some((item) => item.traceId === degradedTask?.traceId && item.degradation && item.degradation !== "无降级")).toBe(true);

    const reportFollowupAudit = auditLogs.find((item) => item.action === "报告追问");
    expect(reportFollowupAudit?.objectType).toBe("报告");
    expect(reportFollowupAudit?.agentName).toBe("报告追问服务");

    expect(roleBoundaries.map((item) => item.role)).toEqual(["系统管理员", "运维人员"]);
    expect(roleBoundaries.find((item) => item.role === "系统管理员")?.responsibilities).toContain("配置资产与巡检规则");
  });
});
