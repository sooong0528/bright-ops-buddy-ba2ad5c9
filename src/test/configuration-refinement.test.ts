import { describe, expect, it } from "vitest";
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { assets, defaultCheckItemsByAssetType, reports, users } from "@/lib/mockData";
import Assets from "@/pages/Assets";
import Assistant from "@/pages/Assistant";
import Reports from "@/pages/Reports";
import App from "@/App";

describe("configuration refinement", () => {
  it("keeps judgment windows outside inspection schemes", () => {
    const items = Object.values(defaultCheckItemsByAssetType).flat();

    expect(items.every((item) => !("window" in item))).toBe(true);
  });

  it("stores asset owners as system user ids", () => {
    const userIds = new Set(users.map((user) => user.id));
    const ownerIds = assets.flatMap((asset) =>
      ((asset as unknown as { ownerIds?: string[] }).ownerIds ?? []),
    );

    expect(ownerIds).toHaveLength(assets.length);
    expect(ownerIds.every((ownerId) => userIds.has(ownerId))).toBe(true);
  });

  it("uses a system-user multi-select for asset owners", () => {
    render(React.createElement(Assets));

    fireEvent.click(screen.getByRole("button", { name: /新建资产/ }));

    expect(screen.getByRole("button", { name: "选择责任人" })).toBeInTheDocument();
  });

  it("does not edit multiple item keys as comma-separated text", () => {
    render(React.createElement(Assets));

    fireEvent.click(screen.getAllByRole("button", { name: /观测配置/ })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "更换" })[0]);

    expect(screen.queryByPlaceholderText("填写 Zabbix Item key，逗号分隔")).not.toBeInTheDocument();
  });

  it("sends unauthenticated users to the login page", () => {
    localStorage.clear();

    render(React.createElement(App));

    expect(screen.getByRole("button", { name: "登录" })).toBeInTheDocument();
  });

  it("shows inspection results and abnormal records as first-level navigation", () => {
    localStorage.setItem("smartops-current-user", "u1");
    window.history.pushState({}, "", "/");

    render(React.createElement(App));

    expect(screen.getByRole("link", { name: "巡检结果" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "异常记录" })).toBeInTheDocument();
    expect(screen.queryByText("巡检中心")).not.toBeInTheDocument();
  });

  it("uses searchable item pickers without the all-items preview", () => {
    render(React.createElement(Assets));

    fireEvent.click(screen.getAllByRole("button", { name: /观测配置/ })[0]);
    expect(screen.queryByRole("button", { name: /查看全部 Zabbix Item/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "更换" })[0]);

    expect(screen.getByRole("combobox", { name: /选择 Zabbix Item/ })).toBeInTheDocument();
  });

  it("filters reports by the important marker without archive actions", () => {
    render(React.createElement(MemoryRouter, null, React.createElement(Reports)));

    fireEvent.click(screen.getByRole("switch", { name: "仅看重要" }));

    expect(screen.getByText(reports[0].title)).toBeInTheDocument();
    expect(screen.queryByText(reports[1].title)).not.toBeInTheDocument();
    expect(screen.queryByText("移入归档")).not.toBeInTheDocument();
  });

  it("shows report source details in a context follow-up without exposing its id", () => {
    sessionStorage.setItem("assistant.context", JSON.stringify({
      sourceType: "报告",
      sourceId: "r3",
      title: "app-svc-01 CPU 持续高位 故障分析报告",
      displayTime: "2025-04-22 10:05",
      snapshot: "故障分析报告",
    }));

    render(React.createElement(MemoryRouter, null, React.createElement(Assistant)));

    expect(screen.getByText("app-svc-01 CPU 持续高位 故障分析报告")).toBeInTheDocument();
    expect(screen.getByText(/生成时间：2025-04-22 10:05/)).toBeInTheDocument();
    expect(screen.queryByText("r3")).not.toBeInTheDocument();
  });

  it("shows abnormal source details with its latest occurrence time", () => {
    sessionStorage.setItem("assistant.context", JSON.stringify({
      sourceType: "巡检异常",
      sourceId: "abn-001",
      title: "app-svc-01 · CPU 使用率",
      displayTime: "2025-04-22 09:42",
      snapshot: "CPU 使用率持续超过异常阈值",
    }));

    render(React.createElement(MemoryRouter, null, React.createElement(Assistant)));

    expect(screen.getByText("app-svc-01 · CPU 使用率")).toBeInTheDocument();
    expect(screen.getByText(/最近发生：2025-04-22 09:42/)).toBeInTheDocument();
    expect(screen.getByText("CPU 使用率持续超过异常阈值")).toBeInTheDocument();
    expect(screen.queryByText("abn-001")).not.toBeInTheDocument();
  });
});
