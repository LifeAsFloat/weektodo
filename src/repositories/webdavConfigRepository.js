import storageRepository from "./storageRepository";

const WEBDAV_CONFIG_KEY = "webdav_config";

export default {
  load() {
    const config = storageRepository.get(WEBDAV_CONFIG_KEY);
    if (config) {
      return config;
    }
    return this.getDefault();
  },

  getDefault() {
    return {
      enabled: false,
      url: "",
      username: "",
      password: "",
      remotePath: "/weektodo",
      autoSync: false,
      syncInterval: 30, // 自动同步间隔（分钟）
      lastSync: null,
    };
  },

  update(config) {
    storageRepository.set(WEBDAV_CONFIG_KEY, config);
  },

  clear() {
    storageRepository.remove(WEBDAV_CONFIG_KEY);
  },
};
