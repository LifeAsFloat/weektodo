# 浏览器环境 WebDAV 使用快速指南

## 问题说明

浏览器由于安全限制（CORS），无法直接访问第三方 WebDAV 服务器。

## 解决方案

### 🎯 方案 1：使用 Electron 桌面版（最简单）

**推荐！** 下载安装 Electron 桌面版，无需任何配置即可直接使用 WebDAV。

- Windows: 下载 `.exe` 安装包
- Mac: 下载 `.dmg` 安装包
- Linux: 下载 `.AppImage` 或 `.deb` 安装包

### 🔧 方案 2：本地运行代理服务器（最快）

如果必须在浏览器中使用：

**步骤 1：启动代理服务器**

在项目目录中打开终端：

```bash
# 安装依赖（首次运行）
npm install express cors axios

# 启动代理服务器
node webdav-proxy-server.js
```

看到以下提示说明启动成功：
```
🚀 WebDAV 代理服务器已启动
本地地址: http://localhost:3001
代理路径: http://localhost:3001/webdav-proxy
```

**步骤 2：配置 WeekToDo**

1. 打开 WeekToDo 设置 → WebDAV
2. 启用 "使用代理服务器" 开关
3. 代理服务器地址填写：`http://localhost:3001/webdav-proxy`
4. WebDAV URL 照常填写（如：`https://dav.jianguoyun.com/dav/`）
5. 填写用户名和密码
6. 点击"测试连接"

### ☁️ 方案 3：部署到云平台（永久方案）

将代理服务器部署到云平台，这样随时随地都能使用：

#### Cloudflare Workers（推荐，免费）

1. 注册 Cloudflare 账号
2. 创建 Worker
3. 复制 `WEBDAV_PROXY_GUIDE.md` 中的 Workers 代码
4. 部署后获得类似 `https://your-worker.workers.dev` 的地址
5. 在 WeekToDo 中配置：`https://your-worker.workers.dev/webdav-proxy`

#### Vercel（免费）

```bash
# 安装 Vercel CLI
npm install -g vercel

# 部署
vercel deploy
```

#### Railway / Render（免费额度）

1. 在 GitHub 创建仓库，包含 `webdav-proxy-server.js`
2. 连接到 Railway 或 Render
3. 自动部署后获得公开 URL
4. 在 WeekToDo 中配置该 URL

## 配置示例

### 坚果云配置

```
WebDAV URL: https://dav.jianguoyun.com/dav/
用户名: your-email@example.com
密码: [应用密码，非登录密码]
远程路径: /weektodo

使用代理服务器: ✓ 启用
代理地址: http://localhost:3001/webdav-proxy
```

### Nextcloud 配置

```
WebDAV URL: https://your-nextcloud.com/remote.php/dav/files/username/
用户名: username
密码: your-password
远程路径: /weektodo

使用代理服务器: ✓ 启用
代理地址: http://localhost:3001/webdav-proxy
```

## 常见问题

### Q: 为什么需要代理服务器？
A: 浏览器的 CORS 安全策略阻止网页直接访问第三方服务器。

### Q: 代理服务器安全吗？
A: 代理服务器只转发请求，不存储任何数据。建议使用自己部署的代理。

### Q: 可以使用别人的代理吗？
A: 不推荐！你的 WebDAV 账号密码会通过代理传输。

### Q: Electron 版本需要代理吗？
A: 不需要！Electron 版本可以直接连接，强烈推荐。

### Q: 我部署在服务器上的 WeekToDo 也需要代理吗？
A: 是的，只要是浏览器访问就需要代理，除非 WebDAV 服务器配置了 CORS。

## 故障排查

### 测试连接失败

1. **检查代理服务器是否运行**
   - 访问 `http://localhost:3001/health` 应返回 OK

2. **检查 WebDAV URL 是否正确**
   - 坚果云：`https://dav.jianguoyun.com/dav/`
   - 注意末尾的 `/`

3. **检查密码**
   - 坚果云必须使用"应用密码"，不是登录密码
   - 在坚果云网页版 → 账户设置 → 安全选项 → 添加应用密码

4. **查看浏览器控制台**
   - 按 F12 打开开发者工具
   - 查看 Console 和 Network 标签的错误信息

### 代理服务器启动失败

```bash
# 端口被占用？更换端口
PORT=3002 node webdav-proxy-server.js

# 依赖未安装？
npm install express cors axios
```

## 更多帮助

- 详细部署指南：[WEBDAV_PROXY_GUIDE.md](WEBDAV_PROXY_GUIDE.md)
- 问题反馈：GitHub Issues
