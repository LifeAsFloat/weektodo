// WebDAV 连接测试脚本
// 用于测试坚果云 WebDAV 连接

const { createClient } = require("webdav");

// 坚果云 WebDAV 配置
const config = {
  url: "",
  username: "",
  password: "",
  remotePath: "/WebDAV/weektodo"  // 使用已存在的 WebDAV 目录
};

console.log("🔧 开始测试 WebDAV 连接...");
console.log("服务器地址:", config.url);
console.log("用户名:", config.username);
console.log("远程路径:", config.remotePath);
console.log("=" .repeat(50));

async function testWebDAVConnection() {
  try {
    // 创建 WebDAV 客户端
    console.log("\n✅ 步骤 1: 创建 WebDAV 客户端");
    const client = createClient(config.url, {
      username: config.username,
      password: config.password,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 30000,
      withCredentials: true,
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Cache-Control': 'no-cache',
      },
    });
    console.log("   客户端创建成功 ✓");

    // 测试连接 - 获取根目录
    console.log("\n✅ 步骤 2: 测试连接 (获取根目录)");
    const rootContents = await client.getDirectoryContents("/");
    console.log("   连接成功 ✓");
    console.log("   根目录文件/文件夹数量:", rootContents.length);
    if (rootContents.length > 0) {
      console.log("   前3个项目:");
      rootContents.slice(0, 3).forEach(item => {
        console.log(`     - ${item.basename} (${item.type})`);
      });
    }

    // 检查备份目录是否存在
    console.log("\n✅ 步骤 3: 检查备份目录");
    const backupExists = await client.exists(config.remotePath);
    if (backupExists) {
      console.log(`   目录 ${config.remotePath} 已存在 ✓`);
    } else {
      console.log(`   目录 ${config.remotePath} 不存在，正在创建...`);
      await client.createDirectory(config.remotePath);
      console.log("   目录创建成功 ✓");
    }

    // 测试上传文件
    console.log("\n✅ 步骤 4: 测试上传文件");
    const testData = {
      test: true,
      timestamp: new Date().toISOString(),
      message: "这是一个测试文件",
      appName: "WeekToDo",
    };
    const testFilePath = `${config.remotePath}/test-connection.json`;
    await client.putFileContents(testFilePath, JSON.stringify(testData, null, 2), {
      overwrite: true,
    });
    console.log("   测试文件上传成功 ✓");
    console.log("   文件路径:", testFilePath);

    // 测试下载文件
    console.log("\n✅ 步骤 5: 测试下载文件");
    const downloadedContent = await client.getFileContents(testFilePath, {
      format: "text",
    });
    const parsedData = JSON.parse(downloadedContent);
    console.log("   文件下载成功 ✓");
    console.log("   下载的内容:", parsedData);

    // 验证数据一致性
    console.log("\n✅ 步骤 6: 验证数据一致性");
    if (parsedData.timestamp === testData.timestamp) {
      console.log("   数据一致性验证通过 ✓");
    } else {
      console.log("   ⚠️ 警告: 数据不一致");
    }

    // 列出备份目录内容
    console.log("\n✅ 步骤 7: 列出备份目录内容");
    const backupContents = await client.getDirectoryContents(config.remotePath);
    console.log(`   备份目录包含 ${backupContents.length} 个文件/文件夹:`);
    backupContents.forEach(item => {
      const size = item.size ? `(${(item.size / 1024).toFixed(2)} KB)` : '';
      console.log(`     - ${item.basename} ${size}`);
    });

    // 测试完成
    console.log("\n" + "=".repeat(50));
    console.log("🎉 所有测试通过！WebDAV 连接正常工作");
    console.log("=".repeat(50));
    
    return true;
  } catch (error) {
    console.error("\n❌ 测试失败:");
    console.error("   错误类型:", error.name);
    console.error("   错误信息:", error.message);
    
    if (error.status) {
      console.error("   HTTP 状态码:", error.status);
    }
    
    if (error.response) {
      console.error("   响应详情:", error.response.statusText);
    }

    // 常见错误提示
    console.log("\n💡 故障排查建议:");
    if (error.message.includes("401") || error.message.includes("Unauthorized")) {
      console.log("   - 用户名或密码错误");
      console.log("   - 检查坚果云的应用密码（不是登录密码）");
    } else if (error.message.includes("404")) {
      console.log("   - 服务器路径不存在");
      console.log("   - 检查 URL 是否正确");
    } else if (error.message.includes("CORS") || error.message.includes("Failed to fetch")) {
      console.log("   - CORS 跨域限制");
      console.log("   - 请在 Electron 桌面应用中运行");
      console.log("   - 或配置服务器 CORS 响应头");
    } else if (error.message.includes("timeout")) {
      console.log("   - 网络超时");
      console.log("   - 检查网络连接");
      console.log("   - 检查防火墙设置");
    }
    
    return false;
  }
}

// 运行测试
testWebDAVConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error("未预期的错误:", error);
    process.exit(1);
  });
