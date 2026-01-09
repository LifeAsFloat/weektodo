# Docker 镜像内置 WebDAV 代理说明

## 功能特性

自 v2.2.0 起，Docker 生产镜像已内置 WebDAV 代理服务器，**浏览器环境下自动使用**，无需额外配置。

## 架构说明

Docker 镜像包含两个服务：
- **Nginx (端口 80)**: 提供 Web 界面
- **Node.js 代理服务器 (端口 3001)**: 处理 WebDAV 请求

Nginx 自动将 `/webdav-proxy/*` 请求转发到内置的代理服务器。

## 使用方法

### 1. 构建并启动 Docker 容器

```bash
# 使用 docker-compose（推荐）
docker-compose up -d app-prod

# 或者手动构建
docker build -f Dockerfile.prod -t weektodo:prod .
docker run -d -p 80:80 --name weektodo weektodo:prod
```

### 2. 访问应用

打开浏览器访问: http://localhost

### 3. 配置 WebDAV（零配置）

在 WeekToDo 设置中：
1. 启用 WebDAV 同步
2. 填写 WebDAV 服务器地址（如 `https://dav.jianguoyun.com/dav/`）
3. 填写用户名和密码
4. **无需配置代理** - 应用会自动使用内置代理

## 工作原理

当在浏览器中访问 WeekToDo 时：

1. **自动检测环境**: 检测到浏览器生产环境
2. **自动启用代理**: 将 WebDAV 请求发送到 `http://当前域名/webdav-proxy/`
3. **Nginx 转发**: Nginx 将请求转发到内部的 Node.js 代理服务器
4. **代理转发**: Node.js 服务器转发请求到实际的 WebDAV 服务器
5. **返回响应**: 带有 CORS 头的响应返回到浏览器

```
浏览器 → Nginx (80) → Node.js 代理 (3001) → WebDAV 服务器
   ↑                                                ↓
   └────────────── 返回数据（带 CORS） ─────────────┘
```

## 控制台日志

当使用 WebDAV 同步时，在浏览器开发者工具中会看到：

```
🔧 浏览器生产环境: 使用内置代理
   目标服务器: https://dav.jianguoyun.com/dav/
   代理地址: http://localhost/webdav-proxy/https%3A%2F%2Fdav.jianguoyun.com%2Fdav%2F
   提示: 如需使用外部代理，请在设置中配置代理服务器
```

## 健康检查

访问 http://localhost/health 检查代理服务器状态。

## 高级配置

### 使用外部代理服务器（可选）

如果需要使用外部代理服务器：

1. 在 WebDAV 设置中启用"使用代理服务器"
2. 填写外部代理地址（如 `https://your-proxy.com/webdav-proxy`）
3. 应用将优先使用外部代理

### 暴露代理端口（可选）

如果需要让其他应用使用这个代理服务器，编辑 `docker-compose.yml`:

```yaml
services:
  app-prod:
    ports:
      - "80:80"
      - "3001:3001"  # 取消注释这行
```

然后其他应用可以使用: `http://your-server:3001/webdav-proxy/`

## 环境对比

| 环境 | 代理方式 | 需要配置 |
|------|---------|---------|
| Electron 桌面版 | 无需代理 | ❌ 无 |
| 浏览器 - 开发模式 | 自动使用 `npm run serve` 的代理 | ❌ 无 |
| 浏览器 - 生产模式（Docker） | 自动使用内置代理 | ❌ 无 |
| 浏览器 - 生产模式（其他部署） | 需要外部代理 | ✅ 需要 |

## 故障排查

### 1. WebDAV 连接失败

检查代理服务是否正常：
```bash
# 进入容器
docker exec -it weektodo-prod sh

# 检查代理服务进程
ps aux | grep node

# 测试代理健康检查
wget -O- http://localhost:3001/health
```

### 2. 查看日志

```bash
# 查看容器日志
docker logs weektodo-prod

# 实时查看日志
docker logs -f weektodo-prod
```

### 3. 重启服务

```bash
docker-compose restart app-prod
```

## 性能建议

1. **局域网部署**: 如果 WebDAV 服务器在局域网内，考虑使用内网地址
2. **文件大小**: 代理服务器支持最大 100MB 的文件上传
3. **超时设置**: 代理请求超时时间为 5 分钟

## 安全说明

- 代理服务器**仅在容器内部**监听，外部无法直接访问（除非手动暴露端口）
- 所有 WebDAV 凭证通过 HTTPS Basic Auth 传输
- 代理服务器不存储任何 WebDAV 凭证或数据
- CORS 策略已配置为仅允许必要的 WebDAV 方法

## 从旧版本升级

如果之前手动配置了外部代理服务器：

1. **保持现有配置**: 应用会优先使用你配置的外部代理
2. **移除外部配置**: 如果想使用内置代理，在设置中禁用"使用代理服务器"
3. **无需更改 WebDAV 设置**: URL、用户名、密码等设置保持不变

## 相关文档

- [WEBDAV_PROXY_GUIDE.md](./WEBDAV_PROXY_GUIDE.md) - 外部代理服务器部署指南
- [WEBDAV_BROWSER_GUIDE.md](./WEBDAV_BROWSER_GUIDE.md) - 浏览器环境使用指南
- [DOCKER.md](./DOCKER.md) - Docker 部署完整指南
