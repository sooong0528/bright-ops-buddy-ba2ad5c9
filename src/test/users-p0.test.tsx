import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import UsersPage from "@/pages/Users";

describe("Users P0 contact fields", () => {
  it("shows phone and email in the user list and creation dialog", () => {
    render(<UsersPage />);

    expect(screen.getByText("手机")).toBeInTheDocument();
    expect(screen.getByText("邮箱")).toBeInTheDocument();
    expect(screen.getByText("13800001001")).toBeInTheDocument();
    expect(screen.getByText("zhang.yw@example.local")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /新建用户/ }));

    expect(screen.getByLabelText("手机")).toBeInTheDocument();
    expect(screen.getByLabelText("邮箱")).toBeInTheDocument();
  });
});
