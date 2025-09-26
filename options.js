document.addEventListener("DOMContentLoaded", () => {
  const timeRangeSelect = document.getElementById("timeRange");
  const checkboxes = document.querySelectorAll("#checkboxes input[type=checkbox]");
  const clearBtn = document.getElementById("clearBtn");

  // 载入保存的设置
  chrome.storage.local.get(["timeRange", "dataItems"], (result) => {
    if (result.timeRange) {
      timeRangeSelect.value = result.timeRange;
    }
    if (result.dataItems) {
      checkboxes.forEach(cb => {
        cb.checked = !!result.dataItems[cb.value];
      });
    }
  });

  let saveTimeout;
  function saveSettings() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      const selectedItems = {};
      checkboxes.forEach(cb => {
        if (cb.checked) selectedItems[cb.value] = true;
      });
      chrome.storage.local.set({
        timeRange: timeRangeSelect.value,
        dataItems: selectedItems
      });
    }, 200);
  }

  timeRangeSelect.addEventListener("change", saveSettings);
  checkboxes.forEach(cb => cb.addEventListener("change", saveSettings));

  document.getElementById("selectAll").addEventListener("click", () => {
    checkboxes.forEach(cb => cb.checked = true);
    saveSettings();
  });
  document.getElementById("selectNone").addEventListener("click", () => {
    checkboxes.forEach(cb => cb.checked = false);
    saveSettings();
  });
  document.getElementById("selectRecommended").addEventListener("click", () => {
    checkboxes.forEach(cb => {
      cb.checked = ["cache", "downloads", "history"].includes(cb.value);
    });
    saveSettings();
  });

  // 一键清理功能
  clearBtn.addEventListener("click", () => {
    if (clearBtn.classList.contains("loading")) return;

    clearBtn.classList.add("loading");
    clearBtn.disabled = true;

    chrome.storage.local.get(["timeRange", "dataItems"], (result) => {
      const millisecondsPerDay = 1000 * 60 * 60 * 24;
      let since = 0;
      if (result.timeRange && result.timeRange !== "all") {
        since = Date.now() - millisecondsPerDay * parseInt(result.timeRange, 10);
      }
      const options = { since };

      // 🔒 数据项过滤
      const validKeys = [
        "appcache", "cache", "cookies", "downloads", "fileSystems",
        "formData", "history", "indexedDB", "localStorage",
        "passwords", "serviceWorkers", "webSQL"
      ];
      const dataToRemove = {};
      for (const k in (result.dataItems || {})) {
        if (validKeys.includes(k) && result.dataItems[k]) {
          dataToRemove[k] = true;
        }
      }

      chrome.browsingData.remove(options, dataToRemove, () => {
        setTimeout(() => {
          clearBtn.classList.remove("loading");
          clearBtn.disabled = false;
          clearBtn.textContent = "✔️ 完成";
          setTimeout(() => {
            clearBtn.textContent = "🧹 一键清理";
          }, 1500);
        }, 2000);
      });
    });
  });
});
