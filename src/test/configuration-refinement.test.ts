import { describe, expect, it } from "vitest";
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { assets, defaultCheckItemsByAssetType, users } from "@/lib/mockData";
import Assets from "@/pages/Assets";
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
});
