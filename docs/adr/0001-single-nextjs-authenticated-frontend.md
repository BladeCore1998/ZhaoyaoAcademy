# 使用单一 Next.js 应用承载用户端、管理端与认证

项目采用一个 Next.js App Router 应用，同时提供根路径用户端、`/admin` 管理端和认证 Route Handlers。这样可以共享 Better Auth 会话、角色权限和类型，避免两个前端应用之间重复维护登录态。

## Considered Options

- 两个独立前端：边界清晰，但需要额外部署和同步认证状态。
- 单一 Next.js 应用：部署简单，认证和共享数据模型统一，因此采用此方案。

