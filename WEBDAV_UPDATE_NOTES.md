# 浏览器 WebDAV 支持 - 更新说明

## 🎉 更新内容

现在 WeekToDo 支持在**浏览器生产环境**中使用 WebDAV 同步功能！

### ✨ 新增功能

1. **代理服务器支持**
   - 新增"使用代理服务器"配置选项
   - 可配置自定义代理服务器 URL
   - 支持本地代理或云端代理

2. **开箱即用的代理服务器**
   - 提供 `webdav-proxy-server.js` 代理服务器
   - 一键启动：`npm run proxy`
   - 完整的错误处理和日志

3. **完整的文档**
   - [WEBDAV_PROXY_GUIDE.md](WEBDAV_PROXY_GUIDE.md) - 详细部署指南
   - [WEBDAV_BROWSER_GUIDE.md](WEBDAV_BROWSER_GUIDE.md) - 快速使用指南
   - [test-webdav-proxy.html](test-webdav-proxy.html) - 在线测试工具

### 📝 修改的文件

#### 核心功能
- `src/repositories/webdavConfigRepository.js` - 添加代理配置
- `src/helpers/webdavSync.js` - 支持代理服务器
- `src/views/configModal.vue` - 新增代理配置 UI

#### 代理服务器
- `webdav-proxy-server.js` - 完整的代理服务器实现
- `package.json` - 添加 `npm run proxy` 命令

#### 文档
- `WEBDAV_PROXY_GUIDE.md` - 完整部署指南
- `WEBDAV_BROWSER_GUIDE.md` - 快速使用指南
- `README.zh-CN.md` - 更新说明
- `test-webdav-proxy.html` - 测试工具

## 🚀 快速开始

### 方式 1：使用 Electron 桌面版（推荐）

最简单的方式，无需任何配置：

1. 下载 Electron 桌面版
2. 在设置中配置 WebDAV
3. 开始同步

### 方式 2：浏览器 + 本地代理

如果必须在浏览器中使用：

```bash
# 安装代理依赖
npm run proxy:install

# 启动代理服务器
npm run proxy
```

然后在 WeekToDo 设置中：
1. 启用"使用代理服务器"
2. 代理地址：`http://localhost:3001/webdav-proxy`
3. 填写 WebDAV 信息
4. 测试连接

### 方式 3：部署云端代理（永久方案）

将代理部署到云平台（Vercel/Railway/Cloudflare Workers），详见：
- [WEBDAV_PROXY_GUIDE.md](WEBDAV_PROXY_GUIDE.md)

## 📖 使用示例

### 坚果云配置

```
WebDAV URL: https://dav.jianguoyun.com/dav/
用户名: your-email@example.com
密码: [应用密码]
远程路径: /weektodo

✓ 使用代理服务器
代理地址: http://localhost:3001/webdav-proxy
```

## 🧪 测试

打开 `test-webdav-proxy.html` 测试代理是否工作正常。

## 🔧 技术实现

### 代理工作原理

```
浏览器 → 代理服务器 → WebDAV 服务器
         (添加CORS头)
```

### 关键特性

1. **自动检测环境**
   - Electron: 直接连接，无需代理
   - 浏览器 + 开发模式: 使用 vue.config.js 的代理
   - 浏览器 + 生产模式: 使用配置的代理或直连（可能遇到CORS）

2. **灵活配置**
   - 可选择是否使用代理
   - 支持自定义代理 URL
   - 支持多种部署方式

3. **完整的错误处理**
   - 友好的错误提示
   - 详细的日志输出
   - CORS 错误检测

## 📊 配置结构

```javascript
{
  enabled: false,
  url: "",
  username: "",
  password: "",
  remotePath: "/weektodo",
  autoSync: false,
  syncInterval: 30,
  lastSync: null,
  useProxy: false,        // 新增
  proxyUrl: "",           // 新增
}
```

## 🎯 适用场景

### 推荐使用 Electron 版本
- 日常使用
- 需要稳定同步
- 不想配置代理

### 适合使用浏览器 + 代理
- 多设备访问
- 无法安装客户端
- 服务器部署

## ⚠️ 注意事项

1. **安全性**
   - 代理服务器会转发你的认证信息
   - 建议使用自己部署的代理
   - 不要使用不可信的公共代理

2. **性能**
   - 代理会增加一层网络跳转
   - 云端代理的速度取决于服务器位置
   - 本地代理延迟最低

3. **依赖**
   - 代理服务器需要 express、cors、axios
   - 使用 `npm run proxy:install` 安装

## 🐛 故障排查

### 测试连接失败

1. **检查代理服务器**
   ```bash
   # 访问健康检查端点
   curl http://localhost:3001/health
   ```

2. **检查配置**
   - 代理地址格式正确
   - WebDAV URL 末尾有 `/`
   - 密码使用应用密码（坚果云）

3. **查看日志**
   - 浏览器控制台 (F12)
   - 代理服务器控制台

### 代理服务器启动失败

```bash
# 检查端口占用
netstat -ano | findstr :3001

# 使用其他端口
PORT=3002 npm run proxy
```

## 🔗 相关链接

- [WebDAV 代理部署指南](WEBDAV_PROXY_GUIDE.md)
- [浏览器快速使用指南](WEBDAV_BROWSER_GUIDE.md)
- [测试工具](test-webdav-proxy.html)

## 💡 下一步

1. 尝试使用 Electron 版本（最简单）
2. 或启动本地代理测试（浏览器）
3. 考虑部署云端代理（永久方案）

## 📞 获取帮助

遇到问题？
- 查看 [WEBDAV_BROWSER_GUIDE.md](WEBDAV_BROWSER_GUIDE.md)
- 使用 [test-webdav-proxy.html](test-webdav-proxy.html) 测试
- 提交 GitHub Issue
