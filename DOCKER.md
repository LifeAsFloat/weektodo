# WeekToDo Docker 部署指南

## 快速开始

### 1. 开发环境

启动开发服务器（热重载）：

```bash
docker-compose up app-dev
```

访问: http://localhost:8080

### 2. 生产环境

构建并启动生产版本：

```bash
docker-compose up app-prod
```

访问: http://localhost

## Docker 命令

### 构建镜像

**开发环境:**
```bash
docker build -t weektodo:dev .
```

**生产环境:**
```bash
docker build -f Dockerfile.prod -t weektodo:prod .
```

### 运行容器

**开发环境:**
```bash
docker run -p 8080:8080 -v $(pwd):/app -v node_modules:/app/node_modules weektodo:dev
```

**生产环境:**
```bash
docker run -p 80:80 weektodo:prod
```

### 后台运行

```bash
# 开发环境
docker-compose up -d app-dev

# 生产环境
docker-compose up -d app-prod
```

### 停止容器

```bash
docker-compose down
```

### 查看日志

```bash
docker-compose logs -f app-dev
# 或
docker-compose logs -f app-prod
```

## 文件说明

- **Dockerfile**: 开发环境配置
- **Dockerfile.prod**: 生产环境多阶段构建配置
- **docker-compose.yml**: Docker Compose 配置文件
- **nginx.conf**: Nginx 服务器配置（生产环境）
- **.dockerignore**: Docker 构建忽略文件

## 镜像优化

生产环境使用了多阶段构建，最终镜像基于 nginx:stable-alpine，体积更小，性能更好。

## 环境变量

可以通过 `.env` 文件或 docker-compose.yml 中的 `environment` 配置环境变量。

## 故障排除

### 端口冲突
如果端口被占用，修改 docker-compose.yml 中的端口映射：
```yaml
ports:
  - "3000:8080"  # 本地端口:容器端口
```

### 权限问题（Linux/Mac）
```bash
sudo chown -R $USER:$USER .
```

### 清理并重新构建
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```
