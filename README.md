# WeekToDo | 开源极简主义周计划应用（增强版 Fork）
---
![GitHub all releases](https://img.shields.io/github/downloads/zuntek/weektodoweb/total) 
[![vue3](https://img.shields.io/badge/vue-3.x-brightgreen.svg)](https://vuejs.org/)
[![Docker](https://img.shields.io/badge/docker-available-blue.svg)](https://hub.docker.com/r/lifeasfloat/weektodo)

简体中文 | [English](README.en.md)

> **说明：** 这是原始 [WeekToDo](https://github.com/manuelernestog/weektodo) 项目的增强版 fork，添加了额外功能和 Docker 支持。

WeekToDo 是一款专注于隐私保护的免费极简周计划应用。通过待办事项列表和日历来安排您的任务和项目。支持 Windows、Mac、Linux、Docker 或在线使用。

![Logo](https://weektodo.me/weektodo-preview.webp)

## ✨ 本 Fork 新增特性

- **🔄 WebDAV 同步** - 通过 WebDAV 在多设备间同步任务
- **🐳 Docker 支持** - 使用 Docker 和 Docker Compose 轻松部署
- **🚀 CI/CD 集成** - 通过 GitHub Actions 自动构建
- **📦 多平台 Docker 镜像** - 支持 AMD64 和 ARM64 架构

## 功能特性

- 跨平台支持
- 明暗主题切换
- 自定义待办列表
- 拖放功能
- 多语言支持
- 子任务
- Markdown 支持
- 可自定义用户界面
- 本地存储
- 任务颜色标记
- 任务时间
- 重复任务
- 通知和提醒
- **🔄 WebDAV 同步**（新功能！）

## 🐳 Docker 部署

### Docker 快速开始

**拉取并运行最新镜像：**

```bash
docker pull lifeasfloat/weektodo:latest
docker run -p 80:80 lifeasfloat/weektodo:latest
```

访问 http://localhost

### 使用 Docker Compose

**开发环境：**
```bash
docker-compose up app-dev
```

**生产环境：**
```bash
docker-compose up app-prod
```

### Docker Hub

预构建镜像可在 Docker Hub 获取：
- `lifeasfloat/weektodo:latest` - 最新稳定版本
- `lifeasfloat/weektodo:2.x` - 主版本标签
- `lifeasfloat/weektodo:2.x.x` - 特定版本

访问我们的 [Docker Hub 仓库](https://hub.docker.com/r/lifeasfloat/weektodo) 了解更多信息。

### GitHub Container Registry

镜像也可在 GitHub Container Registry 获取：
```bash
docker pull ghcr.io/lifeasfloat/weektodo:latest
```

## 🔄 WebDAV 同步

### 配置 WebDAV 同步

1. 在 WeekToDo 中打开**设置**
2. 导航至**同步设置**
3. 启用 **WebDAV 同步**
4. 输入您的 WebDAV 服务器详情：
   - 服务器 URL（例如：`https://dav.example.com`）
   - 用户名
   - 密码
5. 点击**测试连接**进行验证
6. 启用**自动同步**以实现自动同步

### 支持的 WebDAV 提供商

- Nextcloud
- ownCloud
- Box
- 4shared
- 任何标准 WebDAV 服务器

### 同步行为

- **手动同步**：点击同步按钮立即同步
- **自动同步**：检测到更改时自动同步
- **冲突解决**：最新更改优先
- **离线支持**：更改会排队等待连接恢复后同步

## 路线图

- 触摸模式
- 移动版本
- ~~跨设备同步~~ ✅（已通过 WebDAV 实现）
- 工作空间
- 主题
- WebDAV 同步的端到端加密
- 日历集成

## 安装方式

### 🐳 Docker（推荐）

**使用 Docker Hub：**
```bash
# 拉取最新镜像
docker pull lifeasfloat/weektodo:latest

# 运行容器
docker run -d -p 80:80 --name weektodo lifeasfloat/weektodo:latest
```

**使用 Docker Compose：**
```bash
# 克隆仓库
git clone https://github.com/LifeAsFloat/weektodo
cd weektodo

# 生产模式运行
docker-compose up -d app-prod

# 或开发模式运行
docker-compose up -d app-dev
```

访问 http://localhost（生产环境）或 http://localhost:8080（开发环境）

更多 Docker 部署选项，请参阅 [DOCKER.md](DOCKER.md)

## 从源码构建和运行

如果您想了解 WeekToDo 的工作原理或想要调试问题，您需要获取源码、构建并在本地运行它。

### 安装先决条件

您需要 git、最新版本的 [Node.JS](https://nodejs.org/en/)（目前推荐 v25.x）和 npm。

### 克隆并运行

```bash
# 克隆这个增强版 fork
git clone https://github.com/LifeAsFloat/weektodo
cd weektodo

# 安装依赖
npm install

# 运行 Web 版本（开发环境）
npm run serve

# 构建生产版本
npm run build
```

### Docker 构建

```bash
# 构建生产镜像
docker build -f Dockerfile.prod -t weektodo:prod .

# 构建开发镜像
docker build -t weektodo:dev .

# 或使用 docker-compose
docker-compose up --build
```

详细的 Docker 说明请参阅 [DOCKER.md](DOCKER.md)。

## 翻译

目前系统支持多种语言开发，您可以发送任何错误的更正，或者如果您的语言不可用，可以添加您的语言。

您可以在[这里](src/assets/languages/en.json/)找到包含所有使用单词的英文基础文件

要添加新语言，请 Fork 仓库并创建 Pull Request，创建一个新的 `translations/en.json` 文件副本，并根据[语言代码](https://gist.github.com/Josantonius/b455e315bc7f790d14b136d61d9ae469)命名文件。

如果这太困难，您可以下载这个[文件](src/assets/languages/en.json/)，翻译它并将文件发送到电子邮件 contact@weektodo.me

## 参与贡献

WeekToDo 是开源的，欢迎提交 Pull Request 和贡献！有三种贡献方式：获取标记为 `accepted` 的[错误报告](https://github.com/LifeAsFloat/weektodo/issues?q=is%3Aopen+is%3Aissue+label%3Abug)或[功能建议](https://github.com/LifeAsFloat/weektodo/issues?q=is%3Aissue+is%3Aopen+label%3Afeature)并深入研究。

阅读 [Contributing.md](/CONTRIBUTING.md) 了解更多信息。

### Fork 贡献

本 fork 添加了：
- WebDAV 同步功能
- 完整的 Docker 支持和多阶段构建
- 使用 GitHub Actions 的 CI/CD 自动构建
- 增强的文档
- Node.js 25 支持

## 原始项目

这是原始 WeekToDo 项目的 fork：
- **原作者：** [Manuel Ernesto Garcia](https://manuelernestogr.bio.link/)
- **原始仓库：** [manuelernestog/weektodo](https://github.com/manuelernestog/weektodo)
- **网站：** [weektodo.me](https://weektodo.me)

## Fork 维护者

- **LifeAsFloat**
- **仓库：** [LifeAsFloat/weektodo](https://github.com/LifeAsFloat/weektodo)

## 许可证

本项目采用 GPL-3.0 许可证 - 详情请参阅 [LICENSE](LICENSE) 文件。

## 致谢

特别感谢：
- Manuel Ernesto Garcia 创建的原始 WeekToDo 项目
- 原始项目的所有贡献者
- 开源社区
