#!/bin/sh

# WeekToDo Docker 启动脚本
# 同时启动 Nginx 和 WebDAV 代理服务器

echo "=========================================="
echo "  启动 WeekToDo 服务..."
echo "=========================================="

# 启动 WebDAV 代理服务器（后台运行）
echo "✓ 启动 WebDAV 代理服务器 (端口 3001)..."
cd /app/proxy
node webdav-proxy-server.js &
PROXY_PID=$!

# 等待代理服务器启动
sleep 2

# 检查代理服务器是否启动成功
if kill -0 $PROXY_PID 2>/dev/null; then
    echo "✓ WebDAV 代理服务器启动成功"
else
    echo "✗ WebDAV 代理服务器启动失败"
    exit 1
fi

# 启动 Nginx
echo "✓ 启动 Nginx (端口 80)..."
nginx -g "daemon off;" &
NGINX_PID=$!

# 等待 Nginx 启动
sleep 2

# 检查 Nginx 是否启动成功
if kill -0 $NGINX_PID 2>/dev/null; then
    echo "✓ Nginx 启动成功"
else
    echo "✗ Nginx 启动失败"
    exit 1
fi

echo "=========================================="
echo "  WeekToDo 服务已启动！"
echo "  - Web 界面: http://localhost"
echo "  - WebDAV 代理: http://localhost/webdav-proxy"
echo "  - 健康检查: http://localhost/health"
echo "=========================================="

# 监控进程，如果任一进程退出则退出容器
wait -n $PROXY_PID $NGINX_PID
EXIT_CODE=$?

echo "服务进程已退出，退出码: $EXIT_CODE"
exit $EXIT_CODE
