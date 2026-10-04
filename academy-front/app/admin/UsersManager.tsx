"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Card, Form, Input, Modal, Select, Space, Table, Tag, message } from "antd";
import { Copy, KeyRound, RotateCcw, Search, Users } from "lucide-react";

type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin" | string;
  createdAt: string;
};

type PasswordForm = {
  password: string;
  confirmPassword: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai",
  });
}

export default function UsersManager() {
  const [rows, setRows] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [passwordUser, setPasswordUser] = useState<ManagedUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<PasswordForm>();

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (role) params.set("role", role);
    const response = await fetch(`/api/admin/users?${params.toString()}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      setError((await response.json().catch(() => null))?.error ?? "用户加载失败");
      setLoading(false);
      return;
    }
    setRows(await response.json());
    setError("");
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [role]);

  function openPasswordEditor(user: ManagedUser) {
    setPasswordUser(user);
    form.resetFields();
  }

  async function changePassword(values: PasswordForm) {
    if (!passwordUser) return;
    setSaving(true);
    const response = await fetch(`/api/admin/users/${passwordUser.id}/password`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: values.password }),
    });
    setSaving(false);
    if (!response.ok) {
      message.error((await response.json().catch(() => null))?.error ?? "密码修改失败");
      return;
    }
    message.success("密码已修改，目标用户需要重新登录");
    setPasswordUser(null);
  }

  function confirmReset(user: ManagedUser) {
    Modal.confirm({
      title: `重置「${user.name || user.email}」的密码？`,
      content: "该用户的现有登录会话会立即失效，密码将重置为 12345678。",
      okText: "确认重置",
      cancelText: "取消",
      okButtonProps: { danger: true },
      async onOk() {
        const response = await fetch(`/api/admin/users/${user.id}/password`, {
          method: "POST",
        });
        if (!response.ok) {
          message.error((await response.json().catch(() => null))?.error ?? "密码重置失败");
          return;
        }
        const result = (await response.json()) as { password: string };
        message.success({
          content: (
            <Space>
              <span>新密码：{result.password}</span>
              <Button
                size="small"
                type="text"
                icon={<Copy size={14} />}
                onClick={() => {
                  void navigator.clipboard.writeText(result.password);
                  message.success("密码已复制");
                }}
              >
                复制
              </Button>
            </Space>
          ),
          duration: 5,
        });
      },
    });
  }

  return (
    <div className="admin-workspace">
      <div className="admin-workspace-header">
        <div>
          <p className="admin-workspace-kicker">书院名录 · DISCIPLES</p>
          <h1 className="admin-page-title">弟子名录</h1>
          <p className="admin-page-subtitle">查找账号、核对身份，协助学员维护登录凭据。</p>
        </div>
        <span className="admin-workspace-count">
          <Users size={16} />共 {rows.length} 位
        </span>
      </div>
      <Card className="admin-workspace-panel" title="名录检索">
        <Space className="admin-users-toolbar mb-4 w-full" wrap>
          <Input
            allowClear
            prefix={<Search size={15} />}
            placeholder="搜索名称或邮箱"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onPressEnter={() => void load()}
            style={{ width: 220 }}
          />
          <Select
            allowClear
            placeholder="全部角色"
            value={role || undefined}
            onChange={(value) => setRole(value ?? "")}
            options={[
              { label: "普通用户", value: "user" },
              { label: "管理员", value: "admin" },
            ]}
            style={{ width: 120 }}
          />
          <Button type="primary" icon={<Search size={15} />} onClick={() => void load()}>
            查询
          </Button>
        </Space>
        {error ? <Alert className="mb-4" type="error" showIcon message={error} /> : null}
        <Table
          loading={loading}
          rowKey="id"
          dataSource={rows}
          scroll={{ x: 900 }}
          locale={{ emptyText: "暂无用户" }}
          columns={[
            {
              title: "名称",
              dataIndex: "name",
              render: (value: string, record: ManagedUser) => value || record.email,
            },
            { title: "邮箱", dataIndex: "email" },
            {
              title: "角色",
              dataIndex: "role",
              render: (value: ManagedUser["role"]) =>
                value === "admin" ? <Tag color="red">管理员</Tag> : <Tag>普通用户</Tag>,
            },
            {
              title: "注册时间",
              dataIndex: "createdAt",
              render: formatDate,
            },
            {
              title: "操作",
              key: "actions",
              fixed: "right",
              render: (_: unknown, record: ManagedUser) => (
                <Space>
                  <Button type="link" icon={<KeyRound size={15} />} onClick={() => openPasswordEditor(record)}>
                    修改密码
                  </Button>
                  <Button danger type="text" icon={<RotateCcw size={15} />} onClick={() => confirmReset(record)}>
                    重置密码
                  </Button>
                </Space>
              ),
            },
          ]}
        />
        <Modal
          rootClassName="admin-themed-modal"
          title={`修改「${passwordUser?.name || passwordUser?.email || ""}」的密码`}
          open={Boolean(passwordUser)}
          okText="保存密码"
          cancelText="取消"
          confirmLoading={saving}
          onCancel={() => setPasswordUser(null)}
          onOk={() => form.submit()}
          destroyOnHidden
        >
          <Form form={form} layout="vertical" onFinish={changePassword}>
            <Form.Item
              name="password"
              label="新密码"
              rules={[
                { required: true, message: "请输入新密码" },
                { min: 8, message: "密码至少需要 8 位" },
              ]}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="确认新密码"
              dependencies={["password"]}
              rules={[
                { required: true, message: "请再次输入新密码" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    return !value || getFieldValue("password") === value
                      ? Promise.resolve()
                      : Promise.reject(new Error("两次输入的密码不一致"));
                  },
                }),
              ]}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
}
