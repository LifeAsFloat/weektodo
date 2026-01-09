# WeekToDo Docker 镜像 - WebDAV 代理使用说明

## 🎉 好消息

从 v2.2.0 版本开始，WeekToDo 的 Docker 镜像**内置了 WebDAV 代理服务器**，在浏览器中使用时会**自动启用**，无需任何额外配置！

## 快速开始

### 1. 启动 Docker 容器

```bash
# 方式一：使用 docker-compose（推荐）
docker-compose up -d app-prod

# 方式二：手动运行
docker build -f Dockerfile.prod -t weektodo:prod .
docker run -d -p 80:80 --name weektodo weektodo:prod
```

### 2. 访问应用

在浏览器中打开: http://localhost

### 3. 配置 WebDAV（零配置！）

在应用设置中：
1. ✅ 启用 WebDAV 同步
2. 📝 填写你的 WebDAV 服务器地址（如坚果云、Nextcloud）
3. 🔐 填写用户名和密码
4. 💾 点击保存

**就这么简单！** 应用会自动使用内置的代理服务器，完全避免 CORS 问题。

## 工作原理

```
浏览器 → Nginx → 内置代理服务器 → 你的 WebDAV 服务器
```

- 当你在浏览器中访问 WeekToDo 时，应用会自动检测环境
- 所有 WebDAV 请求自动通过内置代理服务器转发
- 完全透明，无需任何手动配置

## 控制台日志

打开浏览器开发者工具，你会看到：

```
🔧 浏览器生产环境: 使用内置代理
   目标服务器: https://dav.jianguoyun.com/dav/
   代理地址: http://localhost/webdav-proxy/...
   提示: 如需使用外部代理，请在设置中配置代理服务器
```

## 常见问题

### Q: 需要在设置中配置代理服务器吗？
**A:** 不需要！默认会自动使用内置代理。只有当你想使用外部代理服务器时才需要配置。

### Q: 与 Electron 桌面版有什么区别？
**A:** 
- **桌面版**: 直接连接 WebDAV，无需代理
- **Docker 版**: 自动使用内置代理，同样无缝体验

### Q: 可以给其他应用使用这个代理吗？
**A:** 可以！编辑 `docker-compose.yml`，取消注释 `3001:3001` 端口，然后其他应用可以使用 `http://your-server:3001/webdav-proxy/` 作为代理地址。

### Q: 如何检查代理服务器是否正常运行？
**A:** 访问 http://localhost/health 查看健康状态。

## 故障排查

如果遇到问题，查看容器日志：

```bash
# 查看日志
docker logs weektodo-prod

# 实时查看日志
docker logs -f weektodo-prod

# 重启容器
docker-compose restart app-prod
```

## 技术细节

想了解更多技术细节？查看：
- [DOCKER_WEBDAV_GUIDE.md](./DOCKER_WEBDAV_GUIDE.md) - 完整技术文档
- [WEBDAV_PROXY_GUIDE.md](./WEBDAV_PROXY_GUIDE.md) - 外部代理部署指南

## 升级说明

从旧版本升级：
1. **有外部代理配置**: 保持不变，应用会优先使用你的外部代理
2. **无代理配置**: 自动使用新的内置代理，享受零配置体验！

---

**享受无缝的 WebDAV 同步体验！** 🚀
