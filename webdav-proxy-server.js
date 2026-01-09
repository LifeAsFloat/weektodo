/**
 * WebDAV 代理服务器
 * 用于解决浏览器环境中 WebDAV 访问的 CORS 限制
 * 
 * 使用方法：
 * 1. 安装依赖：npm install express cors axios
 * 2. 运行服务器：node webdav-proxy-server.js
 * 3. 在 WeekToDo 中配置代理地址：http://localhost:3001/webdav-proxy
 * 
 * 部署：可以部署到 Vercel、Railway、Render 等平台
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3001;

// 启用 CORS - 允许所有来源（生产环境建议限制为特定域名）
app.use(cors());

// 解析所有类型的请求体
app.use(express.raw({ type: '*/*', limit: '50mb' }));

// 日志中间件
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/**
 * WebDAV 代理路由
 * 路径格式: /webdav-proxy/:encodedUrl
 * encodedUrl 是经过 encodeURIComponent 编码的完整 WebDAV URL
 */
app.all(/^\/webdav-proxy\/(.*)$/, async (req, res) => {
  try {
    // 解析目标 URL - 从路径中提取
    const fullPath = req.params[0]; // 使用正则表达式捕获组
    
    let targetUrl;
    
    // 尝试解析 URL（处理各种编码情况）
    // 情况1: 路径以 http:/ 或 https:/ 开头（单斜杠，说明已经过某种处理）
    if (fullPath.match(/^https?:\//)) {
      // 修复缺失的斜杠
      targetUrl = fullPath.replace(/^(https?:)\/([^/])/, '$1//$2');
      console.log(`  → 修复 URL: ${fullPath} => ${targetUrl}`);
    } 
    // 情况2: 路径以完整的协议开头
    else if (fullPath.match(/^https?:\/\//)) {
      targetUrl = fullPath;
    }
    // 情况3: 编码的 URL
    else {
      // 找到第一个编码的 URL（到下一个未编码的斜杠为止）
      const firstSlashIndex = fullPath.indexOf('/');
      let targetBaseUrl, restPath;
      
      if (firstSlashIndex === -1) {
        // 没有额外路径，整个就是编码的 URL
        targetBaseUrl = decodeURIComponent(fullPath);
        restPath = '';
      } else {
        // 有额外路径
        targetBaseUrl = decodeURIComponent(fullPath.substring(0, firstSlashIndex));
        restPath = fullPath.substring(firstSlashIndex);
      }
      
      targetUrl = targetBaseUrl + restPath;
    }
    
    console.log(`  → 代理到: ${targetUrl}`);
    
    // 验证 URL 格式
    if (!targetUrl.match(/^https?:\/\/.+/)) {
      throw new Error(`Invalid URL format: ${targetUrl}`);
    }
    
    // 准备请求配置
    const config = {
      method: req.method,
      url: targetUrl,
      headers: {
        ...req.headers,
      },
      data: req.body,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      responseType: 'arraybuffer', // 支持二进制数据
      validateStatus: () => true, // 接受所有状态码
    };
    
    // 修正 Host 头
    const targetUrlObj = new URL(targetUrl);
    const targetHost = targetUrlObj.host;
    config.headers['host'] = targetHost;
    
    // 删除可能导致问题的头
    delete config.headers['origin'];
    delete config.headers['referer'];
    delete config.headers['connection'];
    
    // 发送请求到目标 WebDAV 服务器
    const response = await axios(config);
    
    console.log(`  ← 响应: ${response.status} ${response.statusText}`);
    
    // 设置响应头，添加 CORS 支持
    const responseHeaders = { ...response.headers };
    responseHeaders['access-control-allow-origin'] = '*';
    responseHeaders['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PROPFIND, MKCOL, COPY, MOVE';
    responseHeaders['access-control-allow-headers'] = 'Authorization, Content-Type, Depth, Content-Length, Overwrite, Destination';
    responseHeaders['access-control-expose-headers'] = 'DAV, ETag, Content-Length, Content-Type';
    
    // 删除可能导致问题的认证头（因为已经通过代理认证）
    delete responseHeaders['www-authenticate'];
    delete responseHeaders['connection'];
    
    // 返回响应
    res.status(response.status);
    Object.keys(responseHeaders).forEach(key => {
      if (responseHeaders[key]) {
        res.setHeader(key, responseHeaders[key]);
      }
    });
    res.send(response.data);
    
  } catch (error) {
    console.error(`  ✗ 代理错误:`, error.message);
    
    // 返回错误信息
    res.status(error.response?.status || 502);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({
      error: '代理请求失败',
      message: error.message,
      status: error.response?.status,
    });
  }
});

/**
 * OPTIONS 预检请求处理
 * 浏览器在发送实际请求前会先发送 OPTIONS 请求检查权限
 */
app.options(/^\/webdav-proxy\//, (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PROPFIND, MKCOL, COPY, MOVE');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Depth, Content-Length, Overwrite, Destination');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24小时
  res.status(204).end();
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'WebDAV Proxy Server',
    timestamp: new Date().toISOString(),
  });
});

// 根路径说明
app.get('/', (req, res) => {
  res.json({
    service: 'WebDAV Proxy Server',
    usage: 'POST /webdav-proxy/{encodedURL}',
    example: 'http://localhost:3001/webdav-proxy/https%3A%2F%2Fdav.jianguoyun.com%2Fdav%2F',
    documentation: 'See WEBDAV_PROXY_GUIDE.md for more information',
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    error: '服务器内部错误',
    message: err.message,
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  🚀 WebDAV 代理服务器已启动');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log(`  本地地址:  http://localhost:${PORT}`);
  console.log(`  代理路径:  http://localhost:${PORT}/webdav-proxy`);
  console.log(`  健康检查:  http://localhost:${PORT}/health`);
  console.log('');
  console.log('  使用示例:');
  console.log(`  1. 在 WeekToDo 中启用"使用代理服务器"`);
  console.log(`  2. 代理地址填写: http://localhost:${PORT}/webdav-proxy`);
  console.log(`  3. WebDAV URL 正常填写（如 https://dav.jianguoyun.com/dav/）`);
  console.log('');
  console.log('  按 Ctrl+C 停止服务器');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('\n正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  process.exit(0);
});
