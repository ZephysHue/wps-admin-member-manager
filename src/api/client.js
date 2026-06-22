(function () {
  const { isNotLoginMessage, normalizeErrorMessage } = globalThis.KdocsHelperFormat;

  async function requestJson(url, options, callbacks = {}) {
    const response = await fetch(url, {
      credentials: "include",
      ...options
    });
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (_error) {
      data = null;
    }

    const rawMessage = data?.message || data?.msg || data?.error || text || "";
    if (!response.ok) {
      if (isNotLoginMessage(rawMessage)) {
        callbacks.onLoggedOut?.();
      }
      const error = new Error(normalizeErrorMessage(rawMessage || `HTTP ${response.status}`));
      error.status = response.status;
      error.rawMessage = rawMessage;
      throw error;
    }

    if (isNotLoginMessage(rawMessage)) {
      callbacks.onLoggedOut?.();
      throw new Error("企业未登录");
    }

    return data;
  }

  globalThis.KdocsHelperApiClient = {
    requestJson
  };
})();
