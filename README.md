# Jupiter Anywhere 🌐
此脚本智能集成了 Solana 最佳交易聚合器，能够在任意网站上使用。通过此脚本，你可以在 gmgn.ai 或 debot.ai 的代币页面直接通过 Jupiter 进行代币交易，避免支付高达 1% 的交易手续费(**Jupiter仅收取0.1%手续费**)。结合 Solflare 的一次性钱包，你还可以免去交易确认，享受便捷快速的交易体验。

<img width="630" height="1261" alt="image" src="https://github.com/user-attachments/assets/db24b75e-4ded-40e4-a76b-87b1a99bd5a8" />

## 🎯 核心功能
⚡ 一键安装，随处交易
* 🔧 零配置: 安装即用，无需任何设置
* 🌍 全网支持: 在任意网站都能使用 Jupiter 交易
* 🎨 无缝集成: 不影响原网站功能和样式

## 🚀 安装使用
### 第一步：安装油猴插件
选择你的浏览器安装 Tampermonkey：

|  浏览器   | 安装链接  |
|  ----  | ----  |
| 🔵 Chrome  | [Chrome 网上应用店](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) |
| 🦊 Firefox  | [Firefox 附加组件](https://addons.mozilla.org/zh-CN/firefox/addon/tampermonkey/) |
| 🔷 Edge  | [Edge 扩展商店](https://microsoftedge.microsoft.com/addons/detail/%E7%AF%A1%E6%94%B9%E7%8C%B4/iikmkjmpaadaobahmlepeloendndfphd) |
| 🍎 Safari  | [Safari 扩展](https://apps.apple.com/us/app/tampermonkey-classic/id1482490089?mt=12) |

安装成功后请打开浏览器 “**开发者模式**” 并勾选 “**允许运行用户脚本**” 选项。

<img width="1170" height="861" alt="image" src="https://github.com/user-attachments/assets/b3bb2085-2e2c-45f3-9295-8455df8f554b" />


### 第二步：安装脚本
1. 打开 Tampermonkey 管理面板
2. 点击 "添加新脚本..."
3. 复制粘贴 [main.js](main.js) 脚本代码
4. 保存并启用

### 第三步：开始使用
✅ 安装完成后，访问任意网站即可在网页左下角看到 Jupiter 图标，点击进入交易界面

✅ 在 GMGN 代币页面，会自动识别并设置交易对

✅ 享受无处不在的 DeFi 交易体验！

## ⚙️ 配置选项
脚本提供灵活的配置选项，可根据需要调整：
```js
const CONFIG = {
    // Jupiter 插件地址
    JUPITER_SCRIPT_URL: 'https://plugin.jup.ag/plugin-v1.js',
    
    // 目标容器 ID
    TARGET_DIV_ID: 'jupiter-plugin',
    
    // 时间设置
    INIT_DELAY: 100,        // 初始化延迟 (毫秒)
    LOAD_DELAY: 500,        // 页面加载延迟 (毫秒)
    
    // 重试设置
    MAX_RETRY_COUNT: 3,     // 最大重试次数
    RETRY_DELAY: 1000,      // 重试间隔 (毫秒)

    // 交易设置
    INITIAL_AMOUNT: "100000000",                                       // 默认金额
    INITIAL_INPUT_MINT: "So11111111111111111111111111111111111111112"  // 默认输入代币
};
```
