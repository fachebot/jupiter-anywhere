/**
 * Jupiter Anywhere - Background Service Worker
 * 负责下载 Jupiter 脚本并通过 chrome.scripting API 注入到页面
 * 这种方式可以绕过页面的 CSP 限制
 */

// ==================== 常量配置 ====================

/** Jupiter 脚本 URL */
const JUPITER_SCRIPT_URL = 'https://jupiter-plugin-plus.pages.dev/plugin-v1.js';

/** 缓存有效期（毫秒）- 1小时 */
const CACHE_TTL_MS = 3600000;

/** 脚本执行等待时间（毫秒） */
const SCRIPT_EXECUTION_DELAY_MS = 500;

/** 容器样式应用延迟（毫秒）- 等待 Jupiter 初始化 */
const CONTAINER_STYLE_DELAY_MS = 2000;

/** 交互元素启用延迟（毫秒）- 等待 Jupiter 完全渲染 */
const INTERACTIVE_ELEMENTS_DELAY_MS = 1000;

/** 容器重试间隔（毫秒） */
const CONTAINER_RETRY_INTERVAL_MS = 500;

/** 容器最大重试次数 */
const CONTAINER_MAX_RETRIES = 10;

/** Jupiter 容器 ID */
const CONTAINER_ID = 'jupiter-plugin-instance';

/** Jupiter 配置 */
const JUPITER_CONFIG = {
  displayMode: 'widget',
  widgetStyle: {
    position: 'bottom-left',
  },
  formProps: {
    initialAmount: '100000000',
    initialInputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  },
  containerClassName: CONTAINER_ID,
};

/** 容器基础样式 */
const CONTAINER_BASE_STYLES = [
  'position: fixed !important',
  'z-index: 2147483647 !important',
  'display: block !important',
  'visibility: visible !important',
  'opacity: 1 !important',
  'pointer-events: none !important',
  'max-width: 100vw !important',
  'max-height: 100vh !important',
].join('; ');

/** 交互元素选择器 */
const INTERACTIVE_SELECTORS = [
  'button',
  'input',
  'select',
  'textarea',
  'a',
  '[role="button"]',
  '[role="link"]',
  '[tabindex]',
  '[onclick]',
  '.jupiter-widget',
  '[class*="widget"]',
  '[class*="form"]',
  '[class*="swap"]',
  '[class*="button"]',
  '[class*="input"]',
];

// ==================== 工具函数 ====================

/**
 * 下载并缓存 Jupiter 脚本
 * @param {number} retries - 重试次数（默认3次）
 * @returns {Promise<string|null>} 脚本内容或 null
 */
async function downloadJupiterScript(retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(JUPITER_SCRIPT_URL);

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }
      
      const scriptContent = await response.text();

      if (!scriptContent || scriptContent.length === 0) {
        throw new Error('下载的脚本内容为空');
      }

      // 缓存脚本内容
      await chrome.storage.local.set({
        jupiterScript: scriptContent,
        jupiterScriptTimestamp: Date.now()
      });
      
      console.log(`[Jupiter Anywhere] ✅ 脚本下载成功 (尝试 ${attempt}/${retries})`);
      return scriptContent;
    } catch (error) {
      const isLastAttempt = attempt === retries;
      console.error(
        `[Jupiter Anywhere] 脚本下载失败 (尝试 ${attempt}/${retries}):`,
        error.message || error
      );
      
      if (isLastAttempt) {
        return null;
      }
      
      // 等待后重试（指数退避）
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  return null;
}

/**
 * 获取 Jupiter 脚本（优先使用缓存）
 * @returns {Promise<string|null>} 脚本内容或 null
 */
async function getJupiterScript() {
  const result = await chrome.storage.local.get(['jupiterScript', 'jupiterScriptTimestamp']);
  
  // 如果缓存存在且未过期，使用缓存
  if (result.jupiterScript && result.jupiterScriptTimestamp) {
    const age = Date.now() - result.jupiterScriptTimestamp;
    if (age < CACHE_TTL_MS) {
      return result.jupiterScript;
    }
  }
  
  // 下载新脚本
  return await downloadJupiterScript();
}

/**
 * 注入 Jupiter 脚本到页面
 * @param {number} tabId - 标签页 ID
 * @returns {Promise<{success: boolean, error?: string}>} 注入结果
 */
async function injectJupiterScript(tabId) {
  try {
    const jupiterScript = await getJupiterScript();
    
    if (!jupiterScript) {
      throw new Error('无法获取 Jupiter 脚本（下载失败或缓存过期）');
    }

    // 使用 chrome.scripting.executeScript 在 MAIN world 中直接执行脚本
    // 关键：直接用 Function 构造函数执行，绕过 CSP 对 script 标签的限制
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      world: 'MAIN',
      func: (scriptContent) => {
        try {
          const executeScript = new Function(scriptContent);
          executeScript();
          const jupiterExists = typeof window.Jupiter !== 'undefined';
          return { 
            success: true, 
            jupiterExists,
            jupiterInitAvailable: jupiterExists && typeof window.Jupiter.init === 'function'
          };
        } catch (e) {
          console.error('[Jupiter Anywhere] 脚本执行错误:', e);
          return { success: false, error: e.message, stack: e.stack };
        }
      },
      args: [jupiterScript]
    });

    const result = results[0]?.result;
    if (!result || !result.success) {
      throw new Error(result?.error || '脚本执行返回失败');
    }

    if (!result.jupiterExists) {
      console.warn('[Jupiter Anywhere] ⚠️ 脚本已执行，但 window.Jupiter 未定义');
    }

    return { success: true, jupiterExists: result.jupiterExists };
  } catch (error) {
    const errorMessage = error.message || '未知错误';
    console.error('[Jupiter Anywhere] 脚本注入失败:', errorMessage, error);
    return { success: false, error: errorMessage };
  }
}

/**
 * 等待容器元素出现（带重试机制）
 * 注意：此函数在 service worker 中定义但不会被调用。
 * 实际的容器等待逻辑已内联到注入的脚本中（见 injectJupiterInit）。
 * 保留此函数仅作为文档说明。
 * @param {string} containerId - 容器元素 ID
 * @param {number} maxRetries - 最大重试次数
 * @param {number} retryInterval - 重试间隔（毫秒）
 * @returns {Promise<HTMLElement|null>} 容器元素或 null
 */
function waitForContainer(containerId, maxRetries, retryInterval) {
  return new Promise((resolve) => {
    let retries = 0;
    
    const checkContainer = () => {
      const container = document.getElementById(containerId);
      if (container) {
        resolve(container);
        return;
      }
      
      retries++;
      if (retries >= maxRetries) {
        console.warn(`[Jupiter Anywhere] 容器 ${containerId} 未找到，已重试 ${retries} 次`);
        resolve(null);
        return;
      }
      
      setTimeout(checkContainer, retryInterval);
    };
    
    checkContainer();
  });
}

/**
 * 应用容器样式
 * 注意：此函数在 service worker 中定义但不会被调用。
 * 实际的样式应用逻辑已内联到注入的脚本中（见 injectJupiterInit）。
 * 保留此函数仅作为文档说明。
 * @param {HTMLElement} container - 容器元素
 */
function applyContainerStyles(container) {
  container.style.cssText += CONTAINER_BASE_STYLES;
  console.log('[Jupiter Anywhere] 容器样式已更新');
}

/**
 * 启用容器内的交互元素
 * 注意：此函数在 service worker 中定义但不会被调用。
 * 实际的交互元素启用逻辑已内联到注入的脚本中（见 injectJupiterInit）。
 * 保留此函数仅作为文档说明。
 * @param {HTMLElement} container - 容器元素
 */
function enableInteractiveElements(container) {
  // 查找容器内所有可交互元素并启用点击
  INTERACTIVE_SELECTORS.forEach(selector => {
    try {
      const elements = container.querySelectorAll(selector);
      elements.forEach(el => {
        el.style.pointerEvents = 'auto';
      });
    } catch (e) {
      // 忽略无效选择器
    }
  });
  
  // 如果容器本身有直接的交互内容，也启用点击
  const containerChildren = Array.from(container.children);
  containerChildren.forEach(child => {
    child.style.pointerEvents = 'auto';
  });
  
  console.log('[Jupiter Anywhere] 交互元素点击已启用');
}

/**
 * 初始化并配置 Jupiter 容器样式
 * 注意：此函数在 service worker 中定义但不会被调用。
 * 实际的初始化逻辑已内联到注入的脚本中（见 injectJupiterInit）。
 * 保留此函数仅作为文档说明。
 * @param {string} containerId - 容器 ID
 * @param {number} styleDelay - 样式应用延迟（毫秒）
 * @param {number} interactiveDelay - 交互元素启用延迟（毫秒）
 */
function initializeContainerStyles(containerId, styleDelay, interactiveDelay) {
  setTimeout(async () => {
    const container = await waitForContainer(
      containerId,
      CONTAINER_MAX_RETRIES,
      CONTAINER_RETRY_INTERVAL_MS
    );
    
    if (!container) {
      console.warn('[Jupiter Anywhere] 无法找到容器，跳过样式设置');
      return;
    }
    
    applyContainerStyles(container);
    
    // 延迟设置内部交互元素可点击（等待 Jupiter 完全渲染）
    setTimeout(() => {
      enableInteractiveElements(container);
    }, interactiveDelay);
  }, styleDelay);
}

/**
 * 注入 Jupiter 初始化代码
 * @param {number} tabId - 标签页 ID
 * @param {string|null} tokenAddress - Token 地址（可选）
 * @returns {Promise<{success: boolean, error?: string}>} 注入结果
 */
async function injectJupiterInit(tabId, tokenAddress) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      world: 'MAIN',
      func: (outputMint, containerId, containerStyleDelay, interactiveDelay, baseStyles, interactiveSelectors, maxRetries, retryInterval) => {
        // 复制配置对象
        const config = JSON.parse(JSON.stringify({
          displayMode: 'widget',
          widgetStyle: {
            position: 'bottom-left',
          },
          formProps: {
            initialAmount: '100000000',
            initialInputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          },
          containerClassName: containerId,
        }));

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
          
          // 等待容器元素出现并应用样式
          (function waitForContainer(containerId, maxRetries, retryInterval) {
            let retries = 0;
            
            const checkContainer = () => {
              const container = document.getElementById(containerId);
              if (container) {
                // 应用容器样式
                container.style.cssText += baseStyles;
                console.log('[Jupiter Anywhere] 容器样式已更新');
                
                // 延迟设置内部交互元素可点击
                setTimeout(() => {
                  // 查找容器内所有可交互元素并启用点击
                  interactiveSelectors.forEach(selector => {
                    try {
                      const elements = container.querySelectorAll(selector);
                      elements.forEach(el => {
                        el.style.pointerEvents = 'auto';
                      });
                    } catch (e) {
                      // 忽略无效选择器
                    }
                  });
                  
                  // 如果容器本身有直接的交互内容，也启用点击
                  const containerChildren = Array.from(container.children);
                  containerChildren.forEach(child => {
                    child.style.pointerEvents = 'auto';
                  });
                  
                  console.log('[Jupiter Anywhere] 交互元素点击已启用');
                }, interactiveDelay);
                
                return;
              }
              
              retries++;
              if (retries >= maxRetries) {
                console.warn(`[Jupiter Anywhere] 容器 ${containerId} 未找到，已重试 ${retries} 次`);
                return;
              }
              
              setTimeout(checkContainer, retryInterval);
            };
            
            setTimeout(checkContainer, containerStyleDelay);
          })(containerId, maxRetries, retryInterval);
          
          return { success: true, initCalled: true };
        } catch (e) {
          console.error('[Jupiter Anywhere] 初始化失败:', e);
          return { success: false, error: e.message };
        }
      },
      args: [
        tokenAddress,
        CONTAINER_ID,
        CONTAINER_STYLE_DELAY_MS,
        INTERACTIVE_ELEMENTS_DELAY_MS,
        CONTAINER_BASE_STYLES,
        INTERACTIVE_SELECTORS,
        CONTAINER_MAX_RETRIES,
        CONTAINER_RETRY_INTERVAL_MS
      ]
    });

    return { success: true };
  } catch (error) {
    console.error('[Jupiter Anywhere] 初始化代码注入失败:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 处理来自 content script 的消息
 * @param {Object} message - 消息对象
 * @param {string} message.action - 操作类型
 * @param {string|null} message.tokenAddress - Token 地址（可选）
 * @param {chrome.runtime.MessageSender} sender - 消息发送者
 * @param {Function} sendResponse - 响应函数
 * @returns {boolean} 是否保持消息通道开放
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'injectJupiter') {
    const tabId = sender.tab?.id;
    
    if (!tabId) {
      console.error('[Jupiter Anywhere] 收到注入请求，但缺少 tabId');
      sendResponse({ success: false, error: '缺少标签页 ID' });
      return false;
    }

    // 先注入 Jupiter 脚本，再注入初始化代码
    (async () => {
      try {
        const scriptResult = await injectJupiterScript(tabId);
        if (!scriptResult.success) {
          sendResponse(scriptResult);
          return;
        }

        // 等待一小段时间让脚本执行
        await new Promise(r => setTimeout(r, SCRIPT_EXECUTION_DELAY_MS));

        const initResult = await injectJupiterInit(tabId, message.tokenAddress);
        sendResponse(initResult);
      } catch (error) {
        console.error('[Jupiter Anywhere] 注入流程异常:', error);
        sendResponse({ 
          success: false, 
          error: `注入流程异常: ${error.message || error}` 
        });
      }
    })();

    return true; // 保持消息通道开放以便异步响应
  }
  
  return false;
});

/**
 * 扩展安装/更新时预下载脚本
 */
chrome.runtime.onInstalled.addListener((details) => {
  const reason = details.reason;
  console.log(`[Jupiter Anywhere] 扩展已${reason === 'install' ? '安装' : '更新'}，正在预下载 Jupiter 脚本...`);
  
  downloadJupiterScript().catch(error => {
    console.error('[Jupiter Anywhere] 预下载脚本失败:', error);
  });
});
