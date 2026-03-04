# WebDAV 代理调试指南

## 问题诊断步骤

### 1. 检查代理服务器状态

#### 开发环境（npm run serve）
```bash
# 访问健康检查端点
curl http://localhost:8080/health
```

#### 生产环境（Docker）
```bash
# 进入容器
docker exec -it weektodo sh

# 检查代理服务
ps aux | grep node

# 测试健康检查
wget -O- http://localhost:3001/health
```

### 2. 查看详细日志

打开浏览器开发者工具（F12），查看 Console 标签的日志输出。

正常的日志应该包含：
```
🔧 浏览器生产环境：使用内置代理
   目标服务器：https://dav.jianguoyun.com/dav
   代理地址：https://your-domain/webdav-proxy/https%3A%2F%2Fdav.jianguoyun.com%2Fdav
   提示：如需使用外部代理，请在设置中配置代理服务器

WebDAV 客户端初始化成功：{...}
```

### 3. 手动测试代理

使用以下命令测试代理是否工作：

```bash
# 替换为你的实际参数
WEBDAV_URL="https://dav.jianguoyun.com/dav/"
USERNAME="your-email@example.com"
PASSWORD="your-app-password"
PROXY_BASE="http://localhost:8080"  # 或你的域名

# 编码 URL
ENCODED_URL=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$WEBDAV_URL', safe=''))")

# 发送 PROPFIND 请求
curl -X PROPFIND "$PROXY_BASE/webdav-proxy/$ENCODED_URL/" \
  -H "Authorization: Basic $(echo -n "$USERNAME:$PASSWORD" | base64)" \
  -H "Depth: 0" \
  -H "Content-Type: application/xml" \
  -d "<?xml version=\"1.0\" encoding=\"utf-8\"?><D:propfind xmlns:D=\"DAV:\"><D:allprop/></D:propfind>" \
  -v
```

### 4. 常见错误及解决方案

#### 502 Bad Gateway

**可能原因：**
1. 代理服务器未启动
2. URL 编码/解码失败
3. 目标 WebDAV 服务器不可达
4. SSL 证书问题

**解决方法：**
```bash
# 检查代理服务进程
docker exec -it weektodo ps aux | grep node

# 查看代理日志
docker logs weektodo | grep -i proxy

# 测试直连 WebDAV（在容器内）
docker exec -it weektodo curl -I https://dav.jianguoyun.com/dav/
```

#### 401 Unauthorized

**原因：** WebDAV 用户名或密码错误

**解决方法：**
- 坚果云需要使用"应用密码"，不是登录密码
- 在坚果云网页版 → 账户设置 → 安全选项 → 添加应用密码

#### 404 Not Found

**原因：** WebDAV URL 路径错误

**解决方法：**
- 确保 URL 末尾有 `/`
- 坚果云：`https://dav.jianguoyun.com/dav/`
- Nextcloud：`https://your-server/remote.php/dav/files/username/`

#### CORS 错误

**原因：** 代理服务器未正确设置 CORS 头

**解决方法：**
- 检查浏览器控制台是否有 CORS 相关错误
- 确认代理服务器返回的响应头包含 `Access-Control-Allow-Origin: *`

### 5. URL 编码问题调试

如果怀疑 URL 编码有问题，可以：

```javascript
// 在浏览器控制台执行
const url = 'https://dav.jianguoyun.com/dav/';
console.log('原始 URL:', url);
console.log('编码后:', encodeURIComponent(url));
console.log('解码后:', decodeURIComponent(encodeURIComponent(url)));
```

### 6. 使用测试页面

打开 `test-webdav-proxy.html` 文件进行测试：

1. 在浏览器中打开该文件
2. 填写 WebDAV 信息
3. 启用"使用代理服务器"
4. 填写代理地址
5. 点击"测试连接"

### 7. Docker 环境问题排查

```bash
# 重启容器
docker-compose restart app-prod

# 查看完整日志
docker-compose logs app-prod

# 实时查看日志
docker-compose logs -f app-prod

# 进入容器调试
docker exec -it weektodo sh

# 检查网络连接
ping dav.jianguoyun.com

# 测试 HTTPS 连接
curl -I https://dav.jianguoyun.com/dav/
```

## 修复后的改进

本次修复增加了以下功能：

### ✅ 详细的日志记录
- 请求/响应的完整日志
- URL 解析过程的详细输出
- 错误的堆栈跟踪

### ✅ 增强的错误处理
- URL 解码失败的捕获
- 无效 URL 格式的验证
- 区分不同类型的错误

### ✅ 更好的调试支持
- 结构化的日志输出
- 清晰的错误提示
- 请求参数的详细记录

## 快速修复流程

如果遇到 502 错误，按以下步骤操作：

1. **查看浏览器控制台日志** - 找到具体的错误信息
2. **检查代理地址格式** - 确保配置正确
3. **测试 WebDAV 直连** - 排除 WebDAV 服务器问题
4. **重启服务** - `docker-compose restart`
5. **查看服务器日志** - `docker-compose logs`

## 联系支持

如果问题仍未解决，请提供：
- 完整的浏览器控制台日志
- Docker 容器日志
- WebDAV 提供商信息
- 代理配置截图
