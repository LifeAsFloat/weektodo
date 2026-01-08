# 构建安卓版本指南

## 前提条件

在构建安卓版本之前，需要先配置 Capacitor。

### 1. 本地安装 Capacitor

```bash
cd d:\UGit\weektodo

# 安装 Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# 初始化 Capacitor
npx cap init "WeekToDo" "me.weektodo.app" --web-dir=dist

# 构建 Web 应用
npm run build

# 添加 Android 平台
npx cap add android

# 同步 Web 代码到 Android
npx cap sync android
```

### 2. 配置 capacitor.config.json

Capacitor 会生成 `capacitor.config.json` 或 `capacitor.config.ts` 文件，确保配置正确：

```json
{
  "appId": "me.weektodo.app",
  "appName": "WeekToDo",
  "webDir": "dist",
  "server": {
    "androidScheme": "https"
  }
}
```

### 3. 本地构建测试

```bash
# 构建 Web 应用
npm run build

# 同步到 Android
npx cap sync android

# 在 Android Studio 中打开项目
npx cap open android
```

在 Android Studio 中：
- 点击 Build → Build Bundle(s) / APK(s) → Build APK(s)
- APK 会生成在 `android/app/build/outputs/apk/`

### 4. 使用 GitHub Actions 自动构建

提交上述更改后，可以通过以下方式触发构建：

**方法 1: 手动触发**
1. GitHub → Actions → "Build Android App"
2. 点击 "Run workflow"
3. 等待构建完成并下载 APK

**方法 2: 创建标签**
```bash
git tag v2.2.1-android
git push origin v2.2.1-android
```

### 5. 签名配置（可选，用于发布）

要发布到 Google Play，需要签名 APK：

1. 生成密钥库：
```bash
keytool -genkey -v -keystore weektodo.keystore -alias weektodo -keyalg RSA -keysize 2048 -validity 10000
```

2. 在 `android/app/build.gradle` 中添加签名配置：
```gradle
android {
    signingConfigs {
        release {
            storeFile file("../../weektodo.keystore")
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias "weektodo"
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

3. 在 GitHub Secrets 中添加：
   - `KEYSTORE_PASSWORD`
   - `KEY_PASSWORD`

## 注意事项

1. **应用图标**: 替换 `android/app/src/main/res/` 下的图标文件
2. **权限配置**: 在 `android/app/src/main/AndroidManifest.xml` 中配置所需权限
3. **WebDAV**: 确保网络权限已配置，以支持 WebDAV 同步
4. **本地存储**: Capacitor 会自动处理 localStorage
5. **应用名称**: 在 `android/app/src/main/res/values/strings.xml` 中修改

## 构建产物

构建完成后，APK 文件位于：
- Debug: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release: `android/app/build/outputs/apk/release/app-release.apk`

## 常见问题

**Q: 构建失败怎么办？**
A: 检查 Node.js 和 Java 版本，确保 Android SDK 已正确安装。

**Q: 如何减小 APK 体积？**
A: 启用 ProGuard 和资源压缩，在 build.gradle 中配置。

**Q: 能否构建 AAB（App Bundle）？**
A: 可以，使用 `./gradlew bundleRelease` 命令。

## 资源链接

- [Capacitor 官方文档](https://capacitorjs.com/)
- [Android Developer Guide](https://developer.android.com/)
- [Vue + Capacitor 示例](https://capacitorjs.com/docs/getting-started/with-ionic)
