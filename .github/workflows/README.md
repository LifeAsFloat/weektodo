# GitHub Actions 工作流说明

## 工作流文件

### 1. docker-build.yml
**自动构建并推送到 GitHub Container Registry (ghcr.io)**

#### 触发条件：
- Push 到 `main` 或 `master` 分支
- 创建以 `v` 开头的标签（如 `v1.0.0`）
- Pull Request 到 `main` 或 `master` 分支（仅构建，不推送）
- 手动触发

#### 镜像标签策略：
- `latest` - 最新的 main/master 分支
- `v1.2.3` - 版本标签
- `main-abc1234` - 分支名+commit SHA
- `pr-123` - Pull Request 编号

#### 使用镜像：
```bash
docker pull ghcr.io/[用户名]/weektodo:latest
```

### 2. docker-hub.yml
**构建并推送到 Docker Hub**

#### 触发条件：
- 创建以 `v` 开头的标签（如 `v1.0.0`）
- 手动触发

#### 需要配置的 Secrets：
在 GitHub 仓库设置 -> Secrets and variables -> Actions 中添加：
- `DOCKERHUB_USERNAME` - Docker Hub 用户名
- `DOCKERHUB_TOKEN` - Docker Hub 访问令牌

#### 镜像标签：
- `latest` - 最新版本
- `1.2.3` - 完整版本号
- `1` - 主版本号

## 配置步骤

### 方案 1: 使用 GitHub Container Registry (免费，推荐)

无需额外配置，GitHub Actions 自动使用 `GITHUB_TOKEN`。

**启用 ghcr.io:**
1. 工作流会自动运行
2. 在仓库的 Packages 页面查看构建的镜像
3. 将镜像设为公开：Packages -> 选择镜像 -> Package settings -> Change visibility

**拉取镜像:**
```bash
docker pull ghcr.io/[用户名]/weektodo:latest
```

### 方案 2: 使用 Docker Hub

1. **创建 Docker Hub 访问令牌:**
   - 访问 https://hub.docker.com/settings/security
   - 点击 "New Access Token"
   - 命名为 "github-actions"，权限选择 "Read, Write, Delete"
   - 复制生成的令牌

2. **配置 GitHub Secrets:**
   - 进入 GitHub 仓库 -> Settings -> Secrets and variables -> Actions
   - 点击 "New repository secret"
   - 添加以下 secrets:
     - `DOCKERHUB_USERNAME`: 你的 Docker Hub 用户名
     - `DOCKERHUB_TOKEN`: 刚才创建的访问令牌

3. **启用工作流:**
   - 取消 `docker-build.yml` 中 Docker Hub 登录步骤的注释
   - 或使用 `docker-hub.yml` 专门推送到 Docker Hub

**拉取镜像:**
```bash
docker pull [用户名]/weektodo:latest
```

## 发布新版本

### 创建版本标签：
```bash
git tag v1.0.0
git push origin v1.0.0
```

这会触发工作流，构建并推送镜像到配置的仓库。

## 多平台支持

两个工作流都配置了多平台构建：
- `linux/amd64` (x86_64)
- `linux/arm64` (ARM64)

支持在不同架构的服务器上运行。

## 查看构建状态

在仓库页面点击 "Actions" 标签查看所有工作流的运行状态和日志。

## 本地测试

在推送前本地测试构建：
```bash
docker build -f Dockerfile.prod -t weektodo:test .
docker run -p 80:80 weektodo:test
```

## 故障排除

### 权限错误
确保工作流有 `packages: write` 权限（已在 docker-build.yml 中配置）

### Docker Hub 推送失败
- 检查 Secrets 配置是否正确
- 确认 Docker Hub 令牌权限包含写入权限
- 验证仓库名称格式: `username/weektodo`

### 构建失败
- 查看 Actions 日志中的详细错误信息
- 确保 Dockerfile.prod 和 nginx.conf 存在
- 本地测试构建是否成功
