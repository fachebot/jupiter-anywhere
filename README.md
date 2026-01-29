# Jupiter Anywhere 🌐

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/fachebot/jupiter-anywhere)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Chrome](https://img.shields.io/badge/Chrome-Extension-yellow.svg)](https://chrome.google.com/webstore)

**Jupiter Anywhere** 是一个强大的 Chrome 浏览器扩展，智能集成 Solana 生态最佳交易聚合器 Jupiter，让你在任意网站上都能进行代币交易。

## ✨ 特性亮点

- 🚀 **零配置即用** - 安装后自动工作，无需任何设置
- 💰 **节省手续费** - 使用 Jupiter 仅需 0.1% 手续费，相比其他平台节省高达 90%
- 🌐 **全网支持** - 在任何网站都能使用，不受网站限制
- 🎯 **智能识别** - 自动识别 GMGN、debot.ai 等网站的代币地址
- 🎨 **无缝集成** - 不影响原网站功能和样式，完美融入
- ⚡ **快速交易** - 结合 Solflare 一次性钱包，免去交易确认步骤
- 🔒 **安全可靠** - 使用 Manifest V3，符合 Chrome 最新安全标准
- 📦 **轻量级** - 脚本缓存机制，快速加载，不占用过多资源

<img width="630" height="1261" alt="Jupiter Anywhere Demo" src="https://github.com/user-attachments/assets/db24b75e-4ded-40e4-a76b-87b1a99bd5a8" />

## 🎯 核心功能

### ⚡ 一键安装，随处交易
- **零配置**: 安装即用，无需任何设置或账户注册
- **全网支持**: 在任意网站都能使用 Jupiter 交易功能
- **无缝集成**: 智能处理页面样式冲突，不影响原网站功能

### 💡 智能代币识别
- **自动识别**: 在支持的网站上自动识别并设置交易对
- **手动输入**: 在不支持的网站上也可以手动输入代币地址
- **快速切换**: 支持快速切换输入/输出代币

### 🛡️ 技术优势
- **CSP 绕过**: 智能绕过网站的内容安全策略限制
- **动态监听**: 实时监听页面变化，自动适配 SPA 应用
- **性能优化**: 脚本缓存机制，1小时内无需重复下载

## 🚀 快速开始

### 系统要求

- Chrome 浏览器版本 >= 88（支持 Manifest V3）
- Windows、macOS 或 Linux 操作系统

### 安装步骤

#### 方法一：从 GitHub 下载安装（推荐普通用户）

1. **下载项目文件**
   - 访问项目 GitHub 页面：https://github.com/fachebot/jupiter-anywhere
   - 点击页面右上角的绿色 **"Code"** 按钮
   - 选择 **"Download ZIP"** 下载压缩包
   - 将下载的 ZIP 文件解压到任意位置（如桌面或文档文件夹）

2. **加载扩展**
   - 打开 Chrome 浏览器，访问 `chrome://extensions/`
   - 开启右上角的 **"开发者模式"**（Developer mode）开关
   - 点击 **"加载已解压的扩展程序"**（Load unpacked）按钮
   - 选择刚才解压的 `jupiter-anywhere` 文件夹
   - 扩展安装完成！

#### 方法二：从源码安装（推荐用于开发）

1. **克隆仓库**
   ```bash
   git clone https://github.com/fachebot/jupiter-anywhere.git
   cd jupiter-anywhere
   ```

2. **加载扩展**
   - 打开 Chrome 浏览器，访问 `chrome://extensions/`
   - 开启右上角的 **"开发者模式"**
   - 点击 **"加载已解压的扩展程序"**
   - 选择 `jupiter-anywhere` 项目文件夹
   - 扩展安装完成！

#### 方法三：从 Chrome Web Store 安装（即将推出）

扩展正在审核中，审核通过后可直接从 Chrome Web Store 安装。

### 使用指南

1. **首次使用**
   - 安装完成后，访问任意网站
   - 在网页左下角会看到 Jupiter 交易图标
   - 点击图标即可打开交易界面

2. **在支持的网站上**
   - 访问 **gmgn.ai**、**debot.ai**、**xxyy.io**、**axiom.trade**、**ave.ai**、**dbotx.com** 或 **defined.fi** 的代币页面
   - 扩展会自动识别代币地址并设置交易对
   - 直接输入交易数量即可开始交易

3. **在其他网站上**
   - 点击左下角的 Jupiter 图标
   - 手动输入或选择输入/输出代币地址
   - 设置交易数量后开始交易

### 使用技巧

- 💡 **快速交易**: 结合 Solflare 一次性钱包，可以免去交易确认步骤
- 💡 **代币搜索**: 在交易界面可以直接搜索代币名称或地址
- 💡 **价格对比**: Jupiter 会自动寻找最优交易路径，提供最佳价格
- 💡 **实时更新**: 扩展会自动监听页面 URL 变化，在 SPA 应用中也能正常工作

## 📁 项目结构

```
jupiter-anywhere/
├── manifest.json              # Chrome 扩展配置文件 (Manifest V3)
├── background.js              # Service Worker - 脚本下载、缓存和注入逻辑
├── content.js                 # Content Script - URL检测和消息通信
├── rules.json                 # Declarative Net Request 规则 - CSP 处理
├── icons/                     # 扩展图标资源
│   ├── icon16.png            # 16x16 图标
│   ├── icon48.png            # 48x48 图标
│   └── icon128.png           # 128x128 图标
├── LICENSE                    # MIT 许可证
└── README.md                  # 项目说明文档
```

### 文件说明

- **manifest.json**: Chrome 扩展的配置文件，定义了扩展的权限、资源和使用方式
- **background.js**: Service Worker，负责下载和缓存 Jupiter 脚本，处理脚本注入逻辑
- **content.js**: Content Script，运行在页面上下文中，负责检测 URL 变化并发送消息
- **rules.json**: Declarative Net Request 规则，用于移除目标网站的 CSP 响应头

## 🔧 支持的网站

### 自动识别代币地址的网站

扩展目前支持以下网站的自动代币识别：

| 网站 | URL 模式 | 说明 |
|------|---------|------|
| **gmgn.ai** | `/sol/token/{token}` | 自动识别 Solana 代币页面 |
| **debot.ai** | `/token/solana/{token}` | 自动识别代币信息页面 |
| **xxyy.io** | `/sol/{token}` | 自动识别代币地址（忽略查询参数） |
| **axiom.trade** | `/meme/{token}` | 自动识别代币地址（忽略查询参数） |
| **ave.ai** | `/token/{token}-solana` | 自动识别代币地址，移除 `-solana` 后缀 |
| **dbotx.com** | `/token/solana/{token}` | 自动识别代币信息页面 |
| **defined.fi** | `/sol/{token}` | 自动识别代币地址（忽略查询参数） |

### 通用支持

虽然只有上述网站支持自动识别，但 **Jupiter 交易界面在所有网站上都可以使用**。在不支持的网站上，你可以：

- 手动输入代币地址
- 使用代币搜索功能
- 从历史记录中选择

### 添加新网站支持

如果你想为其他网站添加自动识别功能，欢迎提交 Pull Request！主要需要修改 `content.js` 中的 `parseTokenAddress()` 函数。

## 🛠️ 技术实现

### 架构设计

本扩展使用 **Chrome Extension Manifest V3** 开发，采用现代化的架构设计：

```
┌─────────────────┐
│   Content.js    │  ← 检测页面 URL，发送消息
│  (页面上下文)    │
└────────┬────────┘
         │ chrome.runtime.sendMessage
         ▼
┌─────────────────┐
│  Background.js  │  ← 下载脚本，注入到页面
│ (Service Worker)│
└────────┬────────┘
         │ chrome.scripting.executeScript
         ▼
┌─────────────────┐
│  Jupiter Plugin │  ← 在页面中运行
│   (MAIN world)  │
└─────────────────┘
```

### 核心技术

#### 1. Service Worker (background.js)
- **脚本下载与缓存**: 自动下载 Jupiter 脚本并缓存 1 小时
- **智能重试机制**: 下载失败时自动重试，最多 3 次
- **脚本注入**: 使用 `chrome.scripting.executeScript` 在 MAIN world 中执行
- **样式管理**: 智能处理容器样式，确保插件正常显示且不遮挡页面

#### 2. Content Script (content.js)
- **URL 监听**: 使用多种方法监听页面 URL 变化
  - `popstate` 事件（浏览器前进/后退）
  - `pushState`/`replaceState` 拦截（SPA 路由）
  - `MutationObserver`（后备方案）
- **防抖机制**: 300ms 防抖，避免频繁触发
- **代币识别**: 智能解析 URL，提取代币地址

#### 3. CSP 绕过
- **Declarative Net Request**: 移除目标网站的 CSP 响应头
- **Function 构造函数**: 使用 `new Function()` 执行脚本，绕过 CSP 限制
- **MAIN world 注入**: 在页面上下文中执行，而非隔离的 content script 环境

#### 4. 样式处理优化
- **pointer-events 管理**: 容器设置 `pointer-events: none`，子元素设置 `auto`
- **MutationObserver**: 监听动态添加的元素，自动设置样式
- **定期检查**: 每 3 秒检查一次，确保所有元素都被正确处理
- **样式优先级**: 使用 `!important` 确保不被页面样式覆盖

### 性能优化

- ✅ **脚本缓存**: 1 小时内复用缓存的脚本，减少网络请求
- ✅ **延迟加载**: 等待页面基本加载完成后再注入脚本
- ✅ **防抖处理**: URL 变化时使用防抖，避免频繁操作
- ✅ **按需注入**: 只在需要时注入脚本，不占用过多资源

### 安全特性

- ✅ **Manifest V3**: 使用最新的扩展标准，更安全可靠
- ✅ **最小权限**: 只请求必要的权限
- ✅ **CSP 兼容**: 智能处理网站的安全策略
- ✅ **错误处理**: 完善的错误处理和日志记录

## ❓ 常见问题

### Jupiter 小部件没有显示？

**可能原因和解决方案：**

1. **扩展未启用**
   - 检查 `chrome://extensions/` 页面，确保扩展已启用
   - 确认扩展图标显示在浏览器工具栏上

2. **页面未完全加载**
   - 等待页面完全加载后再查看
   - 尝试刷新页面（F5 或 Ctrl+R）

3. **浏览器控制台错误**
   - 按 F12 打开开发者工具
   - 查看 Console 标签页是否有错误信息
   - 如有错误，请截图并提交 Issue

4. **网站兼容性问题**
   - 某些网站可能有特殊的安全策略
   - 尝试在其他网站上测试是否正常工作

### 输入框无法点击？

这个问题已在最新版本中修复。如果仍然遇到问题：

1. **刷新页面** - 重新加载页面以应用最新代码
2. **检查扩展版本** - 确保使用的是最新版本（0.1.0+）
3. **清除缓存** - 在 `chrome://extensions/` 页面重新加载扩展

### 如何手动设置交易对？

即使不在支持的网站上，你也可以手动设置：

1. 点击页面左下角的 Jupiter 图标
2. 在交易界面中：
   - 点击输入代币字段，搜索或输入代币地址
   - 点击输出代币字段，搜索或输入代币地址
   - 输入交易数量
   - 点击"交换"按钮开始交易

### 扩展无法加载？

**检查清单：**

1. **Chrome 版本**
   - 确保 Chrome 版本 >= 88（支持 Manifest V3）
   - 访问 `chrome://version/` 查看版本号

2. **文件完整性**
   - 确保所有文件都已下载完整
   - 检查 `manifest.json` 文件是否存在且格式正确

3. **错误信息**
   - 在 `chrome://extensions/` 页面查看错误详情
   - 点击扩展卡片上的"错误"按钮查看详细信息

4. **权限问题**
   - 确保扩展有必要的权限
   - 检查是否被其他扩展或安全软件阻止

### 交易失败怎么办？

1. **检查钱包连接** - 确保已连接 Solana 钱包（如 Phantom、Solflare）
2. **检查余额** - 确保钱包有足够的 SOL 支付 gas 费用
3. **检查代币余额** - 确保有足够的代币进行交易
4. **网络问题** - 检查网络连接是否正常
5. **查看错误信息** - Jupiter 界面会显示详细的错误信息

### 性能问题

如果扩展运行缓慢：

1. **清除缓存** - 在扩展设置中清除缓存
2. **禁用其他扩展** - 某些扩展可能会冲突
3. **更新扩展** - 确保使用最新版本

### 其他问题

如果遇到其他问题，请：

1. 查看浏览器控制台的错误信息
2. 在 GitHub 上提交 Issue，附上：
   - 问题描述
   - 复现步骤
   - 错误截图
   - 浏览器版本和扩展版本

## 🤝 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 开发指南

- 代码风格：遵循现有的代码风格
- 提交信息：使用清晰的提交信息
- 测试：确保代码在多个网站上正常工作
- 文档：更新相关文档

## 📝 更新日志

### v0.1.0 (当前版本)

- ✨ 初始版本发布
- ✨ 支持自动识别 GMGN 和 debot.ai 的代币地址
- ✨ 智能绕过 CSP 限制
- ✨ 脚本缓存机制，提升性能
- ✨ 动态 URL 监听，支持 SPA 应用
- 🐛 修复插件输入框无法点击的问题
- 🐛 优化样式处理，确保不遮挡页面内容
- 📚 完善的错误处理和日志记录

## 🔗 相关链接

- [Jupiter 官网](https://jup.ag/)
- [Jupiter API 文档](https://docs.jup.ag/)
- [Chrome 扩展开发文档](https://developer.chrome.com/docs/extensions/)
- [Solana 官网](https://solana.com/)

## 📄 许可证

本项目采用 [MIT License](LICENSE) 许可证。

## 👤 作者

**fachebot**

- GitHub: [@fachebot](https://github.com/fachebot)
- 项目主页: [jupiter-anywhere](https://github.com/fachebot/jupiter-anywhere)

## 🙏 致谢

- 感谢 [Jupiter](https://jup.ag/) 提供优秀的交易聚合服务
- 感谢所有贡献者和用户的支持

---

如果这个项目对你有帮助，请给个 ⭐ Star！
