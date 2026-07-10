import { describe, expect, it } from "vitest";
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { assets, defaultCheckItemsByAssetType, users } from "@/lib/mockData";
import Assets from "@/pages/Assets";

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
});
