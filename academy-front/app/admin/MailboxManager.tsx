"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from "antd";
import { Eye, MessageCircle } from "lucide-react";

type MailboxRecord = {
  id: number;
  content: string;
  adminReply: string | null;
  status: "pending" | "replied" | "archived";
  isPublic: boolean;
  createdAt: string;
};

const statusLabels = {
  pending: "待处理",
  replied: "已回复",
  archived: "已归档",
};

export default function MailboxManager() {
  const [rows, setRows] = useState<MailboxRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<MailboxRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  async function load() {
    setLoading(true);
    const response = await fetch("/api/admin/mailbox", { cache: "no-store" });
    if (!response.ok) {
      setError((await response.json().catch(() => null))?.error ?? "留言加载失败");
      setLoading(false);
      return;
    }
    setRows(await response.json());
    setError("");
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  function openEditor(record: MailboxRecord) {
    setSelected(record);
    form.setFieldsValue({
      adminReply: record.adminReply ?? "",
      status: record.status,
      isPublic: record.isPublic,
    });
  }

  async function update(id: number, values: Record<string, unknown>) {
    const response = await fetch(`/api/admin/mailbox/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!response.ok) {
      message.error((await response.json().catch(() => null))?.error ?? "更新失败");
      return false;
    }
    return true;
  }

  async function handleSubmit(values: Record<string, unknown>) {
    if (!selected) return;
    setSaving(true);
    const success = await update(selected.id, values);
    setSaving(false);
    if (!success) return;
    message.success("留言已更新");
    setSelected(null);
    await load();
  }

  async function togglePublic(record: MailboxRecord, isPublic: boolean) {
    if (await update(record.id, { isPublic })) {
      message.success(isPublic ? "已公开展示" : "已取消公开");
      await load();
    }
  }

  return (
    <Card title="棉花糖审核">
      {error ? <Alert className="mb-4" type="error" showIcon message={error} /> : null}
      <Table
        loading={loading}
        rowKey="id"
        dataSource={rows}
        locale={{ emptyText: "暂无棉花糖" }}
        columns={[
          {
            title: "内容",
            dataIndex: "content",
            render: (content: string) => <div className="max-w-[360px] whitespace-pre-wrap">{content}</div>,
          },
          {
            title: "状态",
            dataIndex: "status",
            render: (status: MailboxRecord["status"]) => (
              <Tag color={status === "pending" ? "gold" : status === "replied" ? "green" : "default"}>
                {statusLabels[status]}
              </Tag>
            ),
          },
          {
            title: "公开",
            dataIndex: "isPublic",
            render: (isPublic: boolean, record: MailboxRecord) => (
              <Switch checked={isPublic} onChange={(value) => togglePublic(record, value)} />
            ),
          },
          {
            title: "投递时间",
            dataIndex: "createdAt",
            render: (value: string) => new Date(value).toLocaleString("zh-CN"),
          },
          {
            title: "操作",
            render: (_: unknown, record: MailboxRecord) => (
              <Button type="link" icon={<MessageCircle size={15} />} onClick={() => openEditor(record)}>
                回复
              </Button>
            ),
          },
        ]}
      />
      <Modal
        title="处理棉花糖"
        open={Boolean(selected)}
        okText="保存"
        cancelText="取消"
        confirmLoading={saving}
        onCancel={() => setSelected(null)}
        onOk={() => form.submit()}
        destroyOnHidden
      >
        {selected ? (
          <Space direction="vertical" className="w-full" size="middle">
            <div className="rounded border border-line bg-paper p-3 whitespace-pre-wrap">{selected.content}</div>
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item name="adminReply" label="管理员回复">
                <Input.TextArea rows={4} maxLength={2000} showCount />
              </Form.Item>
              <Form.Item name="status" label="处理状态">
                <Select
                  options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))}
                />
              </Form.Item>
              <Form.Item name="isPublic" label="公开展示" valuePropName="checked">
                <Switch checkedChildren="公开" unCheckedChildren="私密" />
              </Form.Item>
            </Form>
          </Space>
        ) : null}
      </Modal>
    </Card>
  );
}
