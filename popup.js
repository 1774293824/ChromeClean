document.addEventListener("DOMContentLoaded", () => {
  const timeRangeSelect = document.getElementById("timeRange");
  const clearBtn = document.getElementById("clearBtn");
  const settingsBtn = document.getElementById("settingsBtn");

  // 初始化时间范围
  chrome.storage.local.get(["timeRange"], (result) => {
    if (result.timeRange) {
      timeRangeSelect.value = result.timeRange;
    }
  });

  // popup 改时间 → 存储
  timeRangeSelect.addEventListener("change", () => {
    chrome.storage.local.set({ timeRange: timeRangeSelect.value });
  });

  // 监听 storage 变化（options 修改时也能同步 UI）
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.timeRange) {
      timeRangeSelect.value = changes.timeRange.newValue;
    }
  });

  // 一键清理
  clearBtn.addEventListener("click", () => {
    if (clearBtn.disabled) return;

    const timeValue = timeRangeSelect.value;
    chrome.storage.local.set({ timeRange: timeValue });

    let since = 0;
    if (timeValue !== "all") {
      const days = parseInt(timeValue, 10);
      since = Date.now() - days * 24 * 60 * 60 * 1000;
    }

    clearBtn.disabled = true;
    clearBtn.innerHTML = `<div class="spinner"></div> 清理中...`;

    chrome.storage.local.get(["dataItems"], (result) => {
      // 🔒 数据项过滤
      const validKeys = [
        "appcache", "cache", "cookies", "downloads", "fileSystems",
        "formData", "history", "indexedDB", "localStorage",
        "passwords", "serviceWorkers", "webSQL"
      ];
      const items = {};
      const source = result.dataItems || { cache: true, downloads: true, history: true };
      for (const k in source) {
        if (validKeys.includes(k) && source[k]) {
          items[k] = true;
        }
      }

      chrome.browsingData.remove({ since }, items, () => {
        setTimeout(() => {
          clearBtn.innerHTML = `<div class="checkmark"></div> 清理完成`;
          setTimeout(() => {
            clearBtn.innerHTML = "一键清理";
            clearBtn.disabled = false;
          }, 1500);
        }, 2000);
      });
    });
  });

  // 打开设置
  settingsBtn.addEventListener("click", () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL("options.html"));
    }
  });
});
