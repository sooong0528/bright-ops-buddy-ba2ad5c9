import { useMemo, useState } from "react";
import { Plus, ShieldCheck, UserCog, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { roleBoundaries, users as initialUsers, type UserItem } from "@/lib/mockData";
import { toast } from "@/hooks/use-toast";

export default function UsersPage() {
  const [userList, setUserList] = useState<UserItem[]>(initialUsers);
  const [keyword, setKeyword] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    account: "",
    role: "运维人员" as UserItem["role"],
    department: "运维中心",
    phone: "",
    email: "",
  });

  const filteredUsers = useMemo(() => {
    return userList.filter((item) =>
      keyword === "" ||
      item.name.includes(keyword) ||
      item.account.includes(keyword) ||
      item.department.includes(keyword) ||
      item.phone.includes(keyword) ||
      item.email.includes(keyword)
    );
  }, [keyword, userList]);

  const roles = [
    {
      name: "系统管理员",
      count: userList.filter((item) => item.role === "系统管理员").length,
      desc: "配置资产、巡检规则、知识库、用户和审计入口",
      color: "destructive" as const,
      icon: ShieldCheck,
    },
    {
      name: "运维人员",
      count: userList.filter((item) => item.role === "运维人员").length,
      desc: "查看巡检结果、处理异常、发起分析并生成报告",
      color: "primary" as const,
      icon: UserCog,
    },
  ];

  function createUser() {
    const name = draft.name.trim();
    const account = draft.account.trim();
    const department = draft.department.trim();
    const phone = draft.phone.trim();
    const email = draft.email.trim();
    if (!name || !account || !department || !phone || !email) {
      toast({ title: "请补充用户信息", description: "姓名、账号、所属部门、手机和邮箱不能为空。" });
      return;
    }
    if (userList.some((item) => item.account === account)) {
      toast({ title: "账号已存在", description: "请更换账号后再创建。" });
      return;
    }
    setUserList((items) => [
      {
        id: `u-${Date.now()}`,
        name,
        account,
        role: draft.role,
        department,
        phone,
        email,
        status: "启用",
        lastLogin: "暂未登录",
      },
      ...items,
    ]);
    setDraft({ name: "", account: "", role: "运维人员", department: "运维中心", phone: "", email: "" });
    setDialogOpen(false);
    toast({ title: "已创建用户", description: `${name} · ${draft.role}` });
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((r) => (
          <div key={r.name} className="panel p-5">
            <div className="flex items-start gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                r.color === "destructive" ? "bg-destructive-soft text-destructive" :
                r.color === "primary" ? "bg-primary-soft text-primary" :
                "bg-info-soft text-info"
              }`}>
                <r.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">{r.name}</h4>
                  <span className="text-xs tabular-nums text-muted-foreground">{r.count} 人</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{r.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="panel p-5">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">角色边界说明</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {roleBoundaries.map((item) => (
            <div key={item.role} className="rounded-lg border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold">{item.role}</h4>
                <StatusBadge tone={item.role === "系统管理员" ? "destructive" : "info"}>{item.mainPages.length} 个主要页面</StatusBadge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">主要职责</p>
                <div className="flex flex-wrap gap-1.5">
                  {item.responsibilities.map((text) => (
                    <span key={text} className="text-xs rounded bg-secondary px-2 py-1">{text}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">边界说明</p>
                <ul className="space-y-1">
                  {item.restrictedNotes.map((text) => (
                    <li key={text} className="text-xs text-foreground/80">· {text}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="flex items-center justify-between p-5 pb-3">
          <div>
            <h3 className="font-semibold">用户列表</h3>
            <p className="text-xs text-muted-foreground mt-0.5">当前仅展示系统管理员和运维人员两类角色</p>
          </div>
          <div className="flex gap-2">
            <Input placeholder="搜索用户" className="w-56 h-9" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
            <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" />新建用户</Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用户</TableHead>
              <TableHead>账号</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>所属部门</TableHead>
              <TableHead>手机</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>最近登录</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((u) => (
              <TableRow key={u.id} className="hover:bg-secondary/40">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary-soft text-primary text-xs font-medium">
                        {u.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm">{u.name}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{u.account}</TableCell>
                <TableCell>
                  <StatusBadge tone={u.role === "系统管理员" ? "destructive" : "info"}>
                    {u.role}
                  </StatusBadge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{u.department}</TableCell>
                <TableCell className="text-xs text-muted-foreground tabular-nums">{u.phone}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{u.email}</TableCell>
                <TableCell><StatusBadge tone={statusTone(u.status)} dot>{u.status}</StatusBadge></TableCell>
                <TableCell className="text-xs text-muted-foreground tabular-nums">{u.lastLogin}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建用户</DialogTitle>
            <DialogDescription>补充用户基础信息，资产负责人仅从运维人员中选择。</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="user-name">姓名</Label>
              <Input id="user-name" value={draft.name} onChange={(event) => setDraft((item) => ({ ...item, name: event.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-account">账号</Label>
              <Input id="user-account" value={draft.account} onChange={(event) => setDraft((item) => ({ ...item, account: event.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>角色</Label>
              <Select value={draft.role} onValueChange={(value) => setDraft((item) => ({ ...item, role: value as UserItem["role"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="运维人员">运维人员</SelectItem>
                  <SelectItem value="系统管理员">系统管理员</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-department">所属部门</Label>
              <Input id="user-department" value={draft.department} onChange={(event) => setDraft((item) => ({ ...item, department: event.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-phone">手机</Label>
              <Input id="user-phone" value={draft.phone} onChange={(event) => setDraft((item) => ({ ...item, phone: event.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-email">邮箱</Label>
              <Input id="user-email" value={draft.email} onChange={(event) => setDraft((item) => ({ ...item, email: event.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={createUser}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
