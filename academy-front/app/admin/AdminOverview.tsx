"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Alert, Card, Col, Row, Skeleton, Statistic } from "antd";
import { ArrowUpRight } from "lucide-react";

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

  useEffect(() => {
    fetch("/api/admin/overview", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error((await response.json().catch(() => null))?.error);
        return response.json();
      })
      .then(setData)
      .catch((reason: Error) => setError(reason.message || "统计加载失败"));
  }, []);

  return (
    <div>
      <div className="mb-5">
        <p className="eyebrow">后台总览</p>
        <h1 className="text-[32px]">今日书院</h1>
      </div>
      {error ? <Alert className="mb-4" type="error" showIcon message={error} /> : null}
      {!data ? (
        <Card><Skeleton active /></Card>
      ) : (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={8}>
            <Card><Statistic title="待处理棉花糖" value={data.pendingMarshmallows} /></Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card><Statistic title="已发布歌单" value={data.publishedPlaylists} suffix={`/ ${data.playlistTotal}`} /></Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card><Statistic title="已发布书单" value={data.publishedBooks} suffix={`/ ${data.bookTotal}`} /></Card>
          </Col>
        </Row>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/admin/playlists"><Card size="small" hoverable>管理歌单 <ArrowUpRight size={15} /></Card></Link>
        <Link href="/admin/books"><Card size="small" hoverable>管理书单 <ArrowUpRight size={15} /></Card></Link>
        <Link href="/admin/mailbox"><Card size="small" hoverable>审核棉花糖 <ArrowUpRight size={15} /></Card></Link>
      </div>
    </div>
  );
}
