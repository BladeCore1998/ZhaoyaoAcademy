"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Alert, Button, Card, Col, Flex, Progress, Row, Skeleton, Space, Statistic, Tag, Typography } from "antd";
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Inbox,
  ListMusic,
  Plus,
  RefreshCw,
  Sparkles,
  Users,
} from "lucide-react";

type Overview = {
  playlistTotal: number;
  publishedPlaylists: number;
  bookTotal: number;
  publishedBooks: number;
  pendingMarshmallows: number;
};

export default function AdminOverview() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/overview", { cache: "no-store" });
      if (!response.ok) {
        throw new Error((await response.json().catch(() => null))?.error);
      }
      setData(await response.json());
      setError("");
      setUpdatedAt(new Date());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message || "统计加载失败" : "统计加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const formattedUpdatedAt = updatedAt
    ? new Intl.DateTimeFormat("zh-CN", {
        timeZone: "Asia/Shanghai",
        hour: "2-digit",
        minute: "2-digit",
      }).format(updatedAt)
    : "尚未同步";
  const playlistRate = data?.playlistTotal ? Math.round((data.publishedPlaylists / data.playlistTotal) * 100) : 0;
  const bookRate = data?.bookTotal ? Math.round((data.publishedBooks / data.bookTotal) * 100) : 0;
  const pendingCount = data?.pendingMarshmallows ?? 0;

  const statCards = data
    ? [
        {
          href: "/admin/mailbox",
          title: "待处理棉花糖",
          value: data.pendingMarshmallows,
          icon: <Inbox size={18} />,
          tone: "warning",
          detail: data.pendingMarshmallows ? "有新的留言需要回应" : "当前没有待处理留言",
          tag: data.pendingMarshmallows ? "需要关注" : "已清空",
        },
        {
          href: "/admin/playlists",
          title: "歌单发布进度",
          value: data.publishedPlaylists,
          suffix: `/ ${data.playlistTotal}`,
          icon: <ListMusic size={18} />,
          tone: "red",
          detail: `${playlistRate}% 的歌单已公开`,
          progress: playlistRate,
          tag: "内容运营",
        },
        {
          href: "/admin/books",
          title: "书单发布进度",
          value: data.publishedBooks,
          suffix: `/ ${data.bookTotal}`,
          icon: <BookOpen size={18} />,
          tone: "gold",
          detail: `${bookRate}% 的书单已公开`,
          progress: bookRate,
          tag: "内容运营",
        },
      ]
    : [];

  const quickActions = [
    {
      href: "/admin/playlists",
      title: "管理歌单",
      description: "新增、编辑或发布歌单内容",
      icon: <ListMusic size={18} />,
    },
    {
      href: "/admin/books",
      title: "管理书单",
      description: "维护书目与公开状态",
      icon: <BookOpen size={18} />,
    },
    {
      href: "/admin/mailbox",
      title: "审核棉花糖",
      description: pendingCount ? `${pendingCount} 条留言等待处理` : "查看留言与回复记录",
      icon: <Inbox size={18} />,
      badge: pendingCount ? String(pendingCount) : undefined,
    },
    {
      href: "/admin/users",
      title: "管理用户",
      description: "查看账号与权限状态",
      icon: <Users size={18} />,
    },
  ];

  return (
    <div className="admin-overview">
      <Flex className="admin-overview-header" align="flex-start" justify="space-between" gap={16} wrap>
        <div>
          <p className="eyebrow">运营总览</p>
          <Typography.Title level={1} className="!mb-2 !text-[32px]">
            今日书院
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 admin-overview-lede">
            这里集中展示内容发布进度和需要优先处理的事项。
          </Typography.Paragraph>
        </div>
        <Space className="admin-overview-actions" wrap>
          <Typography.Text type="secondary" className="admin-overview-updated">
            更新于 {formattedUpdatedAt}
          </Typography.Text>
          <Button
            icon={<RefreshCw size={15} className={loading ? "animate-spin" : undefined} />}
            loading={loading}
            onClick={() => void loadOverview()}
          >
            刷新数据
          </Button>
        </Space>
      </Flex>

      {error ? (
        <Alert
          className="mb-5"
          type="error"
          showIcon
          message={error}
          action={
            <Button size="small" type="link" onClick={() => void loadOverview()}>
              重试
            </Button>
          }
        />
      ) : null}

      <section aria-labelledby="overview-stats-title">
        <Flex align="center" justify="space-between" className="mb-3">
          <div>
            <Typography.Title level={4} id="overview-stats-title" className="!mb-1">
              运营状态
            </Typography.Title>
            <Typography.Text type="secondary">内容发布与互动状态</Typography.Text>
          </div>
          {data ? (
            <Tag className="admin-sync-status" icon={<CheckCircle2 size={13} />} color="success">
              数据已同步
            </Tag>
          ) : null}
        </Flex>
        <Row gutter={[16, 16]}>
          {loading && !data ? (
            Array.from({ length: 3 }, (_, index) => (
              <Col xs={24} md={8} key={index}>
                <Card className="admin-stat-card">
                  <Skeleton active paragraph={{ rows: 2 }} />
                </Card>
              </Col>
            ))
          ) : !data ? (
            <Col span={24}>
              <Card className="admin-overview-empty">
                <Flex vertical align="center" gap={10}>
                  <Inbox size={24} />
                  <Typography.Text strong>暂时无法加载运营数据</Typography.Text>
                  <Typography.Text type="secondary">请检查网络连接后重试。</Typography.Text>
                  <Button type="primary" icon={<RefreshCw size={15} />} onClick={() => void loadOverview()}>
                    重新加载
                  </Button>
                </Flex>
              </Card>
            </Col>
          ) : (
            statCards.map((item) => (
              <Col xs={24} md={8} key={item.href}>
                <Link href={item.href} className="admin-stat-link" aria-label={`查看${item.title}`}>
                  <Card className={`admin-stat-card admin-stat-card-${item.tone}`} hoverable>
                    <Flex justify="space-between" align="flex-start" gap={12}>
                      <div className="admin-stat-icon">{item.icon}</div>
                      <Tag variant="filled">{item.tag}</Tag>
                    </Flex>
                    <Statistic className="mt-4" title={item.title} value={item.value} suffix={item.suffix} />
                    {typeof item.progress === "number" ? (
                      <Progress
                        className="admin-stat-progress"
                        percent={item.progress}
                        showInfo={false}
                        size="small"
                        strokeColor="var(--admin-primary)"
                      />
                    ) : null}
                    <Flex className="mt-3" align="center" justify="space-between" gap={8}>
                      <Typography.Text type="secondary">{item.detail}</Typography.Text>
                      <ArrowUpRight size={16} aria-hidden />
                    </Flex>
                  </Card>
                </Link>
              </Col>
            ))
          )}
        </Row>
      </section>

      <Row gutter={[16, 16]} className="mt-7">
        <Col xs={24} lg={16}>
          <Card
            title={
              <Flex align="center" gap={8}>
                <Sparkles size={17} />
                <span>快捷操作</span>
              </Flex>
            }
            className="admin-quick-actions-card"
          >
            <Row gutter={[12, 12]}>
              {quickActions.map((action) => (
                <Col xs={24} sm={12} key={action.href}>
                  <Link href={action.href} className="admin-quick-action">
                    <Flex align="center" gap={12}>
                      <span className="admin-quick-action-icon">{action.icon}</span>
                      <span className="min-w-0 flex-1">
                        <Flex align="center" gap={8}>
                          <Typography.Text strong>{action.title}</Typography.Text>
                          {action.badge ? <Tag color="red">{action.badge}</Tag> : null}
                        </Flex>
                        <Typography.Text type="secondary" ellipsis>
                          {action.description}
                        </Typography.Text>
                      </span>
                      <ArrowUpRight size={16} aria-hidden />
                    </Flex>
                  </Link>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card className="admin-attention-card" title="今日提醒">
            <Flex vertical gap={14}>
              <Flex align="flex-start" gap={10}>
                <Clock3 size={17} className="admin-attention-icon" />
                <div>
                  <Typography.Text strong>
                    {pendingCount ? `${pendingCount} 条棉花糖待处理` : "棉花糖已全部处理"}
                  </Typography.Text>
                  <Typography.Paragraph type="secondary" className="!mb-0">
                    {pendingCount ? "建议优先回复并确认公开状态。" : "可以把时间留给内容整理和发布。"}
                  </Typography.Paragraph>
                </div>
              </Flex>
              <Flex align="flex-start" gap={10}>
                <Plus size={17} className="admin-attention-icon" />
                <div>
                  <Typography.Text strong>保持内容新鲜</Typography.Text>
                  <Typography.Paragraph type="secondary" className="!mb-0">
                    定期更新歌单和书单，让用户端首页更有活力。
                  </Typography.Paragraph>
                </div>
              </Flex>
            </Flex>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
