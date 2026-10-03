"use client";

import Link from "next/link";
import { Button, Layout, Menu } from "antd";
import { BookOpen, Inbox, ListMusic, Users } from "lucide-react";

const { Sider, Header, Content } = Layout;

export default function AdminShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <Layout className="admin-layout">
      <Sider breakpoint="lg" collapsedWidth="0">
        <div className="h-16 px-[18px] py-[22px] font-semibold text-white">
          <Link href="/admin">招摇书院 · 管理</Link>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          items={[
            { key: "home", icon: <Inbox size={16} />, label: <Link href="/admin">概览</Link> },
            {
              key: "playlists",
              icon: <ListMusic size={16} />,
              label: <Link href="/admin/playlists">歌单</Link>,
            },
            {
              key: "books",
              icon: <BookOpen size={16} />,
              label: <Link href="/admin/books">书单</Link>,
            },
            {
              key: "mailbox",
              icon: <Inbox size={16} />,
              label: <Link href="/admin/mailbox">棉花糖</Link>,
            },
            { key: "users", icon: <Users size={16} />, label: "用户" },
          ]}
        />
      </Sider>
      <Layout>
        <Header className="flex items-center justify-between px-6" style={{ background: "#fff" }}>
          <strong>内容运营台</strong>
          <div className="flex items-center gap-3">
            <Link href="/">回到用户端</Link>
            <Button
              type="text"
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
              退出登录
            </Button>
          </div>
        </Header>
        <Content className="p-6">{children}</Content>
      </Layout>
    </Layout>
  );
}
