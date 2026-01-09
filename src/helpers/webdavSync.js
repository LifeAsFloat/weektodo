import { createClient } from "webdav";
import webdavConfigRepository from "../repositories/webdavConfigRepository";
import customToDoListIdsRepository from "../repositories/customToDoListIdsRepository";
import configRepository from "../repositories/configRepository";
import storageRepository from "../repositories/storageRepository";
import i18n from "../main"; // 导入 i18n 实例

// 数据库配置
const DB_NAME = "weekToDo";
const DB_VERSION = 4;
const BACKUP_FILE_NAME = "weektodo-backup.json";
const DATA_VERSION = "2.0"; // 数据格式版本

class WebDAVSync {
  constructor() {
    this.client = null;
    this.config = null;
    this.syncInProgress = false;
    this.autoSyncInterval = null;
    this.onSyncStatusChange = null; // 回调函数，用于通知同步状态变化
  }

  // 获取翻译文本
  t(key) {
    // 备用翻译（当 i18n 不可用时）
    const fallbackTranslations = {
      webdavNotConfigured: "WebDAV 未配置或未启用",
      syncInProgress: "同步正在进行中，请稍候",
      preparing: "正在准备...",
      collecting: "正在收集数据...",
      uploading: "正在上传...",
      downloading: "正在下载...",
      checking: "正在检查远程数据...",
      restoring: "正在恢复数据...",
      finishing: "正在完成...",
      uploadSuccess: "数据上传成功",
      downloadSuccess: "数据下载成功",
      backupNotFound: "服务器上未找到备份文件",
      dbOpenError: "无法打开数据库",
      dbReadError: "读取数据库时出错",
      invalidDataFormat: "无效的数据格式",
      noLocalBackup: "没有可用的本地备份",
      webdavErrorNetwork: "网络连接失败，请检查网络和服务器地址",
      webdavError401: "认证失败：用户名或密码错误。提示：坚果云需要使用应用密码而非登录密码",
      webdavError403: "访问被拒绝：权限不足",
      webdavError404: "服务器路径不存在。提示：请先在云盘中手动创建该文件夹，然后再同步",
      webdavError405: "操作不被允许：服务器不支持此操作，请检查 WebDAV 服务器配置和远程路径权限",
      webdavError507: "服务器存储空间不足",
      remoteBackupDeleted: "远程备份已删除",
    };

    try {
      const translated = i18n.global.t(`webdav.${key}`);
      // 如果返回的是 key 本身，说明翻译不存在，使用备用翻译
      if (translated === `webdav.${key}` || translated === key) {
        return fallbackTranslations[key] || key;
      }
      return translated;
    } catch {
      return fallbackTranslations[key] || key;
    }
  }

  // 设置同步状态变化回调
  setOnSyncStatusChange(callback) {
    this.onSyncStatusChange = callback;
  }

  // 通知同步状态变化
  notifySyncStatus(status, message = "", progress = 0) {
    if (this.onSyncStatusChange) {
      this.onSyncStatusChange({ status, message, progress });
    }
  }

  // 检测是否在浏览器环境中运行
  isInBrowser() {
    try {
      // 检查是否有 electron 进程
      const isElectron = window.process?.type === 'renderer' || 
                        window.process?.versions?.electron ||
                        navigator.userAgent.toLowerCase().includes('electron');
      return !isElectron;
    } catch {
      return true; // 默认认为是浏览器
    }
  }

  // 检测是否是本地或局域网地址
  isLocalOrLANUrl(url) {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      // 检测本地地址
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
        return true;
      }
      
      // 检测局域网地址
      if (hostname.startsWith('192.168.') || 
          hostname.startsWith('10.') || 
          hostname.startsWith('172.16.') ||
          hostname.startsWith('172.17.') ||
          hostname.startsWith('172.18.') ||
          hostname.startsWith('172.19.') ||
          hostname.startsWith('172.20.') ||
          hostname.startsWith('172.21.') ||
          hostname.startsWith('172.22.') ||
          hostname.startsWith('172.23.') ||
          hostname.startsWith('172.24.') ||
          hostname.startsWith('172.25.') ||
          hostname.startsWith('172.26.') ||
          hostname.startsWith('172.27.') ||
          hostname.startsWith('172.28.') ||
          hostname.startsWith('172.29.') ||
          hostname.startsWith('172.30.') ||
          hostname.startsWith('172.31.')) {
        return true;
      }
      
      return false;
    } catch {
      return false;
    }
  }

  initialize() {
    this.config = webdavConfigRepository.load();
    if (this.config.enabled && this.config.url && this.config.username) {
      try {
        let webdavUrl = this.config.url;
        const inBrowser = this.isInBrowser();
        
        // 浏览器环境处理
        if (inBrowser) {
          // 优先使用用户配置的代理
          if (this.config.useProxy && this.config.proxyUrl) {
            // 用户自定义代理：将目标URL编码后附加到代理URL
            const encodedUrl = encodeURIComponent(this.config.url);
            webdavUrl = `${this.config.proxyUrl}/${encodedUrl}`;
            console.log(`🔧 使用自定义代理服务器`);
            console.log(`   目标服务器:`, this.config.url);
            console.log(`   代理地址:`, webdavUrl);
          } else if (process.env.NODE_ENV === 'development') {
            // 开发模式：使用本地开发代理
            const encodedUrl = encodeURIComponent(this.config.url);
            webdavUrl = `${window.location.origin}/webdav-proxy/${encodedUrl}`;
            console.log(`🔧 浏览器开发模式: 使用本地代理`);
            console.log(`   目标服务器:`, this.config.url);
            console.log(`   代理地址:`, webdavUrl);
          } else {
            // 生产环境：自动使用内置代理（Docker 镜像内置）
            const encodedUrl = encodeURIComponent(this.config.url);
            webdavUrl = `${window.location.origin}/webdav-proxy/${encodedUrl}`;
            console.log(`🔧 浏览器生产环境: 使用内置代理`);
            console.log(`   目标服务器:`, this.config.url);
            console.log(`   代理地址:`, webdavUrl);
            console.log(`   提示: 如需使用外部代理，请在设置中配置代理服务器`);
          }
        }

        // 创建 WebDAV 客户端
        this.client = createClient(webdavUrl, {
          username: this.config.username,
          password: this.config.password,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
          timeout: 30000,
          withCredentials: false, // 使用 Basic Auth 而不是 credentials
          headers: {
            'Accept': '*/*',
            'Cache-Control': 'no-cache',
          },
        });
        
        console.log("WebDAV 客户端初始化成功:", {
          url: webdavUrl,
          remotePath: this.config.remotePath,
          username: this.config.username,
        });
        
        return true;
      } catch (error) {
        console.error("WebDAV initialization error:", error);
        return false;
      }
    }
    return false;
  }

  async testConnection() {
    if (!this.initialize()) {
      throw new Error(this.t("webdavNotConfigured"));
    }
    
    try {
      // 尝试获取根目录以测试连接
      await this.client.getDirectoryContents("/");
      return true;
    } catch (error) {
      // 提供更详细的错误信息
      let errorMessage = error.message || "Unknown error";
      
      // 检测 CORS 错误
      if (error.message && (error.message.includes("CORS") || 
                           error.message.includes("blocked by CORS policy") ||
                           error.message.includes("Access-Control-Allow-Origin"))) {
        errorMessage = this.t("webdavProductionWarning");
      } else if (error.message && error.message.includes("Failed to fetch")) {
        errorMessage = this.t("webdavErrorFailedToFetch");
      } else if (error.status === 401) {
        errorMessage = this.t("webdavError401");
      } else if (error.status === 404) {
        errorMessage = this.t("webdavError404");
      } else if (error.status === 403) {
        errorMessage = this.t("webdavError403");
      } else if (error.status === 405) {
        errorMessage = this.t("webdavError405");
      }
      
      throw new Error(errorMessage);
    }
  }

  // 检查目录是否存在
  async checkDirectoryExists(path) {
    try {
      const exists = await this.client.exists(path);
      return exists;
    } catch (error) {
      // 404 明确表示不存在
      if (error.status === 404) {
        return false;
      }
      // 其他错误，尝试通过获取目录内容来判断
      try {
        await this.client.getDirectoryContents(path);
        return true;
      } catch {
        return false;
      }
    }
  }

  // 创建单个目录
  async createSingleDirectory(path) {
    try {
      await this.client.createDirectory(path);
      console.log('✓ 创建目录成功:', path);
      return true;
    } catch (error) {
      const status = error.status || error.response?.status;
      // 405/409/201 都可能表示成功或已存在
      if (status === 405 || status === 409 || status === 201) {
        console.log('目录已存在或创建成功:', path);
        return true;
      }
      console.warn('创建目录失败:', path, error.message);
      return false;
    }
  }

  // 确保远程目录存在（先检查，不存在则创建）
  async ensureRemoteDirectory() {
    const remotePath = this.config.remotePath;
    console.log('========== 检查远程目录 ==========');
    console.log('目标路径:', remotePath);
    
    try {
      // 步骤1: 先检查目标目录是否已存在
      const exists = await this.checkDirectoryExists(remotePath);
      
      if (exists) {
        console.log('✓ 远程目录已存在:', remotePath);
        return true;
      }
      
      console.log('目录不存在，开始创建...');
      
      // 步骤2: 逐级创建目录
      const pathParts = remotePath.split('/').filter(p => p);
      let currentPath = '';
      
      for (const part of pathParts) {
        currentPath += '/' + part;
        
        // 检查当前层级是否存在
        const partExists = await this.checkDirectoryExists(currentPath);
        
        if (!partExists) {
          console.log('需要创建:', currentPath);
          const created = await this.createSingleDirectory(currentPath);
          if (!created) {
            console.warn('无法创建目录:', currentPath);
            // 继续尝试，可能只是检测问题
          }
        } else {
          console.log('已存在:', currentPath);
        }
      }
      
      // 步骤3: 最终验证
      const finalCheck = await this.checkDirectoryExists(remotePath);
      if (finalCheck) {
        console.log('✓ 远程目录已就绪:', remotePath);
        return true;
      } else {
        console.warn('目录创建后验证失败，但将继续尝试操作');
        return false;
      }
      
    } catch (error) {
      console.error("确保远程目录存在时出错:", error);
      console.warn('将继续尝试操作');
      return false;
    }
  }

  async uploadData(options = {}) {
    const { onProgress = null, createBackup = true, _internal = false } = options;
    
    // 只有非内部调用才检查 syncInProgress
    if (!_internal && this.syncInProgress) {
      throw new Error(this.t("syncInProgress"));
    }
    
    if (!this.initialize()) {
      throw new Error(this.t("webdavNotConfigured"));
    }

    // 只有非内部调用才设置 syncInProgress
    if (!_internal) {
      this.syncInProgress = true;
    }
    this.notifySyncStatus("uploading", this.t("preparing"), 0);

    try {
      await this.ensureRemoteDirectory();
      this.notifySyncStatus("uploading", this.t("collecting"), 10);

      // 收集所有本地数据
      const data = await this.collectLocalData();
      data.dataVersion = DATA_VERSION;
      data.appVersion = this.getAppVersion();
      data.deviceInfo = this.getDeviceInfo();
      
      if (onProgress) onProgress(30);
      this.notifySyncStatus("uploading", this.t("uploading"), 30);

      // 如果需要，先备份现有的远程数据
      if (createBackup) {
        await this.createRemoteBackup();
      }

      if (onProgress) onProgress(50);
      this.notifySyncStatus("uploading", this.t("uploading"), 50);

      // 上传数据到 WebDAV
      const dataString = JSON.stringify(data, null, 2);
      // 确保路径格式正确
      const remotePath = this.config.remotePath.endsWith('/') 
        ? `${this.config.remotePath}${BACKUP_FILE_NAME}`
        : `${this.config.remotePath}/${BACKUP_FILE_NAME}`;
      
      console.log("========== 开始上传 ==========");
      console.log("目标文件:", remotePath);
      
      // 步骤1: 先确保目录存在
      console.log("步骤1: 检查并创建目录...");
      const dirReady = await this.ensureRemoteDirectory();
      console.log("目录准备状态:", dirReady ? "就绪" : "可能有问题，继续尝试");
      
      // 步骤2: 上传文件
      console.log("步骤2: 上传文件...");
      try {
        await this.client.putFileContents(remotePath, dataString, {
          overwrite: true,
        });
        console.log("✓ 文件上传成功");
      } catch (uploadError) {
        const status = uploadError.status || uploadError.response?.status;
        console.error("上传失败:", status, uploadError.message);
        
        if (status === 404 || status === 409) {
          // 再次尝试创建目录
          console.log("上传失败，再次尝试创建目录...");
          await this.ensureRemoteDirectory();
          
          // 重试上传
          console.log("重试上传...");
          try {
            await this.client.putFileContents(remotePath, dataString, {
              overwrite: true,
            });
            console.log("✓ 重试上传成功");
          } catch (retryError) {
            console.error("重试上传也失败:", retryError.message);
            throw retryError;
          }
        } else if (status === 405) {
          throw new Error("上传失败 (405): WebDAV 服务器不允许此操作。请检查远程路径权限。");
        } else {
          throw uploadError;
        }
      }

      if (onProgress) onProgress(90);
      this.notifySyncStatus("uploading", this.t("finishing"), 90);

      // 更新最后同步时间
      this.config.lastSync = new Date().toISOString();
      this.config.lastSyncType = "upload";
      webdavConfigRepository.update(this.config);

      if (onProgress) onProgress(100);
      this.notifySyncStatus("completed", this.t("uploadSuccess"), 100);

      console.log("✓ 数据上传成功:", {
        todoLists: Object.keys(data.todoLists).length,
        repeatingEvents: Object.keys(data.repeatingEvents).length,
        timestamp: data.timestamp,
      });

      return { 
        success: true, 
        message: this.t("uploadSuccess"),
        stats: {
          todoListsCount: Object.keys(data.todoLists).length,
          repeatingEventsCount: Object.keys(data.repeatingEvents).length,
          customListsCount: data.customListIds?.length || 0,
        },
        timestamp: data.timestamp 
      };
    } catch (error) {
      console.error("Upload error:", error);
      this.notifySyncStatus("error", error.message, 0);
      throw this.enhanceError(error, "upload");
    } finally {
      if (!_internal) {
        this.syncInProgress = false;
      }
    }
  }

  // 收集本地所有数据
  async collectLocalData() {
    return new Promise((resolve, reject) => {
      const dbRequest = indexedDB.open(DB_NAME, DB_VERSION);
      
      dbRequest.onerror = () => {
        reject(new Error(this.t("dbOpenError")));
      };

      dbRequest.onsuccess = (event) => {
        const db = event.target.result;
        
        try {
          const data = {
            todoLists: {},
            repeatingEvents: {},
            repeatingEventsByDate: {},
            customListIds: customToDoListIdsRepository.load(),
            config: this.getSafeConfig(),
            timestamp: new Date().toISOString(),
          };

          const storeNames = ["todo_lists", "repeating_events", "repeating_events_by_date"];
          const availableStores = storeNames.filter(name => db.objectStoreNames.contains(name));
          
          if (availableStores.length === 0) {
            db.close();
            resolve(data);
            return;
          }

          const transaction = db.transaction(availableStores, "readonly");

          transaction.oncomplete = () => {
            db.close();
            resolve(data);
          };

          transaction.onerror = () => {
            db.close();
            reject(new Error(this.t("dbReadError")));
          };

          // 读取 todo_lists
          if (db.objectStoreNames.contains("todo_lists")) {
            const todoStore = transaction.objectStore("todo_lists");
            const todoRequest = todoStore.openCursor();
            
            todoRequest.onsuccess = (e) => {
              const cursor = e.target.result;
              if (cursor) {
                data.todoLists[cursor.key] = cursor.value;
                cursor.continue();
              }
            };
          }

          // 读取 repeating_events
          if (db.objectStoreNames.contains("repeating_events")) {
            const eventStore = transaction.objectStore("repeating_events");
            const eventRequest = eventStore.openCursor();
            
            eventRequest.onsuccess = (e) => {
              const cursor = e.target.result;
              if (cursor) {
                data.repeatingEvents[cursor.key] = cursor.value;
                cursor.continue();
              }
            };
          }

          // 读取 repeating_events_by_date
          if (db.objectStoreNames.contains("repeating_events_by_date")) {
            const dateStore = transaction.objectStore("repeating_events_by_date");
            const dateRequest = dateStore.openCursor();
            
            dateRequest.onsuccess = (e) => {
              const cursor = e.target.result;
              if (cursor) {
                data.repeatingEventsByDate[cursor.key] = cursor.value;
                cursor.continue();
              }
            };
          }
        } catch (error) {
          db.close();
          reject(error);
        }
      };
    });
  }

  // 获取安全的配置（排除敏感信息）
  getSafeConfig() {
    const config = configRepository.load();
    // 排除一些不需要同步的配置
    // eslint-disable-next-line no-unused-vars
    const { importing, ...safeConfig } = config;
    return safeConfig;
  }

  // 获取应用版本
  getAppVersion() {
    try {
      const config = configRepository.load();
      return config.version || "unknown";
    } catch {
      return "unknown";
    }
  }

  // 获取设备信息
  getDeviceInfo() {
    return {
      platform: navigator.platform || "unknown",
      userAgent: navigator.userAgent.substring(0, 100),
      language: navigator.language,
      timestamp: new Date().toISOString(),
    };
  }

  // 创建远程备份
  async createRemoteBackup() {
    try {
      const remotePath = this.config.remotePath.endsWith('/') 
        ? `${this.config.remotePath}${BACKUP_FILE_NAME}`
        : `${this.config.remotePath}/${BACKUP_FILE_NAME}`;
      
      // 尝试获取现有文件内容
      let contents = null;
      try {
        contents = await this.client.getFileContents(remotePath, { format: "text" });
      } catch (getError) {
        // 文件不存在或无法读取，跳过备份
        console.log("远程文件不存在，跳过备份创建");
        return;
      }
      
      if (contents) {
        const backupPath = this.config.remotePath.endsWith('/') 
          ? `${this.config.remotePath}weektodo-backup-prev.json`
          : `${this.config.remotePath}/weektodo-backup-prev.json`;
        
        // 保存为备份
        await this.client.putFileContents(backupPath, contents, { overwrite: true });
        console.log("✓ 远程备份已创建:", backupPath);
      }
    } catch (error) {
      // 备份失败不影响主流程
      console.warn("创建远程备份时出错（非致命）:", error.message);
    }
  }

  async downloadData(options = {}) {
    const { onProgress = null, mergeData = false, createLocalBackup = true, _internal = false } = options;
    
    // 只有非内部调用才检查 syncInProgress
    if (!_internal && this.syncInProgress) {
      throw new Error(this.t("syncInProgress"));
    }
    
    if (!this.initialize()) {
      throw new Error(this.t("webdavNotConfigured"));
    }

    // 只有非内部调用才设置 syncInProgress
    if (!_internal) {
      this.syncInProgress = true;
    }
    this.notifySyncStatus("downloading", this.t("preparing"), 0);

    try {
      const remotePath = this.config.remotePath.endsWith('/') 
        ? `${this.config.remotePath}${BACKUP_FILE_NAME}`
        : `${this.config.remotePath}/${BACKUP_FILE_NAME}`;
      
      if (onProgress) onProgress(10);
      this.notifySyncStatus("downloading", this.t("checking"), 10);
      
      if (onProgress) onProgress(20);
      this.notifySyncStatus("downloading", this.t("downloading"), 20);

      // 直接尝试下载远程数据，而不是先检查是否存在
      let fileContents;
      try {
        fileContents = await this.client.getFileContents(remotePath, {
          format: "text",
        });
      } catch (getError) {
        if (getError.status === 404) {
          throw new Error(this.t("backupNotFound"));
        }
        throw getError;
      }

      if (onProgress) onProgress(40);

      const remoteData = JSON.parse(fileContents);
      
      // 验证数据格式
      this.validateDataFormat(remoteData);

      if (onProgress) onProgress(50);
      this.notifySyncStatus("downloading", this.t("restoring"), 50);

      // 如果需要，创建本地备份
      if (createLocalBackup) {
        await this.createLocalBackup();
      }

      if (onProgress) onProgress(60);

      // 恢复数据
      if (mergeData) {
        await this.mergeRemoteData(remoteData);
      } else {
        await this.restoreRemoteData(remoteData);
      }

      if (onProgress) onProgress(90);
      this.notifySyncStatus("downloading", this.t("finishing"), 90);

      // 更新最后同步时间
      this.config.lastSync = new Date().toISOString();
      this.config.lastSyncType = "download";
      webdavConfigRepository.update(this.config);

      if (onProgress) onProgress(100);
      this.notifySyncStatus("completed", this.t("downloadSuccess"), 100);

      console.log("✓ 数据下载成功:", {
        todoLists: Object.keys(remoteData.todoLists || {}).length,
        repeatingEvents: Object.keys(remoteData.repeatingEvents || {}).length,
        timestamp: remoteData.timestamp,
      });

      return {
        success: true,
        message: this.t("downloadSuccess"),
        stats: {
          todoListsCount: Object.keys(remoteData.todoLists || {}).length,
          repeatingEventsCount: Object.keys(remoteData.repeatingEvents || {}).length,
          customListsCount: remoteData.customListIds?.length || 0,
        },
        timestamp: remoteData.timestamp,
        remoteDeviceInfo: remoteData.deviceInfo,
      };
    } catch (error) {
      console.error("Download error:", error);
      this.notifySyncStatus("error", error.message, 0);
      throw this.enhanceError(error, "download");
    } finally {
      if (!_internal) {
        this.syncInProgress = false;
      }
    }
  }

  // 验证数据格式
  validateDataFormat(data) {
    if (!data || typeof data !== "object") {
      throw new Error(this.t("invalidDataFormat"));
    }
    
    // 基本结构检查
    if (!data.timestamp) {
      console.warn("数据缺少时间戳，可能是旧版本格式");
    }
    
    // 确保必要的字段存在
    data.todoLists = data.todoLists || {};
    data.repeatingEvents = data.repeatingEvents || {};
    data.customListIds = data.customListIds || [];
    
    return true;
  }

  // 创建本地备份
  async createLocalBackup() {
    try {
      const localData = await this.collectLocalData();
      const backupKey = "weektodo_local_backup";
      const backup = {
        data: localData,
        createdAt: new Date().toISOString(),
      };
      storageRepository.set(backupKey, backup);
      console.log("✓ 本地备份已创建");
    } catch (error) {
      console.warn("创建本地备份时出错（非致命）:", error.message);
    }
  }

  // 恢复本地备份
  async restoreLocalBackup() {
    const backupKey = "weektodo_local_backup";
    const backup = storageRepository.get(backupKey);
    
    if (!backup || !backup.data) {
      throw new Error(this.t("noLocalBackup"));
    }
    
    await this.restoreRemoteData(backup.data);
    return backup.createdAt;
  }

  // 完全恢复远程数据（覆盖本地）
  async restoreRemoteData(data) {
    return new Promise((resolve, reject) => {
      const dbRequest = indexedDB.open(DB_NAME, DB_VERSION);
      
      dbRequest.onerror = () => {
        reject(new Error(this.t("dbOpenError")));
      };

      dbRequest.onsuccess = async (event) => {
        const db = event.target.result;
        
        try {
          // 恢复 todo_lists
          if (data.todoLists && db.objectStoreNames.contains("todo_lists")) {
            const clearTx = db.transaction(["todo_lists"], "readwrite");
            const clearStore = clearTx.objectStore("todo_lists");
            await this.promisifyRequest(clearStore.clear());
            
            for (const [key, value] of Object.entries(data.todoLists)) {
              const addTx = db.transaction(["todo_lists"], "readwrite");
              const addStore = addTx.objectStore("todo_lists");
              await this.promisifyRequest(addStore.put(value, key));
            }
          }

          // 恢复 repeating_events
          if (data.repeatingEvents && db.objectStoreNames.contains("repeating_events")) {
            const clearTx = db.transaction(["repeating_events"], "readwrite");
            const clearStore = clearTx.objectStore("repeating_events");
            await this.promisifyRequest(clearStore.clear());
            
            for (const [key, value] of Object.entries(data.repeatingEvents)) {
              const addTx = db.transaction(["repeating_events"], "readwrite");
              const addStore = addTx.objectStore("repeating_events");
              await this.promisifyRequest(addStore.put(value, key));
            }
          }

          // 恢复 repeating_events_by_date
          if (data.repeatingEventsByDate && db.objectStoreNames.contains("repeating_events_by_date")) {
            const clearTx = db.transaction(["repeating_events_by_date"], "readwrite");
            const clearStore = clearTx.objectStore("repeating_events_by_date");
            await this.promisifyRequest(clearStore.clear());
            
            for (const [key, value] of Object.entries(data.repeatingEventsByDate)) {
              const addTx = db.transaction(["repeating_events_by_date"], "readwrite");
              const addStore = addTx.objectStore("repeating_events_by_date");
              await this.promisifyRequest(addStore.put(value, key));
            }
          }

          db.close();

          // 恢复 localStorage 数据
          if (data.customListIds) {
            customToDoListIdsRepository.update(data.customListIds);
          }

          // 恢复配置（保留一些本地特定的设置）
          if (data.config) {
            const currentConfig = configRepository.load();
            const mergedConfig = {
              ...data.config,
              // 保留本地特定设置
              language: currentConfig.language,
              zoom: currentConfig.zoom,
              darkTheme: currentConfig.darkTheme,
              darkTrayIcon: currentConfig.darkTrayIcon,
            };
            configRepository.update(mergedConfig);
          }

          resolve();
        } catch (error) {
          db.close();
          reject(error);
        }
      };
    });
  }

  // 合并远程数据（保留本地数据，添加远程新数据）
  async mergeRemoteData(remoteData) {
    const localData = await this.collectLocalData();
    
    return new Promise((resolve, reject) => {
      const dbRequest = indexedDB.open(DB_NAME, DB_VERSION);
      
      dbRequest.onerror = () => {
        reject(new Error(this.t("dbOpenError")));
      };

      dbRequest.onsuccess = async (event) => {
        const db = event.target.result;
        
        try {
          // 合并 todo_lists（保留本地已有的，添加远程新的）
          if (remoteData.todoLists && db.objectStoreNames.contains("todo_lists")) {
            for (const [key, value] of Object.entries(remoteData.todoLists)) {
              if (!localData.todoLists[key]) {
                const tx = db.transaction(["todo_lists"], "readwrite");
                const store = tx.objectStore("todo_lists");
                await this.promisifyRequest(store.put(value, key));
              } else {
                // 合并同一日期的任务列表
                const merged = this.mergeTaskLists(localData.todoLists[key], value);
                const tx = db.transaction(["todo_lists"], "readwrite");
                const store = tx.objectStore("todo_lists");
                await this.promisifyRequest(store.put(merged, key));
              }
            }
          }

          // 合并 repeating_events
          if (remoteData.repeatingEvents && db.objectStoreNames.contains("repeating_events")) {
            for (const [key, value] of Object.entries(remoteData.repeatingEvents)) {
              if (!localData.repeatingEvents[key]) {
                const tx = db.transaction(["repeating_events"], "readwrite");
                const store = tx.objectStore("repeating_events");
                await this.promisifyRequest(store.put(value, key));
              }
            }
          }

          db.close();

          // 合并自定义列表 ID
          if (remoteData.customListIds) {
            const localIds = new Set(localData.customListIds || []);
            const mergedIds = [...localIds];
            for (const id of remoteData.customListIds) {
              if (!localIds.has(id)) {
                mergedIds.push(id);
              }
            }
            customToDoListIdsRepository.update(mergedIds);
          }

          resolve();
        } catch (error) {
          db.close();
          reject(error);
        }
      };
    });
  }

  // 合并两个任务列表
  mergeTaskLists(localList, remoteList) {
    if (!Array.isArray(localList) || !Array.isArray(remoteList)) {
      return localList || remoteList || [];
    }
    
    const localIds = new Set(localList.map(t => t.id));
    const merged = [...localList];
    
    for (const remoteTask of remoteList) {
      if (!localIds.has(remoteTask.id)) {
        merged.push(remoteTask);
      }
    }
    
    return merged;
  }

  // 将 IndexedDB 请求转换为 Promise
  promisifyRequest(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // 增强错误信息
  enhanceError(error, operation) {
    let message = error.message || "Unknown error";
    
    if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
      message = this.t("webdavErrorNetwork");
    } else if (error.status === 401) {
      message = this.t("webdavError401");
    } else if (error.status === 403) {
      message = this.t("webdavError403");
    } else if (error.status === 404) {
      message = this.t("webdavError404");
    } else if (error.status === 405) {
      message = this.t("webdavError405");
    } else if (error.status === 507) {
      message = this.t("webdavError507");
    }
    
    const enhancedError = new Error(message);
    enhancedError.originalError = error;
    enhancedError.operation = operation;
    return enhancedError;
  }

  async syncData(options = {}) {
    const { 
      strategy = "auto", // auto, upload, download, merge
      onProgress = null,
      forceUpload = false,
      forceDownload = false,
    } = options;

    if (this.syncInProgress) {
      throw new Error(this.t("syncInProgress"));
    }

    if (!this.initialize()) {
      throw new Error(this.t("webdavNotConfigured"));
    }

    this.syncInProgress = true;
    this.notifySyncStatus("syncing", this.t("preparing"), 0);

    try {
      const remotePath = this.config.remotePath.endsWith('/') 
        ? `${this.config.remotePath}${BACKUP_FILE_NAME}`
        : `${this.config.remotePath}/${BACKUP_FILE_NAME}`;
      
      if (onProgress) onProgress(10);
      
      // 尝试检查远程文件是否存在，如果失败则假设不存在
      let exists = false;
      let remoteData = null;
      
      try {
        exists = await this.client.exists(remotePath);
        console.log("远程文件存在检查:", remotePath, exists);
      } catch (existsError) {
        console.warn("检查远程文件存在时出错，尝试直接获取文件:", existsError.message);
        // 尝试直接获取文件内容来判断是否存在
        try {
          const contents = await this.client.getFileContents(remotePath, { format: "text" });
          remoteData = JSON.parse(contents);
          exists = true;
          console.log("通过获取文件内容确认远程文件存在");
        } catch (getError) {
          if (getError.status === 404) {
            exists = false;
            console.log("远程文件不存在 (404)");
          } else {
            console.warn("获取远程文件失败:", getError.message);
            exists = false;
          }
        }
      }

      // 强制上传
      if (forceUpload) {
        return await this.uploadData({ onProgress, createBackup: exists, _internal: true });
      }

      // 强制下载
      if (forceDownload) {
        if (!exists) {
          throw new Error(this.t("backupNotFound"));
        }
        return await this.downloadData({ onProgress, _internal: true });
      }

      if (!exists) {
        // 如果远程没有备份，直接上传
        console.log("远程无备份，执行首次上传...");
        return await this.uploadData({ onProgress, createBackup: false, _internal: true });
      }

      if (onProgress) onProgress(20);

      // 获取远程文件信息（如果还没有获取）
      if (!remoteData) {
        const fileContents = await this.client.getFileContents(remotePath, {
          format: "text",
        });
        remoteData = JSON.parse(fileContents);
      }
      const remoteTimestamp = new Date(remoteData.timestamp || 0);
      
      // 收集本地数据用于比较
      const localData = await this.collectLocalData();
      const localTimestamp = new Date(this.config.lastSync || 0);

      if (onProgress) onProgress(30);

      // 根据策略决定同步方向
      let result;
      
      switch (strategy) {
        case "upload":
          result = await this.uploadData({ onProgress, createBackup: true, _internal: true });
          break;
          
        case "download":
          result = await this.downloadData({ onProgress, _internal: true });
          break;
          
        case "merge":
          // 合并策略：保留两边的数据
          result = await this.downloadData({ onProgress, mergeData: true, _internal: true });
          break;
          
        case "auto":
        default: {
          // 自动策略：比较时间戳和数据量
          const shouldDownload = this.shouldDownloadFromRemote(
            localData, 
            remoteData, 
            localTimestamp, 
            remoteTimestamp
          );
          
          if (shouldDownload) {
            console.log("检测到远程数据较新，执行下载...");
            result = await this.downloadData({ onProgress, _internal: true });
          } else {
            console.log("本地数据较新或无变化，执行上传...");
            result = await this.uploadData({ onProgress, createBackup: true, _internal: true });
          }
          break;
        }
      }

      return result;
    } catch (error) {
      console.error("Sync error:", error);
      this.notifySyncStatus("error", error.message, 0);
      throw this.enhanceError(error, "sync");
    } finally {
      this.syncInProgress = false;
    }
  }

  // 判断是否应该从远程下载
  shouldDownloadFromRemote(localData, remoteData, localTimestamp, remoteTimestamp) {
    // 如果从未同步过，查看哪边数据更多
    if (!this.config.lastSync) {
      const localCount = Object.keys(localData.todoLists).length + 
                        Object.keys(localData.repeatingEvents).length;
      const remoteCount = Object.keys(remoteData.todoLists || {}).length + 
                         Object.keys(remoteData.repeatingEvents || {}).length;
      
      // 如果远程数据比本地多很多，应该下载
      return remoteCount > localCount + 5;
    }
    
    // 如果远程数据时间戳更新，应该下载
    if (remoteTimestamp > localTimestamp) {
      return true;
    }
    
    return false;
  }

  // 获取远程数据信息（不下载完整数据）
  async getRemoteInfo() {
    if (!this.initialize()) {
      return null;
    }

    try {
      const remotePath = `${this.config.remotePath}/${BACKUP_FILE_NAME}`;
      const exists = await this.client.exists(remotePath);
      
      if (!exists) {
        return { exists: false };
      }

      const stat = await this.client.stat(remotePath);
      const fileContents = await this.client.getFileContents(remotePath, {
        format: "text",
      });
      const data = JSON.parse(fileContents);

      return {
        exists: true,
        size: stat.size,
        lastModified: stat.lastmod,
        timestamp: data.timestamp,
        dataVersion: data.dataVersion,
        deviceInfo: data.deviceInfo,
        stats: {
          todoListsCount: Object.keys(data.todoLists || {}).length,
          repeatingEventsCount: Object.keys(data.repeatingEvents || {}).length,
          customListsCount: data.customListIds?.length || 0,
        },
      };
    } catch (error) {
      console.error("获取远程信息失败:", error);
      return { exists: false, error: error.message };
    }
  }

  // 获取本地数据统计
  async getLocalStats() {
    try {
      const data = await this.collectLocalData();
      return {
        todoListsCount: Object.keys(data.todoLists).length,
        repeatingEventsCount: Object.keys(data.repeatingEvents).length,
        customListsCount: data.customListIds?.length || 0,
        lastSync: this.config?.lastSync,
        lastSyncType: this.config?.lastSyncType,
      };
    } catch (error) {
      console.error("获取本地统计失败:", error);
      return null;
    }
  }

  // 启动自动同步
  startAutoSync(intervalMinutes = null) {
    if (this.autoSyncInterval) {
      this.stopAutoSync();
    }

    // 使用配置的时间间隔，如果没有传入参数
    const config = webdavConfigRepository.load();
    const minutes = intervalMinutes || config.syncInterval || 30;
    const intervalMs = minutes * 60 * 1000;
    
    // 先执行一次同步（延迟10秒，等待应用初始化完成）
    setTimeout(async () => {
      if (!this.syncInProgress && config.autoSync && config.enabled) {
        try {
          console.log("执行启动时自动同步...");
          await this.syncData({ strategy: "auto" });
        } catch (error) {
          console.error("启动时自动同步失败:", error);
        }
      }
    }, 10000);
    
    this.autoSyncInterval = setInterval(async () => {
      const currentConfig = webdavConfigRepository.load();
      if (!this.syncInProgress && currentConfig?.autoSync && currentConfig?.enabled) {
        try {
          console.log("执行自动同步...");
          await this.syncData({ strategy: "auto" });
        } catch (error) {
          console.error("自动同步失败:", error);
        }
      }
    }, intervalMs);

    console.log(`自动同步已启动，间隔: ${minutes} 分钟`);
    return minutes;
  }

  // 重新启动自动同步（当配置改变时调用）
  restartAutoSync() {
    const config = webdavConfigRepository.load();
    if (config.autoSync && config.enabled) {
      return this.startAutoSync(config.syncInterval);
    } else {
      this.stopAutoSync();
      return 0;
    }
  }

  // 停止自动同步
  stopAutoSync() {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
      console.log("自动同步已停止");
    }
  }

  // 删除远程备份
  async deleteRemoteBackup() {
    if (!this.initialize()) {
      throw new Error(this.t("webdavNotConfigured"));
    }

    try {
      const remotePath = `${this.config.remotePath}/${BACKUP_FILE_NAME}`;
      const exists = await this.client.exists(remotePath);
      
      if (exists) {
        await this.client.deleteFile(remotePath);
        console.log("✓ 远程备份已删除");
      }

      // 删除备份文件
      const backupPath = `${this.config.remotePath}/weektodo-backup-prev.json`;
      const backupExists = await this.client.exists(backupPath);
      if (backupExists) {
        await this.client.deleteFile(backupPath);
      }

      return { success: true, message: this.t("remoteBackupDeleted") };
    } catch (error) {
      console.error("删除远程备份失败:", error);
      throw this.enhanceError(error, "delete");
    }
  }

  // 列出远程备份文件
  async listRemoteBackups() {
    if (!this.initialize()) {
      throw new Error(this.t("webdavNotConfigured"));
    }

    try {
      const exists = await this.client.exists(this.config.remotePath);
      if (!exists) {
        return [];
      }

      const contents = await this.client.getDirectoryContents(this.config.remotePath);
      return contents
        .filter(item => item.filename.includes("weektodo") && item.filename.endsWith(".json"))
        .map(item => ({
          name: item.basename,
          path: item.filename,
          size: item.size,
          lastModified: item.lastmod,
        }));
    } catch (error) {
      console.error("列出远程备份失败:", error);
      throw this.enhanceError(error, "list");
    }
  }

  // 检查是否需要同步（用于 UI 显示提示）
  async checkSyncNeeded() {
    if (!this.config?.enabled) {
      return { needed: false, reason: "disabled" };
    }

    try {
      const remoteInfo = await this.getRemoteInfo();
      // localStats 可用于未来的更复杂同步判断
      // eslint-disable-next-line no-unused-vars
      const localStats = await this.getLocalStats();

      if (!remoteInfo.exists) {
        return { 
          needed: true, 
          reason: "noRemoteBackup",
          suggestion: "upload",
        };
      }

      const remoteTimestamp = new Date(remoteInfo.timestamp || 0);
      const lastSync = new Date(this.config.lastSync || 0);

      if (remoteTimestamp > lastSync) {
        return {
          needed: true,
          reason: "remoteNewer",
          suggestion: "download",
          remoteTimestamp: remoteInfo.timestamp,
          localTimestamp: this.config.lastSync,
        };
      }

      // 检查是否有本地更改（简单检查）
      const timeSinceLastSync = Date.now() - lastSync.getTime();
      const oneHour = 60 * 60 * 1000;
      
      if (timeSinceLastSync > oneHour) {
        return {
          needed: true,
          reason: "localMaybeChanged",
          suggestion: "upload",
        };
      }

      return { needed: false, reason: "upToDate" };
    } catch (error) {
      return { needed: false, reason: "error", error: error.message };
    }
  }
}

export default new WebDAVSync();