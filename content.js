/**
 * Jupiter Anywhere - Content Script
 * 此脚本负责检测页面 URL 并请求 background script 注入 Jupiter
 */

(function() {
  'use strict';

  // 防止重复注入
  if (window.__jupiterAnywhereInjected) {
    return;
  }
  window.__jupiterAnywhereInjected = true;

  /**
   * 从 URL 中解析 token 地址
   */
  function parseTokenAddress() {
    try {
      const url = new URL(window.location.href);

      // GMGN 网站
      if (url.hostname === 'gmgn.ai' && url.pathname.startsWith('/sol/token/')) {
        const tokenPath = url.pathname.replace('/sol/token/', '');
        const fullTokenPart = tokenPath.split('/')[0];
        
        if (fullTokenPart.includes('_')) {
          return fullTokenPart.split('_').pop();
        }
        return fullTokenPart || null;
      }

      // debot.ai 网站
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

      return null;
    } catch (e) {
      console.error('[Jupiter Anywhere] URL 解析错误:', e);
      return null;
    }
  }

  /**
   * 验证 Solana 地址格式
   */
  function isValidSolanaAddress(address) {
    if (!address || typeof address !== 'string') return false;
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  }

  /**
   * 请求注入 Jupiter
   */
  function requestJupiterInjection() {
    const tokenAddress = parseTokenAddress();
    const validToken = tokenAddress && isValidSolanaAddress(tokenAddress) ? tokenAddress : null;

    // 发送消息给 background script
    chrome.runtime.sendMessage(
      { action: 'injectJupiter', tokenAddress: validToken },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('[Jupiter Anywhere] 通信错误:', chrome.runtime.lastError);
          return;
        }
        
        if (response?.success) {
          console.log('[Jupiter Anywhere] ✅ Jupiter 注入成功');
        } else {
          console.error('[Jupiter Anywhere] ❌ Jupiter 注入失败:', response?.error);
        }
      }
    );
  }

  /**
   * 监听页面 URL 变化（用于 SPA 网站）
   */
  function watchUrlChanges() {
    let currentUrl = window.location.href;
    
    const observer = new MutationObserver(() => {
      if (currentUrl !== window.location.href) {
        currentUrl = window.location.href;
        // URL 变化时重新注入
        setTimeout(requestJupiterInjection, 500);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // 页面加载完成后执行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(requestJupiterInjection, 500);
      watchUrlChanges();
    });
  } else {
    setTimeout(requestJupiterInjection, 500);
    watchUrlChanges();
  }
})();
