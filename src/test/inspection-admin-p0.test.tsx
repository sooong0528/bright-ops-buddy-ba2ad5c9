import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import InspectionAdmin from "@/pages/InspectionAdmin";

describe("Inspection admin asset-based fields", () => {
  it("shows inspection configuration fields based on current asset model", () => {
    render(
      <MemoryRouter>
        <InspectionAdmin />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "新建巡检任务" }));
    const dialog = screen.getByRole("dialog", { name: "新建巡检任务" });

    expect(within(dialog).getByText("适用资产类型")).toBeInTheDocument();
    expect(within(dialog).getByText("资产范围")).toBeInTheDocument();
    expect(within(dialog).getByText("巡检指标")).toBeInTheDocument();
    expect(within(dialog).getByText("指标来源标识")).toBeInTheDocument();
    expect(within(dialog).getByText("阈值")).toBeInTheDocument();
    expect(within(dialog).getByText("执行频率")).toBeInTheDocument();
    expect(within(dialog).getByText("缺项策略")).toBeInTheDocument();

    expect(within(dialog).getByText("主机")).toBeInTheDocument();
    expect(within(dialog).getByText("CPU 使用率")).toBeInTheDocument();
    expect(within(dialog).getByText("system.cpu.util[,idle]")).toBeInTheDocument();
    expect(within(dialog).getAllByText("标记缺项").length).toBeGreaterThan(0);
  });
});
