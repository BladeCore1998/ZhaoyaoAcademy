"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Form,
  Image,
  Input,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
  Upload,
  message,
} from "antd";
import type { UploadProps } from "antd";
import { Edit3, ImagePlus, Plus, Trash2 } from "lucide-react";

type ContentRecord = {
  id: number;
  title: string;
  summary: string | null;
  coverUrl: string | null;
  isPublished: boolean;
  createdAt: string;
};

type ContentManagerProps = {
  resource: "playlists" | "books";
  title: string;
};

export default function ContentManager({ resource, title }: ContentManagerProps) {
  const [rows, setRows] = useState<ContentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ContentRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  async function load() {
    setLoading(true);
    const response = await fetch(`/api/admin/${resource}`, { cache: "no-store" });
    if (!response.ok) {
      setError((await response.json().catch(() => null))?.error ?? "内容加载失败");
      setLoading(false);
      return;
    }
    setRows(await response.json());
    setError("");
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [resource]);

  function openEditor(record?: ContentRecord) {
    setEditing(record ?? null);
    form.setFieldsValue(
      record ?? { title: "", summary: "", coverUrl: "", isPublished: false },
    );
    setOpen(true);
  }

  async function handleSubmit(values: Record<string, unknown>) {
    setSaving(true);
    const response = await fetch(
      `/api/admin/${resource}${editing ? `/${editing.id}` : ""}`,
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      },
    );
    setSaving(false);
    if (!response.ok) {
      message.error((await response.json().catch(() => null))?.error ?? "保存失败");
      return;
    }
    message.success(editing ? "内容已更新" : "内容已创建");
    setOpen(false);
    await load();
  }

  async function remove(id: number) {
    const response = await fetch(`/api/admin/${resource}/${id}`, { method: "DELETE" });
    if (!response.ok) {
      message.error("删除失败");
      return;
    }
    message.success("内容已删除");
    await load();
  }

  const uploadProps: UploadProps = {
    accept: "image/jpeg,image/png,image/webp,image/gif",
    showUploadList: false,
    beforeUpload: async (file) => {
      const body = new FormData();
      body.append("file", file);
      body.append("kind", "cover");
      const response = await fetch("/api/uploads", { method: "POST", body });
      if (!response.ok) {
        message.error((await response.json().catch(() => null))?.error ?? "图片上传失败");
        return false;
      }
      const result = await response.json();
      form.setFieldValue("coverUrl", result.url);
      message.success("图片已上传");
      return false;
    },
  };

  return (
    <Card
      title={title}
      extra={
        <Button type="primary" icon={<Plus size={16} />} onClick={() => openEditor()}>
          新建
        </Button>
      }
    >
      {error ? <Alert className="mb-4" type="error" showIcon message={error} /> : null}
      <Table
        loading={loading}
        rowKey="id"
        dataSource={rows}
        locale={{ emptyText: "暂无内容，先创建一条吧" }}
        columns={[
          {
            title: "封面",
            dataIndex: "coverUrl",
            width: 80,
            render: (url: string | null) =>
              url ? <Image width={44} height={44} preview src={url} /> : <ImagePlus size={18} />,
          },
          { title: "标题", dataIndex: "title" },
          {
            title: "简介",
            dataIndex: "summary",
            render: (summary: string | null) => summary || "未填写",
          },
          {
            title: "状态",
            dataIndex: "isPublished",
            render: (published: boolean) =>
              published ? <Tag color="green">已发布</Tag> : <Tag>草稿</Tag>,
          },
          {
            title: "创建时间",
            dataIndex: "createdAt",
            render: (value: string) => new Date(value).toLocaleString("zh-CN"),
          },
          {
            title: "操作",
            key: "actions",
            render: (_: unknown, record: ContentRecord) => (
              <Space>
                <Button type="link" icon={<Edit3 size={15} />} onClick={() => openEditor(record)}>
                  编辑
                </Button>
                <Popconfirm title="确定删除这条内容吗？" onConfirm={() => remove(record.id)}>
                  <Button danger type="text" icon={<Trash2 size={15} />}>
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
      <Modal
        title={editing ? `编辑${title}` : `新建${title}`}
        open={open}
        okText="保存"
        cancelText="取消"
        confirmLoading={saving}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: "请输入标题" }]}>
            <Input placeholder="例如：春水煎茶" maxLength={255} />
          </Form.Item>
          <Form.Item name="summary" label="简介">
            <Input.TextArea rows={3} maxLength={1000} showCount />
          </Form.Item>
          <Form.Item name="coverUrl" label="封面地址">
            <Input placeholder="上传图片后自动填写，也可粘贴地址" />
          </Form.Item>
          <Form.Item label="上传封面">
            <Upload {...uploadProps}>
              <Button icon={<ImagePlus size={16} />}>选择图片</Button>
            </Upload>
          </Form.Item>
          <Form.Item name="isPublished" label="公开发布" valuePropName="checked">
            <Switch checkedChildren="已发布" unCheckedChildren="草稿" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
