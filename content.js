/**
 * Jupiter Anywhere - Content Script
 * 此脚本负责检测页面 URL 并请求 background script 注入 Jupiter
 */

(function() {
  'use strict';

  // ==================== 常量配置 ====================

  /** 初始注入延迟（毫秒） */
  const INITIAL_INJECTION_DELAY_MS = 500;

  /** URL 变化检测防抖延迟（毫秒） */
  const URL_CHANGE_DEBOUNCE_MS = 300;

  /** Solana 地址正则表达式 */
  const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

  // ==================== 工具函数 ====================

  /**
   * 防抖函数
   * @param {Function} func - 要防抖的函数
   * @param {number} wait - 等待时间（毫秒）
   * @returns {Function} 防抖后的函数
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // ==================== 主要逻辑 ====================

  // 防止重复注入
  if (window.__jupiterAnywhereInjected) {
    return;
  }
  window.__jupiterAnywhereInjected = true;

  /**
   * 从 URL 中解析 token 地址
   * 支持多个网站的 URL 格式，所有解析都基于 pathname，忽略查询参数
   * @returns {string|null} 解析到的 token 地址，如果无法解析则返回 null
   */
  function parseTokenAddress() {
    try {
      const url = new URL(window.location.href);

      // GMGN 网站: /sol/token/{token}
      if (url.hostname === 'gmgn.ai' && url.pathname.startsWith('/sol/token/')) {
        const tokenPath = url.pathname.replace('/sol/token/', '');
        const fullTokenPart = tokenPath.split('/')[0];
        
        if (fullTokenPart.includes('_')) {
          return fullTokenPart.split('_').pop();
        }
        return fullTokenPart || null;
      }

      // debot.ai 网站: /token/solana/{token}
      if (url.hostname === 'debot.ai' && url.pathname.startsWith('/token/')) {
        const pathParts = url.pathname.split('/').filter(p => p.length > 0);
        if (pathParts.length >= 3 && pathParts[0] === 'token' && pathParts[1] === 'solana') {
          const tokenInfo = pathParts[2];
          if (tokenInfo.includes('_')) {
            return tokenInfo.split('_').pop();
          }
          return tokenInfo;
        }
      }

      // xxyy.io 网站: /sol/{token}
      if (url.hostname === 'www.xxyy.io' && url.pathname.startsWith('/sol/')) {
        const token = url.pathname.replace('/sol/', '').split('/')[0];
        return token || null;
      }

      // axiom.trade 网站: /meme/{token}
      if (url.hostname === 'axiom.trade' && url.pathname.startsWith('/meme/')) {
        const token = url.pathname.replace('/meme/', '').split('/')[0];
        return token || null;
      }

      // ave.ai 网站: /token/{token}-solana
      if (url.hostname === 'ave.ai' && url.pathname.startsWith('/token/')) {
        const tokenPart = url.pathname.replace('/token/', '').split('/')[0];
        // 移除 -solana 后缀
        const token = tokenPart.replace('-solana', '');
        return token || null;
      }

      // dbotx.com 网站: /token/solana/{token}
      if (url.hostname === 'dbotx.com' && url.pathname.startsWith('/token/solana/')) {
        const token = url.pathname.replace('/token/solana/', '').split('/')[0];
        return token || null;
      }

      // defined.fi 网站: /sol/{token}
      if (url.hostname === 'www.defined.fi' && url.pathname.startsWith('/sol/')) {
        const token = url.pathname.replace('/sol/', '').split('/')[0];
        return token || null;
      }

      return null;
    } catch (e) {
      console.error('[Jupiter Anywhere] URL 解析错误:', e);
      return null;
    }
  }

  /**
   * 验证 Solana 地址格式
   * @param {string|null|undefined} address - 要验证的地址
   * @returns {boolean} 是否为有效的 Solana 地址
   */
  function isValidSolanaAddress(address) {
    if (!address || typeof address !== 'string') return false;
    return SOLANA_ADDRESS_REGEX.test(address);
  }

  /**
   * 请求注入 Jupiter
   * @param {string|null} [tokenAddress] - 可选的 token 地址（如果不提供则从 URL 解析）
   */
  function requestJupiterInjection(tokenAddress = null) {
    const parsedToken = tokenAddress || parseTokenAddress();
    const validToken = parsedToken && isValidSolanaAddress(parsedToken) ? parsedToken : null;

    if (validToken) {
      console.log(`[Jupiter Anywhere] 检测到 token 地址: ${validToken}`);
    }

    // 发送消息给 background script
    chrome.runtime.sendMessage(
      { action: 'injectJupiter', tokenAddress: validToken },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('[Jupiter Anywhere] 通信错误:', chrome.runtime.lastError.message);
          return;
        }
        
        if (response?.success) {
          console.log('[Jupiter Anywhere] ✅ Jupiter 注入成功');
        } else {
          console.error('[Jupiter Anywhere] ❌ Jupiter 注入失败:', response?.error || '未知错误');
        }
      }
    );
  }

  /** 防抖后的注入函数 */
  const debouncedInjection = debounce(requestJupiterInjection, URL_CHANGE_DEBOUNCE_MS);

  /**
   * 监听页面 URL 变化（用于 SPA 网站）
   * 使用多种方法确保能捕获到 URL 变化
   */
  function watchUrlChanges() {
    let currentUrl = window.location.href;

    /**
     * 检查 URL 是否变化并触发注入
     */
    function checkUrlChange() {
      const newUrl = window.location.href;
      if (currentUrl !== newUrl) {
        currentUrl = newUrl;
        console.log('[Jupiter Anywhere] URL 变化检测:', newUrl);
        debouncedInjection();
      }
    }

    // 方法1: 监听 popstate 事件（浏览器前进/后退）
    window.addEventListener('popstate', checkUrlChange);

    // 方法2: 拦截 pushState 和 replaceState（SPA 路由变化）
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      setTimeout(checkUrlChange, 0);
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      setTimeout(checkUrlChange, 0);
    };

    // 方法3: 使用 MutationObserver 作为后备方案（监听 DOM 变化）
    // 注意：这可能会误触发，但作为最后的后备方案
    const observer = new MutationObserver(() => {
      checkUrlChange();
    });

    // 等待 body 存在后再开始观察
    if (document.body) {
      observer.observe(document.body, { 
        childList: true, 
        subtree: true 
      });
    } else {
      // 如果 body 还不存在，等待 DOMContentLoaded
      document.addEventListener('DOMContentLoaded', () => {
        if (document.body) {
          observer.observe(document.body, { 
            childList: true, 
            subtree: true 
          });
        }
      });
    }
  }

  /**
   * 初始化：页面加载完成后执行注入并开始监听 URL 变化
   */
  function initialize() {
    // 延迟注入，确保页面基本加载完成
    setTimeout(() => {
      requestJupiterInjection();
    }, INITIAL_INJECTION_DELAY_MS);

    // 开始监听 URL 变化
    watchUrlChanges();
  }

  // 页面加载完成后执行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    // 如果文档已经加载完成，直接执行
    initialize();
  }
})();
