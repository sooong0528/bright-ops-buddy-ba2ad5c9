import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Assets from "@/pages/Assets";

describe("Assets P0 onboarding flow", () => {
  it("shows asset archive fields and Zabbix object mapping in the list", () => {
    render(<Assets />);

    expect(screen.getByRole("button", { name: "新增资产" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "导入资产映射表" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "下载模板" })).toBeInTheDocument();

    expect(screen.getByText("IP / IP:端口")).toBeInTheDocument();
    expect(screen.getByText("Zabbix Host")).toBeInTheDocument();
    expect(screen.getByText("纳管状态")).toBeInTheDocument();
    expect(screen.getAllByText("10.20.2.21").length).toBeGreaterThan(0);
    expect(screen.getByText("10.20.3.31:3306")).toBeInTheDocument();
    expect(screen.getAllByText("已纳管").length).toBeGreaterThan(0);

    expect(screen.getByText("主机")).toBeInTheDocument();
    expect(screen.getByText("数据库")).toBeInTheDocument();
    expect(screen.getByText("日志源")).toBeInTheDocument();
    expect(screen.queryByText("系统")).not.toBeInTheDocument();
    expect(screen.queryByText("应用服务")).not.toBeInTheDocument();
  });

  it("shows asset-only details without editing inspection metrics", () => {
    render(<Assets />);

    fireEvent.click(screen.getAllByRole("button", { name: "查看详情" })[1]);
    const detail = screen.getByRole("dialog", { name: "db-master-01 / MySQL 主库" });

    expect(within(detail).getByText("资产档案")).toBeInTheDocument();
    expect(within(detail).getByText("资产名称")).toBeInTheDocument();
    expect(within(detail).getByText("资产类型")).toBeInTheDocument();
    expect(within(detail).getByText("资产说明")).toBeInTheDocument();
    expect(within(detail).getByText("运维责任人")).toBeInTheDocument();
    expect(within(detail).queryByText("负责人")).not.toBeInTheDocument();
    expect(within(detail).queryByText("通知对象")).not.toBeInTheDocument();
    expect(within(detail).getByText("部署信息")).toBeInTheDocument();
    expect(within(detail).getByText("Zabbix 监控对象映射")).toBeInTheDocument();
    expect(within(detail).getByText("数据库类型")).toBeInTheDocument();
    expect(within(detail).getAllByText("MySQL").length).toBeGreaterThan(0);
    expect(within(detail).getAllByText("zbx-10031").length).toBeGreaterThan(0);
    expect(within(detail).getByText("已匹配")).toBeInTheDocument();
    expect(within(detail).queryByText(/共 \d+ 条/)).not.toBeInTheDocument();
    expect(within(detail).queryByText("监控平台")).not.toBeInTheDocument();
    expect(within(detail).queryByText("关联巡检指标")).not.toBeInTheDocument();
    expect(within(detail).queryByText("指标映射")).not.toBeInTheDocument();
  });

  it("creates an asset with selected Zabbix Host mapping", () => {
    render(<Assets />);

    fireEvent.click(screen.getByRole("button", { name: "新增资产" }));
    const createDialog = screen.getByRole("dialog", { name: "新增资产" });
    expect(within(createDialog).getByRole("combobox", { name: "Zabbix Host" })).toBeInTheDocument();
    expect(within(createDialog).getByText("运维责任人")).toBeInTheDocument();
    expect(within(createDialog).getByLabelText("张运维")).toBeInTheDocument();
    expect(within(createDialog).queryByRole("combobox", { name: "负责人" })).not.toBeInTheDocument();
    expect(within(createDialog).queryByRole("combobox", { name: "通知对象" })).not.toBeInTheDocument();

    fireEvent.change(within(createDialog).getByLabelText("资产名称"), { target: { value: "app-cache-01" } });
    fireEvent.change(within(createDialog).getByLabelText("业务系统"), { target: { value: "营销系统" } });
    fireEvent.change(within(createDialog).getByLabelText("IP"), { target: { value: "10.20.2.88" } });

    fireEvent.click(within(createDialog).getByRole("button", { name: "创建资产" }));

    expect(screen.getByText("app-cache-01")).toBeInTheDocument();
    expect(screen.getByText("10.20.2.88")).toBeInTheDocument();
    expect(screen.getAllByText("zbx-10021").length).toBeGreaterThan(0);
  });

  it("edits and deletes assets from the list", () => {
    render(<Assets />);

    fireEvent.click(screen.getAllByRole("button", { name: "编辑" })[1]);
    fireEvent.change(screen.getByLabelText("IP"), { target: { value: "10.20.3.32" } });
    fireEvent.click(screen.getByRole("button", { name: "保存修改" }));
    expect(screen.getByText("10.20.3.32:3306")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "删除" })[0]);
    expect(screen.getByText("删除资产")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "确认删除" }));

    expect(screen.queryByText("app-svc-01")).not.toBeInTheDocument();
  });
});
