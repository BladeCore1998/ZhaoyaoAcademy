"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, ConfigProvider, Dropdown, Drawer, Layout, Menu, Tag, Typography } from "antd";
import {
  BookOpen,
  DoorOpen,
  Flower2,
  House,
  Inbox,
  LayoutDashboard,
  Leaf,
  ListMusic,
  Menu as MenuIcon,
  Palette,
  Snowflake,
  Sun,
  Users,
  X,
} from "lucide-react";
import { getCurrentSeason, type Season, type SeasonPreference } from "@/lib/season";

const { Sider, Header, Content } = Layout;

const seasonOptions: Record<Season, { label: string; shortLabel: string; primary: string; icon: React.ReactNode }> = {
  spring: { label: "春 · 桃花书院", shortLabel: "春日", primary: "#527665", icon: <Flower2 size={16} /> },
  summer: { label: "夏 · 荷风书院", shortLabel: "夏日", primary: "#317e7d", icon: <Sun size={16} /> },
  autumn: { label: "秋 · 金桂书院", shortLabel: "秋日", primary: "#a43e35", icon: <Leaf size={16} /> },
  winter: { label: "冬 · 瑞雪书院", shortLabel: "冬日", primary: "#526783", icon: <Snowflake size={16} /> },
};

const baseAdminTheme = {
  token: {
    colorPrimary: "#a43e35",
    colorInfo: "#587d72",
    colorSuccess: "#52795e",
    colorWarning: "#b48649",
    colorError: "#a43e35",
    colorText: "#26352f",
    colorTextSecondary: "#697870",
    colorBorder: "#dce4de",
    colorBgContainer: "#fffefa",
    colorBgLayout: "#eef2ed",
    borderRadius: 6,
    fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
    controlHeight: 38,
  },
  components: {
    Button: { primaryShadow: "none", defaultShadow: "none" },
    Card: { headerBg: "transparent" },
    Menu: {
      darkItemBg: "transparent",
      darkItemColor: "#d9e6df",
      darkItemHoverBg: "rgba(226, 241, 231, 0.1)",
      darkItemSelectedBg: "#e9f1e9",
      darkItemSelectedColor: "#254b3f",
      itemBorderRadius: 6,
    },
    Table: {
      headerBg: "#f3f6f1",
      headerColor: "#52645b",
      rowHoverBg: "#f5f8f4",
      borderColor: "#e6ebe5",
    },
  },
};

function getNavigationItems(onNavigate?: () => void) {
  return [
    {
      key: "home",
      icon: <LayoutDashboard size={16} />,
      label: (
        <Link onClick={onNavigate} href="/admin">
          书院概览
        </Link>
      ),
    },
    {
      key: "playlists",
      icon: <ListMusic size={16} />,
      label: (
        <Link onClick={onNavigate} href="/admin/playlists">
          歌单典藏
        </Link>
      ),
    },
    {
      key: "books",
      icon: <BookOpen size={16} />,
      label: (
        <Link onClick={onNavigate} href="/admin/books">
          书卷典藏
        </Link>
      ),
    },
    {
      key: "mailbox",
      icon: <Inbox size={16} />,
      label: (
        <Link onClick={onNavigate} href="/admin/mailbox">
          棉花糖信箱
        </Link>
      ),
    },
    {
      key: "users",
      icon: <Users size={16} />,
      label: (
        <Link onClick={onNavigate} href="/admin/users">
          弟子名录
        </Link>
      ),
    },
  ];
}

const pageInfo: Record<string, { title: string; section: string }> = {
  home: { title: "书院概览", section: "总览" },
  playlists: { title: "歌单典藏", section: "内容管理" },
  books: { title: "书卷典藏", section: "内容管理" },
  mailbox: { title: "棉花糖信箱", section: "互动管理" },
  users: { title: "弟子名录", section: "弟子管理" },
};

export default function AdminShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentSeason, setCurrentSeason] = useState<Season>(getCurrentSeason);
  const [seasonPreference, setSeasonPreference] = useState<SeasonPreference>("auto");
  const activeSeason = seasonPreference === "auto" ? currentSeason : seasonPreference;
  const selectedKey =
    pathname === "/admin"
      ? "home"
      : pathname.startsWith("/admin/playlists")
        ? "playlists"
        : pathname.startsWith("/admin/books")
          ? "books"
          : pathname.startsWith("/admin/mailbox")
            ? "mailbox"
            : pathname.startsWith("/admin/users")
              ? "users"
              : "home";
  const currentPage = pageInfo[selectedKey];

  useEffect(() => {
    const savedPreference = window.localStorage.getItem("admin-season-theme");
    if (
      savedPreference === "auto" ||
      (savedPreference !== null && Object.keys(seasonOptions).includes(savedPreference))
    ) {
      setSeasonPreference(savedPreference as SeasonPreference);
    }
    const updateSeason = () => setCurrentSeason(getCurrentSeason());
    const timer = window.setInterval(updateSeason, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  function selectSeason(preference: SeasonPreference) {
    setSeasonPreference(preference);
    window.localStorage.setItem("admin-season-theme", preference);
  }

  const theme = {
    ...baseAdminTheme,
    token: { ...baseAdminTheme.token, colorPrimary: seasonOptions[activeSeason].primary },
    components: {
      ...baseAdminTheme.components,
      Menu: {
        ...baseAdminTheme.components.Menu,
        darkItemSelectedColor: seasonOptions[activeSeason].primary,
      },
    },
  };
  const seasonMenuItems = [
    {
      key: "auto",
      icon: <Palette size={16} />,
      label: `跟随时令 · ${seasonOptions[currentSeason].shortLabel}`,
    },
    { type: "divider" as const },
    ...Object.entries(seasonOptions).map(([key, option]) => ({
      key,
      icon: option.icon,
      label: option.label,
    })),
  ];

  return (
    <ConfigProvider theme={theme}>
      <Layout className="admin-layout" data-season={activeSeason}>
        <Sider className="admin-desktop-sider" breakpoint="lg" collapsedWidth="0" trigger={null}>
          <Link className="admin-brand" href="/admin">
            <span className="admin-brand-art" aria-hidden />
            <span className="admin-brand-seal">
              <img src="/inspiration/TouXiang.webp" alt="" />
            </span>
            <span className="admin-brand-copy">
              <strong>招摇书院</strong>
              <small>SHU YUAN · 管理处</small>
            </span>
          </Link>
          <div className="admin-nav-label">书院事务</div>
          <Menu theme="dark" mode="inline" selectedKeys={[selectedKey]} items={getNavigationItems()} />
          <div className="admin-sider-footer">
            <span className="admin-online-dot" />
            书院日常 · 正常运行
          </div>
        </Sider>
        <Layout className="admin-main-layout">
          <Header className="admin-header">
            <div className="admin-header-left">
              <Button
                className="admin-mobile-menu-button"
                type="text"
                aria-label="打开管理菜单"
                icon={<MenuIcon size={20} />}
                onClick={() => setMobileMenuOpen(true)}
              />
              <div>
                <div className="admin-breadcrumb">
                  <span>招摇书院</span>
                  <span className="admin-breadcrumb-divider">/</span>
                  <span>{currentPage.section}</span>
                </div>
                <Typography.Text strong className="admin-header-title">
                  {currentPage.title}
                </Typography.Text>
              </div>
            </div>
            <div className="admin-header-right">
              <Dropdown
                menu={{
                  items: seasonMenuItems,
                  selectedKeys: [seasonPreference],
                  onClick: ({ key }) => selectSeason(key as SeasonPreference),
                }}
                trigger={["click"]}
                placement="bottomRight"
              >
                <Button className="admin-season-button" icon={<Palette size={15} />}>
                  <span>{seasonOptions[activeSeason].shortLabel}书院</span>
                </Button>
              </Dropdown>
              <Tag className="admin-header-status" variant="filled" color="success">
                <span className="admin-online-dot" />
                管理端
              </Tag>
              <Link className="admin-back-link" href="/">
                <House size={15} />
                <span>返回前台</span>
              </Link>
              <Button
                className="admin-signout-button"
                type="text"
                icon={<DoorOpen size={16} />}
                onClick={async () => {
                  await fetch("/api/auth/sign-out", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: "{}",
                    credentials: "same-origin",
                  });
                  window.location.href = "/login";
                }}
              >
                退出
              </Button>
            </div>
          </Header>
          <Content className="admin-content">{children}</Content>
        </Layout>
        <Drawer
          className={`admin-mobile-drawer admin-mobile-drawer-${activeSeason}`}
          title={
            <Link className="admin-drawer-brand" href="/admin">
              <span className="admin-brand-seal">
                <img src="/inspiration/TouXiang.webp" alt="" />
              </span>
              <span>招摇书院</span>
            </Link>
          }
          placement="left"
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          closeIcon={<X size={18} />}
          size={280}
          styles={{ body: { padding: 0 } }}
        >
          <Menu mode="inline" selectedKeys={[selectedKey]} items={getNavigationItems(() => setMobileMenuOpen(false))} />
        </Drawer>
      </Layout>
    </ConfigProvider>
  );
}
