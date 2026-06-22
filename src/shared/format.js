(function () {
  function isNotLoginMessage(message) {
    const text = String(message || "").toLowerCase();
    return text.includes("usernotlogin") || text.includes("not login");
  }

  function normalizeErrorMessage(message) {
    if (isNotLoginMessage(message)) {
      return "企业未登录";
    }
    return String(message || "未知错误");
  }

  function normalizePhone(input) {
    const raw = String(input || "").trim();
    if (!raw) return "";
    const cleaned = raw.replace(/[\s-]/g, "");
    if (!/^\+?\d+$/.test(cleaned)) return "";

    const number = cleaned;
    if (number.startsWith("+86")) {
      const local = number.slice(3);
      if (!/^\d{11}$/.test(local)) return "";
      return `+86${local}`;
    }
    if (number.startsWith("86") && /^\d{13}$/.test(number)) {
      return `+${number}`;
    }
    if (/^\d{11}$/.test(number)) {
      return `+86${number}`;
    }
    return "";
  }

  function formatPhoneForDisplay(phone) {
    const normalized = String(phone || "").trim();
    return normalized.replace(/^\+?86/, "");
  }

  function formatStatus(status) {
    if (status === "active") return "已激活";
    if (status === "notactive") return "未激活";
    if (status === "disabled") return "已停用";
    return status || "未知";
  }

  globalThis.KdocsHelperFormat = {
    isNotLoginMessage,
    normalizeErrorMessage,
    normalizePhone,
    formatPhoneForDisplay,
    formatStatus
  };
})();
