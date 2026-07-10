import { FormEvent, useState } from "react";
import { Activity, LockKeyhole, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { users, type UserItem } from "@/lib/mockData";

export default function Login({ onLogin }: { onLogin: (user: UserItem) => void }) {
  const [account, setAccount] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const user = users.find((item) => item.account === account.trim() && item.status === "启用");
    if (!user || password !== "123456") {
      setError("账号或密码错误");
      return;
    }
    onLogin(user);
  };

  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary shadow-elev-sm">
            <Activity className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">智能运维平台</h1>
            <p className="text-sm text-muted-foreground">SmartOps · v1.0</p>
          </div>
        </div>

        <form onSubmit={submit} className="rounded-lg border bg-card p-7 shadow-elev-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">用户登录</h2>
            <p className="mt-1 text-sm text-muted-foreground">请输入系统账号进入运维工作台</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="login-account">账号</Label>
              <div className="relative">
                <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="login-account"
                  value={account}
                  onChange={(event) => setAccount(event.target.value)}
                  autoComplete="username"
                  className="pl-9"
                  placeholder="请输入账号"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="login-password">密码</Label>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  className="pl-9"
                  placeholder="请输入密码"
                />
              </div>
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

          <Button type="submit" className="mt-5 w-full">登录</Button>
          <p className="mt-4 text-center text-xs text-muted-foreground">演示密码：123456</p>
        </form>
      </div>
    </div>
  );
}
