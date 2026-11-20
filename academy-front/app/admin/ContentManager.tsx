"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  App,
  Button,
  Card,
  Form,
  Image,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Upload,
} from "antd";
import type { UploadProps } from "antd";
import { Edit3, ImagePlus, Plus, Search, Sparkles, Trash2 } from "lucide-react";

type ContentRecord = {
  id: number;
  songName?: string;
  artist?: string;
  language?: string;
  style?: string;
  bookName?: string;
  author?: string;
  category?: string;
  country?: string;
  status?: string;
  summary: string | null;
  coverUrl: string | null;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
};

type ContentManagerProps = {
  resource: "playlists" | "books";
  title: string;
};

type ContentFilters = {
  keyword: string;
  first: string;
  second: string;
  status: string;
  visibility: "all" | "published" | "draft";
};

const songStyles = ["流行", "古风", "抒情", "民谣", "中国风", "其他"];

// 未读：暖灰（弱化）；在读：实心琥珀（焦点）；已读：浅墨玉绿（完成但不抢眼）
const readingStatusTagProps: Record<string, { color: string; variant?: "solid" }> = {
  未读: { color: "#968b7d" },
  在读: { color: "#b45309", variant: "solid" },
  已读: { color: "#2f6b56" },
};

const readingStatusTag = (status: string) => readingStatusTagProps[status] ?? readingStatusTagProps["未读"];

export default function ContentManager({ resource, title }: ContentManagerProps) {
  const { message } = App.useApp();
  const isPlaylist = resource === "playlists";
  const nameField = isPlaylist ? "songName" : "bookName";
  const nameLabel = isPlaylist ? "歌名" : "书名";
  const firstField = isPlaylist ? "language" : "category";
  const secondField = isPlaylist ? "style" : "country";
  const creatorField = isPlaylist ? "artist" : "author";
  const firstLabel = isPlaylist ? "语言" : "类型";
  const secondLabel = isPlaylist ? "风格" : "国家";
  const bookStatusOptions = ["未读", "在读", "已读"];
  const [rows, setRows] = useState<ContentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ContentRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [resolvingCover, setResolvingCover] = useState(false);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [queryForm] = Form.useForm<ContentFilters>();
  const pendingValues = useRef<Record<string, unknown> | null>(null);
  const [filters, setFilters] = useState<ContentFilters>({
    keyword: "",
    first: "",
    second: "",
    status: "",
    visibility: "all",
  });

  const firstOptions = useMemo(
    () =>
      Array.from(
        new Set(rows.map((row) => row[firstField as keyof ContentRecord]).filter((value): value is string => !!value)),
      ).sort(),
    [firstField, rows],
  );
  const secondOptions = useMemo(
    () =>
      Array.from(
        new Set(
          (isPlaylist ? songStyles : rows.map((row) => row[secondField as keyof ContentRecord])).filter(
            (value): value is string => !!value,
          ),
        ),
      ).sort(),
    [isPlaylist, secondField, rows],
  );

  const filteredRows = rows.filter((row) => {
    const keyword = filters.keyword.toLocaleLowerCase();
    const searchable = [
      row[nameField as keyof ContentRecord],
      row.artist,
      row.language,
      row.style,
      row.author,
      row.category,
      row.country,
      row.status,
      row.summary,
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase();
    const matchesKeyword = !keyword || searchable.includes(keyword);
    const matchesFirst = !filters.first || row[firstField as keyof ContentRecord] === filters.first;
    const matchesSecond = !filters.second || row[secondField as keyof ContentRecord] === filters.second;
    const matchesStatus = isPlaylist || !filters.status || row.status === filters.status;
    const matchesVisibility =
      filters.visibility === "all" || (filters.visibility === "published" ? row.isPublished : !row.isPublished);
    return matchesKeyword && matchesFirst && matchesSecond && matchesStatus && matchesVisibility;
  });

  const load = useCallback(async () => {
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
  }, [resource]);

  useEffect(() => {
    void load();
  }, [load]);

  function openEditor(record?: ContentRecord) {
    // 弹窗里的 Form 在打开前还没挂载，先暂存初值，等弹窗渲染后再写入
    pendingValues.current = record ?? {
      [nameField]: "",
      ...(isPlaylist
        ? { artist: "", language: "", style: "其他" }
        : { author: "", category: "", country: "", status: "未读" }),
      summary: "",
      coverUrl: "",
      isPublished: false,
      sortOrder: rows.length ? Math.max(...rows.map((row) => row.sortOrder)) + 1 : 0,
    };
    setEditing(record ?? null);
    setOpen(true);
  }

  useEffect(() => {
    if (!open || !pendingValues.current) return;
    form.setFieldsValue(pendingValues.current);
    pendingValues.current = null;
  }, [open, form]);

  async function handleSubmit(values: Record<string, unknown>) {
    setSaving(true);
    const response = await fetch(`/api/admin/${resource}${editing ? `/${editing.id}` : ""}`, {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
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

  async function requestCover(title: string, creator: string) {
    const response = await fetch("/api/admin/covers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: isPlaylist ? "song" : "book", title, creator }),
    });
    const result = (await response.json().catch(() => null)) as {
      url: string;
      source: string;
      score: number;
      title: string;
      creator: string;
      error?: string;
    } | null;
    if (!response.ok || !result?.url) {
      throw new Error(result?.error ?? "没有找到匹配的封面");
    }
    return result;
  }

  function describeCover(result: { title: string; creator: string; source: string; score: number }) {
    return `${result.title}${result.creator ? ` - ${result.creator}` : ""}（${result.source}，${result.score} 分）`;
  }

  async function handleResolveCover() {
    const title = String(form.getFieldValue(nameField) ?? "").trim();
    const creator = String(form.getFieldValue(creatorField) ?? "").trim();
    if (!title) {
      message.warning(`请先填写${nameLabel}`);
      return;
    }

    setResolvingCover(true);
    try {
      const result = await requestCover(title, creator);
      form.setFieldValue("coverUrl", result.url);
      message.success(`已解析：${describeCover(result)}`);
    } catch (error) {
      message.warning(error instanceof Error ? error.message : "封面解析失败");
    } finally {
      setResolvingCover(false);
    }
  }

  async function resolveRecordCover(record: ContentRecord) {
    const title = String(record[nameField as keyof ContentRecord] ?? "").trim();
    const creator = String(record[creatorField as keyof ContentRecord] ?? "").trim();
    if (!title) return;

    setResolvingId(record.id);
    try {
      const result = await requestCover(title, creator);
      const response = await fetch(`/api/admin/${resource}/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverUrl: result.url }),
      });
      if (!response.ok) {
        message.error((await response.json().catch(() => null))?.error ?? "封面保存失败");
        return;
      }
      message.success(`已更新封面：${describeCover(result)}`);
      await load();
    } catch (error) {
      message.warning(error instanceof Error ? error.message : "封面解析失败");
    } finally {
      setResolvingId(null);
    }
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
    <div className="admin-workspace">
      <div className="admin-workspace-header">
        <div>
          <p className="admin-workspace-kicker">书院典藏 · COLLECTION</p>
          <h1 className="admin-page-title">{title}</h1>
          <p className="admin-page-subtitle">整理内容，择时发布，与来访者分享心意。</p>
        </div>
        <Button type="primary" icon={<Plus size={16} />} onClick={() => openEditor()}>
          新建
        </Button>
      </div>
      <Card
        className="admin-workspace-panel"
        title="典藏目录"
        extra={
          <span className="admin-result-count">
            显示 {filteredRows.length} / {rows.length} 条
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
              first: values.first ?? "",
              second: values.second ?? "",
              status: values.status ?? "",
              visibility: values.visibility ?? "all",
            })
          }
        >
          <Form.Item name="keyword" className="admin-query-keyword">
            <Input
              allowClear
              placeholder={`搜索${nameLabel}、${firstLabel}、${secondLabel}或简介`}
              prefix={<Search size={15} />}
            />
          </Form.Item>
          <Form.Item name="first" className="admin-query-select">
            <Select
              allowClear
              placeholder={`全部${firstLabel}`}
              options={firstOptions.map((value) => ({ label: value, value }))}
            />
          </Form.Item>
          <Form.Item name="second" className="admin-query-select">
            <Select
              allowClear
              placeholder={`全部${secondLabel}`}
              options={secondOptions.map((value) => ({ label: value, value }))}
            />
          </Form.Item>
          {!isPlaylist ? (
            <Form.Item name="status" className="admin-query-select">
              <Select
                allowClear
                placeholder="全部阅读状态"
                options={bookStatusOptions.map((value) => ({ label: value, value }))}
              />
            </Form.Item>
          ) : null}
          <Form.Item name="visibility" className="admin-query-select">
            <Select
              allowClear
              placeholder="全部状态"
              options={[
                { label: "已发布", value: "published" },
                { label: "草稿", value: "draft" },
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
                setFilters({ keyword: "", first: "", second: "", status: "", visibility: "all" });
              }}
            >
              重置
            </Button>
          </div>
        </Form>
        <Table
          loading={loading}
          scroll={{ x: 1120 }}
          rowKey="id"
          dataSource={filteredRows}
          locale={{ emptyText: rows.length ? "没有符合条件的内容" : "暂无内容，先创建一条吧" }}
          columns={[
            {
              title: "封面",
              dataIndex: "coverUrl",
              width: 80,
              render: (url: string | null) =>
                url ? <Image alt="" width={44} height={44} preview src={url} /> : <ImagePlus size={18} />,
            },
            { title: nameLabel, dataIndex: nameField },
            ...(isPlaylist
              ? [
                  { title: "歌手", dataIndex: "artist" },
                  { title: "语言", dataIndex: "language" },
                  { title: "风格", dataIndex: "style", render: (value: string) => <Tag>{value}</Tag> },
                ]
              : [
                  { title: "作者", dataIndex: "author" },
                  {
                    title: "类型",
                    dataIndex: "category",
                    width: 96,
                    onCell: () => ({ style: { whiteSpace: "nowrap" } }),
                  },
                  { title: "国家", dataIndex: "country", width: 84 },
                  {
                    title: "阅读状态",
                    dataIndex: "status",
                    width: 112,
                    onCell: () => ({ style: { whiteSpace: "nowrap" } }),
                    render: (value: string) => <Tag {...readingStatusTag(value)}>{value}</Tag>,
                  },
                ]),
            {
              title: "简介",
              dataIndex: "summary",
              render: (summary: string | null) => summary || "未填写",
            },
            {
              title: "状态",
              dataIndex: "isPublished",
              render: (published: boolean) => (published ? <Tag color="green">已发布</Tag> : <Tag>草稿</Tag>),
            },
            {
              title: "创建时间",
              dataIndex: "createdAt",
              render: (value: string) => new Date(value).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }),
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
          rootClassName="admin-themed-modal"
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
            <Form.Item name={nameField} label={nameLabel} rules={[{ required: true, message: `请输入${nameLabel}` }]}>
              <Input placeholder={isPlaylist ? "例如：春水煎茶" : "例如：明朝那些事儿"} maxLength={255} />
            </Form.Item>
            {isPlaylist ? (
              <>
                <Form.Item name="artist" label="歌手" rules={[{ required: true, message: "请输入歌手" }]}>
                  <Input placeholder="例如：周杰伦" maxLength={255} />
                </Form.Item>
                <Form.Item name="language" label="语言" rules={[{ required: true, message: "请输入语言" }]}>
                  <Input placeholder="例如：华语" maxLength={64} />
                </Form.Item>
                <Form.Item name="style" label="风格" rules={[{ required: true, message: "请选择风格" }]}>
                  <Select options={songStyles.map((value) => ({ label: value, value }))} />
                </Form.Item>
              </>
            ) : (
              <>
                <Form.Item name="author" label="作者" rules={[{ required: true, message: "请输入作者" }]}>
                  <Input placeholder="例如：当年明月" maxLength={255} />
                </Form.Item>
                <Form.Item name="category" label="类型" rules={[{ required: true, message: "请输入类型" }]}>
                  <Input placeholder="例如：历史" maxLength={128} />
                </Form.Item>
                <Form.Item name="country" label="国家" rules={[{ required: true, message: "请输入国家" }]}>
                  <Input placeholder="例如：中国" maxLength={128} />
                </Form.Item>
                <Form.Item name="status" label="阅读状态" rules={[{ required: true, message: "请选择阅读状态" }]}>
                  <Select options={bookStatusOptions.map((value) => ({ label: value, value }))} />
                </Form.Item>
              </>
            )}
            <Form.Item name="summary" label="简介">
              <Input.TextArea rows={3} maxLength={1000} showCount />
            </Form.Item>
            <Form.Item label="封面地址" shouldUpdate>
              {(formInstance) => {
                const coverUrl = formInstance.getFieldValue("coverUrl") as string | undefined;
                return (
                  <>
                    <Space.Compact style={{ width: "100%" }}>
                      <Form.Item name="coverUrl" noStyle>
                        <Input placeholder="上传、解析或粘贴图片地址" />
                      </Form.Item>
                      <Button icon={<Sparkles size={16} />} loading={resolvingCover} onClick={handleResolveCover}>
                        解析封面
                      </Button>
                    </Space.Compact>
                    {coverUrl ? (
                      <Image
                        alt="封面预览"
                        src={coverUrl}
                        width={88}
                        height={88}
                        style={{ marginTop: 10, objectFit: "cover" }}
                      />
                    ) : null}
                  </>
                );
              }}
            </Form.Item>
            <Form.Item label="上传封面">
              <Upload {...uploadProps}>
                <Button icon={<ImagePlus size={16} />}>选择图片</Button>
              </Upload>
            </Form.Item>
            <Form.Item
              name="sortOrder"
              label="排序值"
              extra="数字越小越靠前；排序值相同时按创建时间倒序。"
              rules={[{ required: true, message: "请输入排序值" }]}
            >
              <InputNumber min={0} precision={0} style={{ width: "100%" }} placeholder="例如：1" />
            </Form.Item>
            <Form.Item name="isPublished" label="公开发布" valuePropName="checked">
              <Switch checkedChildren="已发布" unCheckedChildren="草稿" />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
}
