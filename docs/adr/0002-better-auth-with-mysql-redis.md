# 使用 Better Auth、MySQL 与 Redis 管理登录会话

登录全部放在 `academy-front`，采用 Better Auth 配合 Drizzle、MySQL 和 Redis。

- **Redis 是在线会话的主存储**：登录创建、会话读取、续期、退出和批量撤销都通过 Better Auth 的 `secondaryStorage` 完成。会话值带 TTL，Redis 不存在或过期即视为未登录。
- **MySQL 保存身份与长期数据**：`user` 保存用户资料和角色，`account.password` 保存 Better Auth 生成的密码哈希，`verification` 保存需要持久化的验证记录。
- **MySQL 的 `session` 表保存会话副本**，用于适配器兼容、审计和后续运营查询；当前配置 `session.storeSessionInDatabase = true` 与 `session.preserveSessionInDatabase = true`，但 Redis 缺失或过期时不会回退到 MySQL，在线校验仍以 Redis 为唯一依据。
- Redis 中的会话值包含会话信息及创建会话时读取的用户快照；修改用户角色等高敏感属性后，应主动撤销该用户现有会话，使 Redis 快照失效。

首版角色为 `user` 与 `admin`，不开放公开注册管理员。
