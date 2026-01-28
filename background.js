/**
 * Jupiter Anywhere - Background Service Worker
 * 负责下载 Jupiter 脚本并通过 chrome.scripting API 注入到页面
 * 这种方式可以绕过页面的 CSP 限制
 */

const JUPITER_SCRIPT_URL = 'https://plugin.jup.ag/plugin-v1.js';

/**
 * 下载并缓存 Jupiter 脚本
 */
async function downloadJupiterScript() {
  try {
    const response = await fetch(JUPITER_SCRIPT_URL);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    const scriptContent = await response.text();

    // 缓存脚本内容
    await chrome.storage.local.set({
      jupiterScript: scriptContent,
      jupiterScriptTimestamp: Date.now()
    });
    
    return scriptContent;
  } catch (error) {
    console.error('[Jupiter Anywhere] 脚本下载失败:', error);
    return null;
  }
}

/**
 * 获取 Jupiter 脚本（优先使用缓存）
 */
async function getJupiterScript() {
  const result = await chrome.storage.local.get(['jupiterScript', 'jupiterScriptTimestamp']);
  
  // 如果缓存存在且不超过1小时，使用缓存
  if (result.jupiterScript && result.jupiterScriptTimestamp) {
    const age = Date.now() - result.jupiterScriptTimestamp;
    if (age < 3600000) { // 1小时
      return result.jupiterScript;
    }
  }
  
  // 下载新脚本
  return await downloadJupiterScript();
}

/**
 * 注入 Jupiter 脚本到页面
 */
async function injectJupiterScript(tabId) {
  try {
    const jupiterScript = await getJupiterScript();
    
    if (!jupiterScript) {
      throw new Error('无法获取 Jupiter 脚本');
    }

    // 使用 chrome.scripting.executeScript 在 MAIN world 中直接执行脚本
    // 关键：直接用 Function 构造函数执行，绕过 CSP 对 script 标签的限制
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      world: 'MAIN',
      func: (scriptContent) => {
        try {
          const executeScript = new Function(scriptContent);
          executeScript();
          return { success: true, jupiterExists: typeof window.Jupiter !== 'undefined' };
        } catch (e) {
          console.error('[Jupiter Anywhere] 脚本执行错误:', e);
          return { success: false, error: e.message };
        }
      },
      args: [jupiterScript]
    });

    return { success: true };
  } catch (error) {
    console.error('[Jupiter Anywhere] 脚本注入失败:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 注入 Jupiter 初始化代码
 */
async function injectJupiterInit(tabId, tokenAddress) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      world: 'MAIN',
      func: (outputMint) => {
        // Jupiter 初始化配置
        const config = {
          displayMode: 'widget',
          widgetStyle: {
            position: 'bottom-left',
          },
          formProps: {
            initialAmount: '100000000',
            initialInputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          },
        };

        // 如果有 token 地址，设置为输出 token
        if (outputMint) {
          config.formProps.swapMode = 'ExactIn';
          config.formProps.initialOutputMint = outputMint;
        }

        const jupiterExists = typeof window.Jupiter !== 'undefined';
        const hasInit = jupiterExists && typeof window.Jupiter.init === 'function';
        
        if (!hasInit) {
          return { success: false, error: 'Jupiter.init not available', jupiterExists, hasInit };
        }
        
        try {
          window.Jupiter.init(config);
          console.log('[Jupiter Anywhere] ✅ Jupiter.init() 已调用');
          
          // 修改容器样式（延迟执行）
          setTimeout(() => {
            const container = document.getElementById('jupiter-plugin-instance');
            if (container) {
              container.style.cssText += 'position: fixed !important; z-index: 2147483647 !important; display: block !important; visibility: visible !important; opacity: 1 !important;';
              console.log('[Jupiter Anywhere] 容器样式已更新');
            }
          }, 2000);
          
          return { success: true, initCalled: true };
        } catch (e) {
          console.error('[Jupiter Anywhere] 初始化失败:', e);
          return { success: false, error: e.message };
        }
      },
      args: [tokenAddress]
    });

    return { success: true };
  } catch (error) {
    console.error('[Jupiter Anywhere] 初始化代码注入失败:', error);
    return { success: false, error: error.message };
  }
}

// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'injectJupiter') {
    const tabId = sender.tab?.id;
    
    if (!tabId) {
      sendResponse({ success: false, error: 'No tab ID' });
      return;
    }

    // 先注入 Jupiter 脚本，再注入初始化代码
    (async () => {
      const scriptResult = await injectJupiterScript(tabId);
      if (!scriptResult.success) {
        sendResponse(scriptResult);
        return;
      }

      // 等待一小段时间让脚本执行
      await new Promise(r => setTimeout(r, 500));

      const initResult = await injectJupiterInit(tabId, message.tokenAddress);
      sendResponse(initResult);
    })();

    return true; // 保持消息通道开放以便异步响应
  }
});

// 扩展安装时预下载脚本
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Jupiter Anywhere] 扩展已安装，正在预下载 Jupiter 脚本...');
  downloadJupiterScript();
});
