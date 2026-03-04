      // 自定义 WebDAV 代理中间件
      devServer.app.use('/webdav-proxy', (req, res) => {
        try {
          // 从 URL 中提取编码的目标地址
          // 格式：/webdav-proxy/ENCODED_FULL_URL
          const urlPath = req.url.startsWith('/') ? req.url.substring(1) : req.url;
          
          console.log('🔀 收到代理请求:', req.method, req.url);
          
          if (!urlPath || urlPath === '') {
            throw new Error('缺少目标 URL');
          }
          
          const pathParts = urlPath.split('/');
          
          // 第一部分是编码的基础 URL
          let targetBase;
          try {
            targetBase = decodeURIComponent(pathParts[0]);
          } catch (decodeErr) {
            console.error('🔀 URL 解码失败:', decodeErr.message, '原始部分:', pathParts[0]);
            throw new Error('URL 解码失败：' + decodeErr.message);
          }
          
          // 剩余部分是路径
          const restPath = pathParts.length > 1 ? '/' + pathParts.slice(1).join('/') : '';
          
          const targetUrl = targetBase + restPath;
          
          console.log('🔀 解析后的目标 URL:', targetUrl);
          console.log('   基础 URL:', targetBase);
          console.log('   路径:', restPath);
          
          // 验证 URL 格式
          if (!targetUrl.match(/^https?:\/\//)) {
            throw new Error('无效的 URL 格式：' + targetUrl);
          }
          
          const parsedUrl = url.parse(targetUrl);
          
          const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
            path: parsedUrl.path,
            method: req.method,
            headers: {
              ...req.headers,
            },
          };
          
          // 清理一些头
          delete options.headers['origin'];
          delete options.headers['referer'];
          delete options.headers['connection'];
          options.headers['host'] = parsedUrl.host;
          
          console.log('🔀 转发请求到:', targetUrl);
          
          const httpModule = parsedUrl.protocol === 'https:' ? https : http;
          
          const proxyReq = httpModule.request(options, (proxyRes) => {
            console.log('🔀 代理响应:', proxyRes.statusCode, req.method, restPath);
            
            // 设置响应头，添加 CORS 支持
            const responseHeaders = { ...proxyRes.headers };
            responseHeaders['access-control-allow-origin'] = '*';
            responseHeaders['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PROPFIND, MKCOL, COPY, MOVE';
            responseHeaders['access-control-allow-headers'] = 'Authorization, Content-Type, Depth, Content-Length, Overwrite, Destination';
            delete responseHeaders['www-authenticate'];
            delete responseHeaders['connection'];
            
            res.writeHead(proxyRes.statusCode, responseHeaders);
            proxyRes.pipe(res);
          });
          
          proxyReq.on('error', (err) => {
            console.error('🔀 代理错误:', err.message);
            console.error('   目标 URL:', targetUrl);
            res.writeHead(502, { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            });
            res.end(JSON.stringify({ 
              error: '代理请求失败',
              message: err.message,
              target: targetUrl,
            }));
          });
          
          // 转发请求体
          if (req.method !== 'GET' && req.method !== 'HEAD') {
            req.pipe(proxyReq);
          } else {
            proxyReq.end();
          }
          
        } catch (err) {
          console.error('🔀 代理处理错误:', err.message);
          console.error('   堆栈:', err.stack);
          res.writeHead(500, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          });
          res.end(JSON.stringify({ 
            error: '服务器内部错误',
            message: err.message,
            stack: err.stack,
          }));
        }
      });