"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Card, Form, Input, Modal, Select, Space, Switch, Table, Tag, message } from "antd";
import { Inbox, MessageCircle, Search } from "lucide-react";

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

type MailboxFilters = {
  keyword: string;
  status: MailboxRecord["status"] | undefined;
  visibility: "public" | "private" | undefined;
};

export default function MailboxManager() {
  const [rows, setRows] = useState<MailboxRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<MailboxRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [queryForm] = Form.useForm<MailboxFilters>();
  const [filters, setFilters] = useState<MailboxFilters>({
    keyword: "",
    status: undefined,
    visibility: undefined,
  });

  const filteredRows = rows.filter((row) => {
    const keyword = filters.keyword.toLocaleLowerCase();
    const matchesKeyword =
      !keyword ||
      row.content.toLocaleLowerCase().includes(keyword) ||
      (row.adminReply ?? "").toLocaleLowerCase().includes(keyword);
    const matchesStatus = !filters.status || row.status === filters.status;
    const matchesVisibility = !filters.visibility || (filters.visibility === "public" ? row.isPublic : !row.isPublic);
    return matchesKeyword && matchesStatus && matchesVisibility;
  });

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
    <div className="admin-workspace">
      <div className="admin-workspace-header">
        <div>
          <p className="admin-workspace-kicker">书院来信 · CORRESPONDENCE</p>
          <h1 className="admin-page-title">棉花糖信箱</h1>
          <p className="admin-page-subtitle">认真收下每一份来信，回复并管理公开展示。</p>
        </div>
        <span className="admin-workspace-count">
          <Inbox size={16} />
          {rows.filter((row) => row.status === "pending").length} 待处理
        </span>
      </div>
      <Card
        className="admin-workspace-panel"
        title="来信记录"
        extra={
          <span className="admin-result-count">
            显示 {filteredRows.length} / {rows.length} 封
          </span>
        }
      >
        {error ? <Alert className="mb-4" type="error" showIcon message={error} /> : null}
        <Form
          form={queryForm}
          className="admin-query-toolbar"
          onFinish={(values) =>
            setFilters({
              keyword: values.keyword?.trim() ?? "",
              status: values.status,
              visibility: values.visibility,
            })
          }
        >
          <Form.Item name="keyword" className="admin-query-keyword">
            <Input allowClear placeholder="搜索来信或回复内容" prefix={<Search size={15} />} />
          </Form.Item>
          <Form.Item name="status" className="admin-query-select">
            <Select
              allowClear
              placeholder="全部处理状态"
              options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))}
            />
          </Form.Item>
          <Form.Item name="visibility" className="admin-query-select">
            <Select
              allowClear
              placeholder="全部展示状态"
              options={[
                { label: "公开展示", value: "public" },
                { label: "仅管理员可见", value: "private" },
              ]}
            />
          </Form.Item>
          <div className="admin-query-actions">
            <Button type="primary" htmlType="submit">
              查询
            </Button>
            <Button
              onClick={() => {
                queryForm.resetFields();
                setFilters({ keyword: "", status: undefined, visibility: undefined });
              }}
            >
              重置
            </Button>
          </div>
        </Form>
        <Table
          loading={loading}
          scroll={{ x: 760 }}
          rowKey="id"
          dataSource={filteredRows}
          locale={{ emptyText: rows.length ? "没有符合条件的棉花糖" : "暂无棉花糖" }}
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
              render: (value: string) => new Date(value).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }),
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
          rootClassName="admin-themed-modal"
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
                  <Select options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))} />
                </Form.Item>
                <Form.Item name="isPublic" label="公开展示" valuePropName="checked">
                  <Switch checkedChildren="公开" unCheckedChildren="私密" />
                </Form.Item>
              </Form>
            </Space>
          ) : null}
        </Modal>
      </Card>
    </div>
  );
}
