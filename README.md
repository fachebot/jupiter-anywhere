# Jupiter Anywhere 🌐

此扩展智能集成了 Solana 最佳交易聚合器，能够在任意网站上使用。通过此扩展，你可以在 gmgn.ai 或 debot.ai 的代币页面直接通过 Jupiter 进行代币交易，避免支付高达 1% 的交易手续费(**Jupiter仅收取0.1%手续费**)。结合 Solflare 的一次性钱包，你还可以免去交易确认，享受便捷快速的交易体验。

<img width="630" height="1261" alt="image" src="https://github.com/user-attachments/assets/db24b75e-4ded-40e4-a76b-87b1a99bd5a8" />

## 🎯 核心功能

⚡ 一键安装，随处交易
* 🔧 零配置: 安装即用，无需任何设置
* 🌍 全网支持: 在任意网站都能使用 Jupiter 交易
* 🎨 无缝集成: 不影响原网站功能和样式

## 🚀 安装使用

### 第一步：下载扩展
```bash
git clone https://github.com/fachebot/jupiter-anywhere.git
cd jupiter-anywhere
```

### 第二步：生成图标（可选）
如果 `icons/` 目录中没有图标文件，运行以下命令生成：
```bash
node scripts/generate-icons.js
```

### 第三步：加载扩展
1. 打开 Chrome 浏览器，访问 `chrome://extensions/`
2. 开启右上角的 **"开发者模式"**
3. 点击 **"加载已解压的扩展程序"**
4. 选择 `jupiter-anywhere` 项目文件夹
5. 扩展安装完成！

### 第四步：开始使用
✅ 安装完成后，访问任意网站即可在网页左下角看到 Jupiter 图标，点击进入交易界面

✅ 在 GMGN 或 debot.ai 代币页面，会自动识别并设置交易对

✅ 享受无处不在的 DeFi 交易体验！

## 📁 项目结构

```
jupiter-anywhere/
├── manifest.json          # Chrome 扩展配置文件
├── background.js          # Service Worker (脚本下载和注入)
├── content.js             # Content Script (URL检测和消息发送)
├── rules.json             # CSP 规则配置
├── icons/                 # 扩展图标
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── scripts/
│   └── generate-icons.js  # 图标生成脚本
└── README.md
```

## 🔧 支持的网站

目前自动识别代币地址的网站：
- **gmgn.ai** - 自动识别 `/sol/token/` 路径下的代币
- **debot.ai** - 自动识别 `/token/solana/` 路径下的代币

在其他网站上，Jupiter 交易界面仍然可用，只是不会自动设置交易对。

## 🛠️ 技术实现

本扩展使用 Chrome Extension Manifest V3 开发，主要特性：

- **Service Worker**: 在后台下载并缓存 Jupiter 脚本，提高加载速度
- **Content Scripts**: 检测页面 URL 变化，自动识别代币地址
- **Script Injection**: 使用 `chrome.scripting.executeScript` 绕过 CSP 限制
- **Declarative Net Request**: 移除目标网站的 CSP 响应头，确保 Jupiter 资源正常加载

## ❓ 常见问题

### Jupiter 小部件没有显示？
1. 确保扩展已正确安装并启用
2. 刷新目标网页
3. 检查浏览器控制台是否有错误信息
4. 确认网站是否被扩展支持（gmgn.ai 或 debot.ai）

### 如何手动设置交易对？
即使不在支持的网站上，你也可以：
1. 点击页面左下角的 Jupiter 图标
2. 手动输入或选择输入/输出代币地址
3. 开始交易

### 扩展无法加载？
1. 确保 Chrome 浏览器版本 >= 88（支持 Manifest V3）
2. 检查 `manifest.json` 文件是否存在且格式正确
3. 在 `chrome://extensions/` 页面查看错误信息

## 📄 许可证

MIT License
