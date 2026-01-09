const http = require('http');
const https = require('https');
const url = require('url');

module.exports = {
  devServer: {
    setupMiddlewares: (middlewares, devServer) => {
      // 自定义 WebDAV 代理中间件
      devServer.app.use('/webdav-proxy', (req, res) => {
        try {
          // 从 URL 中提取编码的目标地址
          // 格式: /webdav-proxy/ENCODED_FULL_URL
          const urlPath = req.url.startsWith('/') ? req.url.substring(1) : req.url;
          const pathParts = urlPath.split('/');
          
          // 第一部分是编码的基础 URL
          const targetBase = decodeURIComponent(pathParts[0]);
          // 剩余部分是路径
          const restPath = '/' + pathParts.slice(1).join('/');
          
          const targetUrl = targetBase + restPath;
          const parsedUrl = url.parse(targetUrl);
          
          console.log('🔀 WebDAV 代理:', req.method, targetUrl);
          
          const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
            path: parsedUrl.path,
            method: req.method,
            headers: {
              ...req.headers,
              host: parsedUrl.host,
            },
          };
          
          // 清理一些头
          delete options.headers['origin'];
          delete options.headers['referer'];
          delete options.headers['host'];
          options.headers['host'] = parsedUrl.host;
          
          const httpModule = parsedUrl.protocol === 'https:' ? https : http;
          
          const proxyReq = httpModule.request(options, (proxyRes) => {
            console.log('🔀 代理响应:', proxyRes.statusCode, req.method, restPath);
            
            // 设置响应头
            const responseHeaders = { ...proxyRes.headers };
            responseHeaders['access-control-allow-origin'] = '*';
            responseHeaders['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PROPFIND, MKCOL, COPY, MOVE';
            responseHeaders['access-control-allow-headers'] = 'Authorization, Content-Type, Depth, Content-Length, Overwrite, Destination';
            delete responseHeaders['www-authenticate'];
            
            res.writeHead(proxyRes.statusCode, responseHeaders);
            proxyRes.pipe(res);
          });
          
          proxyReq.on('error', (err) => {
            console.error('🔀 代理错误:', err.message);
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          });
          
          // 转发请求体
          req.pipe(proxyReq);
          
        } catch (err) {
          console.error('🔀 代理处理错误:', err.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      
      // 处理 OPTIONS 预检请求
      devServer.app.options('/webdav-proxy/*', (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PROPFIND, MKCOL, COPY, MOVE');
        res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Depth, Content-Length, Overwrite, Destination');
        res.setHeader('Access-Control-Max-Age', '86400');
        res.status(204).end();
      });
      
      return middlewares;
    },
  },
  configureWebpack: {
    resolve: {
      fallback: {
        fs: false,
        path: false,
        crypto: false,
      },
    },
    externals: {
      electron: 'commonjs electron',
    },
  },
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      customFileProtocol: './',
      builderOptions: {
        appId: "weektodo-app.netlify.app",
        productName: "WeekToDo",
        publish: ["github"],
        linux: {
          category: "Utility",
          description: "Free and Open Source Minimalist Weekly Planner and To Do list App focused on privacy.",
          target: ["deb", "rpm", "pacman","AppImage"],
          icon: "build/icon.icns",
        },
        win: {
          target: ["nsis"],
        },
        mac: {
          category: "public.app-category.productivity",
          target: ["dmg", "pkg"],
        },
      },
    },
  }
};
