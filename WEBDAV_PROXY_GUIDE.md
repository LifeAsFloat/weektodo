# WebDAV 代理服务器部署指南

## 为什么需要代理服务器？

在浏览器生产环境中，由于CORS（跨域资源共享）安全策略，浏览器不允许网页直接访问第三方WebDAV服务器（如坚果云、Nextcloud等）。代理服务器可以绕过这个限制。

## 解决方案

### 方案1：使用 Electron 桌面版（推荐）
最简单的方案是使用 Electron 桌面版本，它没有 CORS 限制，可以直接连接 WebDAV 服务器。

### 方案2：部署代理服务器

如果必须在浏览器中使用，可以部署自己的代理服务器。

## Node.js 代理服务器示例

创建一个简单的 Node.js 服务器作为 WebDAV 代理：

### 1. 创建 `webdav-proxy-server.js`

```javascript
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3001;

// 启用 CORS
app.use(cors());
app.use(express.raw({ type: '*/*', limit: '50mb' }));

// WebDAV 代理路由
app.all('/webdav-proxy/:encodedUrl(*)', async (req, res) => {
  try {
    // 解码目标 URL
    const encodedUrl = req.params.encodedUrl;
    const targetBaseUrl = decodeURIComponent(encodedUrl.split('/')[0]);
    const restPath = '/' + encodedUrl.split('/').slice(1).join('/');
    const targetUrl = targetBaseUrl + restPath;
    
    console.log(`[${req.method}] 代理请求: ${targetUrl}`);
    
    // 准备请求配置
    const config = {
      method: req.method,
      url: targetUrl,
      headers: {
        ...req.headers,
        host: new URL(targetBaseUrl).host,
      },
      data: req.body,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      validateStatus: () => true, // 接受所有状态码
    };
    
    // 删除可能导致问题的头
    delete config.headers['host'];
    delete config.headers['origin'];
    delete config.headers['referer'];
    
    // 发送请求
    const response = await axios(config);
    
    // 设置响应头
    const responseHeaders = { ...response.headers };
    responseHeaders['access-control-allow-origin'] = '*';
    responseHeaders['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PROPFIND, MKCOL, COPY, MOVE';
    responseHeaders['access-control-allow-headers'] = 'Authorization, Content-Type, Depth, Content-Length, Overwrite, Destination';
    delete responseHeaders['www-authenticate'];
    
    // 返回响应
    res.status(response.status);
    Object.keys(responseHeaders).forEach(key => {
      res.setHeader(key, responseHeaders[key]);
    });
    res.send(response.data);
    
  } catch (error) {
    console.error('代理错误:', error.message);
    res.status(502).json({ error: error.message });
  }
});

// OPTIONS 预检请求
app.options('/webdav-proxy/*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PROPFIND, MKCOL, COPY, MOVE');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Depth, Content-Length, Overwrite, Destination');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`🚀 WebDAV 代理服务器运行在 http://localhost:${PORT}`);
  console.log(`代理路径格式: http://localhost:${PORT}/webdav-proxy/ENCODED_URL`);
});
```

### 2. 安装依赖

```bash
npm install express cors axios
```

### 3. 运行代理服务器

```bash
node webdav-proxy-server.js
```

### 4. 在 WeekToDo 中配置

在 WeekToDo 的 WebDAV 设置中：

1. 启用 "使用代理服务器"
2. 代理服务器地址填写：`http://your-server.com:3001/webdav-proxy`
   （或部署后的实际地址）
3. WebDAV URL 照常填写原始地址（如 `https://dav.jianguoyun.com/dav/`）
4. 填写用户名和密码

## 部署到云平台

### Vercel 部署

1. 创建 `vercel.json`：

```json
{
  "version": 2,
  "builds": [
    {
      "src": "webdav-proxy-server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "webdav-proxy-server.js"
    }
  ]
}
```

2. 部署：
```bash
vercel deploy
```

### Railway/Render 部署

1. 将代码推送到 GitHub
2. 在 Railway 或 Render 上连接仓库
3. 设置启动命令：`node webdav-proxy-server.js`
4. 部署完成后，使用提供的 URL 作为代理地址

## 使用 Cloudflare Workers（推荐）

Cloudflare Workers 免费额度更高，部署更简单：

```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // 处理 CORS 预检
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PROPFIND, MKCOL, COPY, MOVE',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type, Depth, Content-Length, Overwrite, Destination',
        'Access-Control-Max-Age': '86400'
      }
    })
  }

  // 提取目标 URL
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/').filter(p => p)
  
  if (pathParts[0] !== 'webdav-proxy') {
    return new Response('Invalid path', { status: 400 })
  }

  const encodedUrl = pathParts.slice(1).join('/')
  const targetBaseUrl = decodeURIComponent(pathParts[1])
  const restPath = '/' + pathParts.slice(2).join('/')
  const targetUrl = targetBaseUrl + restPath

  // 转发请求
  const modifiedRequest = new Request(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body
  })

  const response = await fetch(modifiedRequest)
  const modifiedResponse = new Response(response.body, response)
  
  // 添加 CORS 头
  modifiedResponse.headers.set('Access-Control-Allow-Origin', '*')
  modifiedResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PROPFIND, MKCOL, COPY, MOVE')
  modifiedResponse.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, Depth, Content-Length, Overwrite, Destination')
  
  return modifiedResponse
}
```

部署到 Cloudflare Workers 后，使用类似 `https://your-worker.workers.dev/webdav-proxy` 的地址作为代理 URL。

## 安全建议

1. **限制访问来源**：在生产环境中，建议限制 CORS 的 `Access-Control-Allow-Origin`，只允许你的域名访问
2. **添加认证**：可以为代理服务器添加额外的认证机制
3. **限流**：使用速率限制防止滥用
4. **HTTPS**：确保代理服务器使用 HTTPS

## 常见问题

### Q: 为什么不能直接访问 WebDAV 服务器？
A: 浏览器的同源策略（CORS）阻止了跨域请求，这是浏览器的安全特性。

### Q: 代理服务器安全吗？
A: 代理服务器只是转发请求，不存储任何凭据。建议部署自己的代理服务器以确保安全。

### Q: 有没有公共的代理服务器？
A: 为了安全考虑，不建议使用公共代理服务器，因为你的 WebDAV 凭据会通过代理服务器。

### Q: Electron 版本需要代理吗？
A: 不需要。Electron 版本可以直接访问 WebDAV 服务器，没有 CORS 限制。

## 推荐方案总结

1. **最佳**：使用 Electron 桌面版
2. **次选**：自己部署 Cloudflare Workers 代理（免费、快速）
3. **备选**：在自己的服务器上部署 Node.js 代理
