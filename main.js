// ==UserScript==
// @name         Jupiter Anywhere
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  让 Jupiter 交易无处不在的油猴脚本 - 在任意网站智能集成 Solana 最佳交易聚合器
// @author       fachebot
// @match        *://*/*
// @grant        none
// @run-at       document-end
// @icon         https://jup.ag/favicon.ico
// @homepage     https://github.com/fachebot/jupiter-anywhere
// @supportURL   https://github.com/jup-ag/jupiter-plugin
// ==/UserScript==

(function () {
  "use strict";

  // ==================== 配置常量 ====================
  const CONFIG = {
    JUPITER_SCRIPT_URL: "https://plugin.jup.ag/plugin-v1.js",
    INIT_DELAY: 100,
    LOAD_DELAY: 500,
    MAX_RETRY_COUNT: 3,
    RETRY_DELAY: 1000,
    INITIAL_AMOUNT: "100000000",
    INITIAL_INPUT_MINT: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  };

  // ==================== 工具函数 ====================

  /**
   * 日志工具类
   */
  const Logger = {
    prefix: "[Jupiter Plugin]",

    info: (message, ...args) => {
      console.log(`${Logger.prefix} ℹ️ ${message}`, ...args);
    },

    success: (message, ...args) => {
      console.log(`${Logger.prefix} ✅ ${message}`, ...args);
    },

    warn: (message, ...args) => {
      console.warn(`${Logger.prefix} ⚠️ ${message}`, ...args);
    },

    error: (message, ...args) => {
      console.error(`${Logger.prefix} ❌ ${message}`, ...args);
    },
  };

  /**
   * 延迟执行工具
   * @param {number} ms - 延迟毫秒数
   * @returns {Promise}
   */
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  /**
   * 重试执行函数
   * @param {Function} fn - 要执行的函数
   * @param {number} maxRetries - 最大重试次数
   * @param {number} retryDelay - 重试间隔
   * @returns {Promise}
   */
  const retryAsync = async (
    fn,
    maxRetries = CONFIG.MAX_RETRY_COUNT,
    retryDelay = CONFIG.RETRY_DELAY
  ) => {
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries) {
          throw error;
        }
        Logger.warn(`执行失败，${retryDelay}ms后进行第${i + 1}次重试...`);
        await delay(retryDelay);
      }
    }
  };

  // ==================== 核心功能类 ====================

  /**
   * Token地址解析器
   */
  class TokenAddressParser {
    /**
     * 从URL中提取token地址
     * @returns {string|null} token地址或null
     */
    static parseTokenAddress() {
      try {
        const url = new URL(window.location.href);

        // 检查是否为GMGN网站的token页面
        if (
          url.hostname === "gmgn.ai" &&
          url.pathname.startsWith("/sol/token/")
        ) {
          return this.parseGMGNToken(url);
        }

        // 检查是否为debot.ai网站的token页面
        if (url.hostname === "debot.ai" && url.pathname.startsWith("/token/")) {
          return this.parseDebotToken(url);
        }

        return null;
      } catch (error) {
        Logger.error("解析URL时发生错误:", error);
        return null;
      }
    }

    /**
     * 解析GMGN token地址
     * @param {URL} url - URL对象
     * @returns {string|null} token地址或null
     */
    static parseGMGNToken(url) {
      try {
        // 提取token路径部分
        const tokenPath = url.pathname.replace("/sol/token/", "");
        const fullTokenPart = tokenPath.split("/")[0];

        // 检查是否包含下划线分隔符
        if (fullTokenPart.includes("_")) {
          // 取下划线后面的部分作为真正的token地址
          const tokenAddress = fullTokenPart.split("_").pop();

          if (tokenAddress && tokenAddress.length > 0) {
            Logger.success("检测到GMGN Token地址:", tokenAddress);
            return tokenAddress;
          }
        } else {
          // 如果没有下划线，直接使用整个部分
          if (fullTokenPart && fullTokenPart.length > 0) {
            Logger.success("检测到GMGN Token地址:", fullTokenPart);
            return fullTokenPart;
          }
        }

        Logger.warn("未找到有效的GMGN token地址");
        return null;
      } catch (error) {
        Logger.error("解析GMGN URL时发生错误:", error);
        return null;
      }
    }

    /**
     * 解析debot.ai token地址
     * @param {URL} url - URL对象
     * @returns {string|null} token地址或null
     */
    static parseDebotToken(url) {
      try {
        // debot.ai URL格式: /token/solana/[可选前缀_]tokenAddress
        // 例如: /token/solana/251185_2oQNkePakuPbHzrVVkQ875WHeewLHCd2cAwfwiLQbonk
        // 或者: /token/solana/2oQNkePakuPbHzrVVkQ875WHeewLHCd2cAwfwiLQbonk

        const pathParts = url.pathname
          .split("/")
          .filter((part) => part.length > 0);

        // 检查路径格式: ['token', 'solana', tokenInfo]
        if (
          pathParts.length >= 3 &&
          pathParts[0] === "token" &&
          pathParts[1] === "solana"
        ) {
          const tokenInfo = pathParts[2];

          if (!tokenInfo) {
            Logger.warn("debot.ai URL中未找到token信息");
            return null;
          }

          let tokenAddress;

          // 检查是否包含下划线分隔符
          if (tokenInfo.includes("_")) {
            // 取下划线后面的部分作为真正的token地址
            const parts = tokenInfo.split("_");
            tokenAddress = parts[parts.length - 1]; // 取最后一部分
          } else {
            // 如果没有下划线，直接使用整个部分
            tokenAddress = tokenInfo;
          }

          // 验证token地址格式（Solana地址通常是32-44个字符的base58编码）
          if (
            tokenAddress &&
            tokenAddress.length >= 32 &&
            tokenAddress.length <= 44
          ) {
            Logger.success("检测到debot.ai Token地址:", tokenAddress);
            return tokenAddress;
          } else {
            Logger.warn("debot.ai token地址格式不正确:", tokenAddress);
            return null;
          }
        }

        Logger.warn("debot.ai URL格式不匹配");
        return null;
      } catch (error) {
        Logger.error("解析debot.ai URL时发生错误:", error);
        return null;
      }
    }

    /**
     * 验证Solana token地址格式
     * @param {string} address - 地址字符串
     * @returns {boolean} 是否为有效格式
     */
    static isValidSolanaAddress(address) {
      if (!address || typeof address !== "string") {
        return false;
      }

      // Solana地址是base58编码，长度通常在32-44个字符之间
      const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
      return base58Regex.test(address);
    }

    /**
     * 通用token地址获取方法（推荐使用这个）
     * @returns {string|null} token地址或null
     */
    static getTokenAddress() {
      const address = this.parseTokenAddress();

      if (address && this.isValidSolanaAddress(address)) {
        return address;
      }

      if (address) {
        Logger.warn("检测到的地址格式可能不正确:", address);
      }

      return null;
    }
  }

  /**
   * Jupiter插件管理器
   */
  class JupiterManager {
    constructor() {
      this.isInitialized = false;
      this.retryCount = 0;
    }

    /**
     * 检查Jupiter是否已加载
     * @returns {boolean}
     */
    isJupiterLoaded() {
      return typeof window.Jupiter !== "undefined" && window.Jupiter.init;
    }

    /**
     * 生成Jupiter配置
     * @returns {Object} Jupiter配置对象
     */
    generateConfig() {
      const tokenAddress = TokenAddressParser.getTokenAddress();

      const config = {
        displayMode: "widget",
        widgetStyle: {
          position: "bottom-left",
        },
        formProps: {
          initialAmount: CONFIG.INITIAL_AMOUNT,
          initialInputMint: CONFIG.INITIAL_INPUT_MINT,
        },
        containerClassName: "asaa",
        containerStyles: {
          size: "20 px",
        },
      };

      // 如果检测到token地址，设置为输出token
      if (tokenAddress) {
        config.formProps = {
          ...config.formProps,
          swapMode: "ExactIn",
          initialOutputMint: tokenAddress,
        };
        Logger.info("已配置目标token:", tokenAddress);
      }

      return config;
    }

    /**
     * 修改Jupiter插件容器样式
     */
    async modifyJupiterStyles() {
      try {
        // 等待DOM元素出现，最多等待5秒
        const maxWaitTime = 5000;
        const checkInterval = 100;
        let waitTime = 0;

        while (waitTime < maxWaitTime) {
          const jupiterContainer = document.getElementById(
            "jupiter-plugin-instance"
          );

          if (jupiterContainer) {
            Logger.info("找到Jupiter容器，正在应用自定义样式...");

            jupiterContainer.style.cssText += `
            position: absolute;
            z-index: 2147483647 !important;
          `;

            Logger.success("Jupiter容器样式修改成功！");
            return true;
          }

          await delay(checkInterval);
          waitTime += checkInterval;
        }

        Logger.warn("未找到Jupiter容器元素，样式修改失败");
        return false;
      } catch (error) {
        Logger.error("修改Jupiter样式时发生错误:", error);
        return false;
      }
    }

    /**
     * 初始化Jupiter插件
     * @returns {Promise<boolean>} 是否初始化成功
     */
    async initJupiter() {
      try {
        if (!this.isJupiterLoaded()) {
          Logger.warn("Jupiter脚本尚未加载完成");
          return false;
        }

        const config = this.generateConfig();
        Logger.info("正在初始化Jupiter插件...", config);

        await window.Jupiter.init(config);

        // 在初始化完成后修改样式
        await this.modifyJupiterStyles();

        this.isInitialized = true;
        this.retryCount = 0;
        Logger.success("Jupiter插件初始化成功！");

        return true;
      } catch (error) {
        Logger.error("Jupiter插件初始化失败:", error);
        return false;
      }
    }

    /**
     * 带重试的初始化
     * @returns {Promise<void>}
     */
    async initWithRetry() {
      try {
        await retryAsync(async () => {
          const success = await this.initJupiter();
          if (!success) {
            throw new Error("初始化失败");
          }
        });
      } catch (error) {
        Logger.error("Jupiter插件初始化最终失败:", error);
      }
    }

    /**
     * 重置状态
     */
    reset() {
      this.isInitialized = false;
      this.retryCount = 0;
    }
  }

  /**
   * DOM管理器
   */
  class DOMManager {
    /**
     * 加载Jupiter脚本
     * @returns {Promise<void>}
     */
    static loadJupiterScript() {
      return new Promise((resolve, reject) => {
        // 检查脚本是否已存在
        const existingScript = document.querySelector(
          `script[src="${CONFIG.JUPITER_SCRIPT_URL}"]`
        );
        if (existingScript) {
          Logger.info("Jupiter脚本已存在");
          resolve();
          return;
        }

        Logger.info("正在加载Jupiter脚本...");

        const script = document.createElement("script");
        script.src = CONFIG.JUPITER_SCRIPT_URL;
        script.setAttribute("data-preload", "");
        script.defer = true;
        script.crossOrigin = "anonymous";

        script.onload = () => {
          Logger.success("Jupiter脚本加载成功");
          resolve();
        };

        script.onerror = (error) => {
          Logger.error("Jupiter脚本加载失败:", error);
          reject(new Error("脚本加载失败"));
        };

        document.head.appendChild(script);
      });
    }
  }

  /**
   * 页面监听器
   */
  class PageWatcher {
    constructor(jupiterManager) {
      this.jupiterManager = jupiterManager;
      this.currentUrl = window.location.href;
      this.observer = null;
    }

    /**
     * 处理页面变化
     */
    async handlePageChange() {
      Logger.info("页面已切换至:", window.location.href);

      // 重置Jupiter管理器状态
      this.jupiterManager.reset();

      // 延迟后重新初始化
      await delay(CONFIG.INIT_DELAY);
      await this.jupiterManager.initWithRetry();
    }

    /**
     * 开始监听页面变化
     */
    startWatching() {
      // 使用MutationObserver监听DOM变化来检测URL变化
      this.observer = new MutationObserver(() => {
        if (this.currentUrl !== window.location.href) {
          this.currentUrl = window.location.href;
          this.handlePageChange();
        }
      });

      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      Logger.info("页面监听器已启动");
    }

    /**
     * 停止监听
     */
    stopWatching() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
        Logger.info("页面监听器已停止");
      }
    }
  }

  // ==================== 主应用类 ====================

  /**
   * Jupiter插件应用主类
   */
  class JupiterPluginApp {
    constructor() {
      this.jupiterManager = new JupiterManager();
      this.pageWatcher = new PageWatcher(this.jupiterManager);
    }

    /**
     * 初始化应用
     */
    async init() {
      try {
        Logger.info("🚀 Jupiter Plugin Enhanced 正在启动...");

        // 1. 加载Jupiter脚本
        await DOMManager.loadJupiterScript();
        await delay(CONFIG.INIT_DELAY);

        // 2. 启动页面监听器
        this.pageWatcher.startWatching();

        // 3. 初始化Jupiter插件
        await this.setupInitialLoad();

        Logger.success("🎉 Jupiter Plugin Enhanced 启动完成！");
      } catch (error) {
        Logger.error("应用初始化失败:", error);
      }
    }

    /**
     * 设置初始加载
     */
    async setupInitialLoad() {
      // 监听页面加载完成事件
      if (document.readyState === "loading") {
        window.addEventListener("load", async () => {
          await delay(CONFIG.LOAD_DELAY);
          await this.jupiterManager.initWithRetry();
        });
      } else {
        // 页面已加载完成，直接初始化
        await delay(CONFIG.LOAD_DELAY);
        await this.jupiterManager.initWithRetry();
      }
    }

    /**
     * 销毁应用
     */
    destroy() {
      this.pageWatcher.stopWatching();
      Logger.info("应用已销毁");
    }
  }

  // ==================== 应用启动 ====================

  // 创建并启动应用
  const app = new JupiterPluginApp();
  app.init();

  // 页面卸载时清理资源
  window.addEventListener("beforeunload", () => {
    app.destroy();
  });
})();
