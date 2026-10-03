"use client";

import { useEffect, useState } from "react";
import { Alert, Avatar, Button, Card, Skeleton, Upload, message } from "antd";
import { ImagePlus, LogOut, UserRound } from "lucide-react";

type Session = {
  user?: {
    name?: string;
    email?: string;
    image?: string | null;
  };
};

export default function ProfilePanel() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/get-session", { cache: "no-store" })
      .then(async (response) => (response.ok ? response.json() : null))
      .then((value) => {
        setSession(value);
        setLoading(false);
      })
      .catch(() => {
        setError("会话加载失败，请重新登录");
        setLoading(false);
      });
  }, []);

  async function uploadAvatar(file: File) {
    setUploading(true);
    const body = new FormData();
    body.append("file", file);
    const response = await fetch("/api/profile/avatar", { method: "POST", body });
    setUploading(false);
    if (!response.ok) {
      message.error((await response.json().catch(() => null))?.error ?? "头像上传失败");
      return;
    }
    const result = await response.json();
    setSession((current) => (current ? { ...current, user: { ...current.user, image: result.url } } : current));
    message.success("头像已更新");
  }

  async function signOut() {
    setSigningOut(true);
    try {
      const response = await fetch("/api/auth/sign-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
        credentials: "same-origin",
      });
      if (!response.ok) {
        message.error("注销失败，请稍后再试");
        setSigningOut(false);
        return;
      }
      window.location.href = "/login";
    } catch {
      message.error("注销失败，请检查网络连接");
      setSigningOut(false);
    }
  }

  if (loading) return <Card><Skeleton active /></Card>;
  if (error) return <Alert type="error" showIcon message={error} />;
  if (!session?.user) {
    return <Alert type="info" showIcon message="请先登录后管理个人资料" />;
  }

  return (
    <Card
      title="我的资料"
      extra={
        <Button danger loading={signingOut} icon={<LogOut size={16} />} onClick={() => void signOut()}>
          注销
        </Button>
      }
    >
      <div className="flex flex-wrap items-center gap-5">
        <Avatar size={88} src={session.user.image ?? undefined} icon={<UserRound size={34} />} />
        <div>
          <h2 className="mb-1 text-xl">{session.user.name || "招摇书院用户"}</h2>
          <p className="mb-3 text-muted">{session.user.email}</p>
          <Upload
            accept="image/jpeg,image/png,image/webp,image/gif"
            showUploadList={false}
            beforeUpload={(file) => {
              void uploadAvatar(file);
              return false;
            }}
          >
            <Button loading={uploading} icon={<ImagePlus size={16} />}>上传头像</Button>
          </Upload>
        </div>
      </div>
    </Card>
  );
}
