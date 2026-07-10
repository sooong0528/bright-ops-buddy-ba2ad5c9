import { describe, expect, it } from "vitest";
import type { FaultAnalysisTask, ReportItem } from "@/types/ops";
import {
  auditLogs,
  faultAnalysisTasks,
  reports,
  abnormalRecords,
  inspectionMetricResults,
} from "@/mocks";

describe("P2 workflow contracts", () => {
  it("exports domain types and mock data through split entrypoints", () => {
    const analysis: FaultAnalysisTask | undefined = faultAnalysisTasks[0];
    const report: ReportItem | undefined = reports[0];

    expect(analysis?.taskNo).toMatch(/^FA-/);
    expect(report?.reportNo).toMatch(/^[IFK]R-/);
    expect(abnormalRecords.length).toBeGreaterThan(0);
    expect(inspectionMetricResults.length).toBeGreaterThan(0);
  });

  it("keeps report generation limited to completed fault analysis tasks", () => {
    for (const task of faultAnalysisTasks) {
      if (task.reportStatus === "已生成") {
        expect(task.status).toBe("已完成");
        expect(task.reportId).toBeTruthy();
        expect(reports.some((report) => report.id === task.reportId && report.sourceTaskNo === task.taskNo)).toBe(true);
      }

      if (task.status !== "已完成") {
        expect(task.reportStatus).not.toBe("已生成");
      }
    }
  });

  it("requires complete handling information before archive-ready state", () => {
    for (const task of faultAnalysisTasks) {
      const hasDescription = task.handlingRecord.description.trim() !== "";
      const hasAttachment = task.handlingRecord.attachments.length > 0;
      const hasGeneratedReport = task.reportStatus === "已生成";

      if (task.canArchive) {
        expect(task.handlingStatus).toBe("已归档");
        expect(hasDescription).toBe(true);
        expect(hasAttachment).toBe(true);
        expect(hasGeneratedReport).toBe(true);
      } else {
        expect(task.handlingStatus === "已归档" && hasDescription && hasAttachment && hasGeneratedReport).toBe(false);
      }
    }
  });

  it("keeps operation trace ids connected to root trace ids", () => {
    const reportFollowup = auditLogs.find((item) => item.action === "报告追问");
    expect(reportFollowup?.traceId).toContain("-RPT");

    const rootTraceId = reportFollowup?.traceId?.replace(/-RPT\d+$/, "");
    expect(auditLogs.some((item) => item.traceId === rootTraceId)).toBe(true);
  });
});
