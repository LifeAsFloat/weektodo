# WeekToDo | FOSS Minimalist Weekly Planner (Enhanced Fork)
---
![GitHub all releases](https://img.shields.io/github/downloads/zuntek/weektodoweb/total) 
[![vue3](https://img.shields.io/badge/vue-3.x-brightgreen.svg)](https://vuejs.org/)
[![Docker](https://img.shields.io/badge/docker-available-blue.svg)](https://hub.docker.com/r/lifeasfloat/weektodo)

English | [简体中文](README.zh-CN.md)

> **Note:** This is an enhanced fork of the original [WeekToDo](https://github.com/manuelernestog/weektodo) project with additional features and Docker support.

WeekToDo is a free minimalist weekly planner app focused on privacy. Schedule your tasks and projects with to do lists and a calendar. Available for Windows, Mac, Linux, Docker or online.

![Logo](https://weektodo.me/weektodo-preview.webp)

## ✨ New Features in This Fork

- **🔄 WebDAV Synchronization** - Sync your tasks across devices using WebDAV
- **🐳 Docker Support** - Easy deployment with Docker and Docker Compose
- **🚀 CI/CD Integration** - Automated builds with GitHub Actions
- **📦 Multi-platform Docker Images** - Support for AMD64 and ARM64 architectures

## Features

- Cross platform
- Light/dark mode toggle
- Custom To-do Lists
- Drag and Drop
- Multi-language
- Sub-tasks
- Markdown Support
- Customizable user interface
- Local Storage
- Task Colors
- Task Time
- Recurring Tasks
- Notifications and reminders
- **🔄 WebDAV Sync** (New!)

## 🐳 Docker Deployment

### Quick Start with Docker

**Pull and run the latest image:**

```bash
docker pull lifeasfloat/weektodo:latest
docker run -p 80:80 lifeasfloat/weektodo:latest
```

Visit http://localhost

### Using Docker Compose

**Development environment:**
```bash
docker-compose up app-dev
```

**Production environment:**
```bash
docker-compose up app-prod
```

### Docker Hub

Pre-built images are available on Docker Hub:
- `lifeasfloat/weektodo:latest` - Latest stable version
- `lifeasfloat/weektodo:2.x` - Major version tag
- `lifeasfloat/weektodo:2.x.x` - Specific version

Visit our [Docker Hub repository](https://hub.docker.com/r/lifeasfloat/weektodo) for more information.

### GitHub Container Registry

Images are also available on GitHub Container Registry:
```bash
docker pull ghcr.io/lifeasfloat/weektodo:latest
```

## 🔄 WebDAV Synchronization

### Setup WebDAV Sync

1. Open **Settings** in WeekToDo
2. Navigate to **Sync Settings**
3. Enable **WebDAV Synchronization**
4. Enter your WebDAV server details:
   - Server URL (e.g., `https://dav.example.com`)
   - Username
   - Password
5. Click **Test Connection** to verify
6. Enable **Auto Sync** for automatic synchronization

### Supported WebDAV Providers

- Nextcloud
- ownCloud
- Box
- 4shared
- Any standard WebDAV server

### Sync Behavior

- **Manual Sync**: Click the sync button to sync immediately
- **Auto Sync**: Automatically syncs when changes are detected
- **Conflict Resolution**: Latest changes take priority
- **Offline Support**: Changes are queued and synced when connection is restored

## Roadmap

- Touch mode
- Mobile Version
- ~~Sync across devices~~ ✅ (Implemented via WebDAV)
- Workspaces
- Themes
- End-to-end encryption for WebDAV sync
- Calendar integration

## Installation

### 🐳 Docker (Recommended)

**Using Docker Hub:**
```bash
# Pull the latest image
docker pull lifeasfloat/weektodo:latest

# Run the container
docker run -d -p 80:80 --name weektodo lifeasfloat/weektodo:latest
```

**Using Docker Compose:**
```bash
# Clone the repository
git clone https://github.com/LifeAsFloat/weektodo
cd weektodo

# Run in production mode
docker-compose up -d app-prod

# Or run in development mode
docker-compose up -d app-dev
```

Visit http://localhost (production) or http://localhost:8080 (development)

For more Docker deployment options, see [DOCKER.md](DOCKER.md)

### Download installer 

[Windows / Linux / macOS](https://github.com/zuntek/weektodoweb/releases/latest
) 

### External Stores

#### Windows 

[Uptodown](https://weektodo.uptodown.com/windows)

#### macOS 

[Macupdate](https://www.macupdate.com/app/mac/63506/weektodo)

#### Linux 

Snapd can be installed from the command line:

```bash
sudo apt update
sudo apt install snapd
```
To install WeekToDo, simply use the following command:
```bash
sudo snap install weektodo
```    

## Build and Run From Source

If you want to understand how WeekToDo works or want to debug an issue, you'll want to get the source, build it, and run it locally.

### Installing Prerequisites

You'll need git, a recent version of [Node.JS](https://nodejs.org/en/) (currently v25.x is recommended), and npm.

### Clone and Run

```bash
# Clone this enhanced fork
git clone https://github.com/LifeAsFloat/weektodo
cd weektodo

# Install dependencies
npm install

# Run web version (development)
npm run serve

# Build for production
npm run build
```

### Docker Build

```bash
# Build production image
docker build -f Dockerfile.prod -t weektodo:prod .

# Build development image
docker build -t weektodo:dev .

# Or use docker-compose
docker-compose up --build
```

See [DOCKER.md](DOCKER.md) for detailed Docker instructions.

## Translations

Currently the system is developed in multiple languages, you can send me a correction of any error or you can add your language if it's not available.

You can find the base file with all the used words in english [here](src/assets/languages/en.json/)

For add a new language Fork the repo and create a Pull Request creating a new file of the `translations/en.json` and name he file acording the [language code](https://gist.github.com/Josantonius/b455e315bc7f790d14b136d61d9ae469). 

If this is to dificult, you can donwload this [file](src/assets/languages/en.json/), translate it and send the file to the email contact@weektodo.me

## Contributing

Weektodo is open-source. Pull requests and contributions are welcome! There are three ways to contribute: grab a [bug report](https://github.com/LifeAsFloat/weektodo/issues?q=is%3Aopen+is%3Aissue+label%3Abug) or [feature suggestion](https://github.com/LifeAsFloat/weektodo/issues?q=is%3Aissue+is%3Aopen+label%3Afeature) that has been marked `accepted` and dig in.

Read [Contributing.md](/CONTRIBUTING.md) for more information.

### Fork Contributions

This fork adds:
- WebDAV synchronization functionality
- Full Docker support with multi-stage builds
- GitHub Actions CI/CD for automated builds
- Enhanced documentation
- Node.js 25 support

## Original Project

This is a fork of the original WeekToDo project:
- **Original Author:** [Manuel Ernesto Garcia](https://manuelernestogr.bio.link/)
- **Original Repository:** [manuelernestog/weektodo](https://github.com/manuelernestog/weektodo)
- **Website:** [weektodo.me](https://weektodo.me)

## Fork Maintainer

- **LifeAsFloat**
- **Repository:** [LifeAsFloat/weektodo](https://github.com/LifeAsFloat/weektodo)

## License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

Special thanks to:
- Manuel Ernesto Garcia for the original WeekToDo project
- All contributors to the original project
- The open-source community
Weektodo is open-source. Pull requests and contributions are welcome! There are three ways to contribute: grab a [bug report](https://github.com/manuelernestog/issues?q=is%3Aopen+is%3Aissue+label%3Abug) or [feature suggestion](https://github.com/manuelernestog/issues?q=is%3Aissue+is%3Aopen+label%3Afeature) that has been marked `accepted` and dig in.

Read [Contributing.md](/CONTRIBUTING.md) for more information.

## Author

- [Manuel Ernesto Garcia](https://manuelernestogr.bio.link/)

## Contributors

- Logo Rebranding by [hallgraph](https://twitter.com/hallgraph)
- [Translators](https://weektodo.me/about/)

<a href="https://github.com/manuelernestog/weektodo/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=manuelernestog/weektodo" />
</a>



Made with [contrib.rocks](https://contrib.rocks).

  
