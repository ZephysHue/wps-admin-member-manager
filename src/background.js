const COOKIE_CANDIDATES = ["csrf", "csrfmiddlewaretoken"];
const COMPANY_ID_NAME_HINTS = [
  "cid",
  "company_id",
  "companyid",
  "comp_id",
  "compid",
  "corp_id",
  "org_id"
];
const DEPT_ID_NAME_HINTS = ["dept_id", "department_id", "default_dept_id", "cur_dept_id", "selected_dept_id"];
const COOKIE_DOMAIN_HINTS = ["kdocs.cn", "wps.cn"];

function isSupportedDomain(domain) {
  const normalized = String(domain || "").toLowerCase();
  return COOKIE_DOMAIN_HINTS.some((hint) => normalized.includes(hint));
}

function getCookieValue({ url, name }) {
  return new Promise((resolve) => {
    chrome.cookies.get({ url, name }, (cookie) => {
      if (chrome.runtime.lastError) {
        resolve(null);
        return;
      }
      resolve(cookie?.value ?? null);
    });
  });
}

function buildCsrfUrls(origin) {
  const urls = [];
  if (origin) {
    urls.push(origin.endsWith("/") ? origin : `${origin}/`);
  }
  urls.push("https://365.kdocs.cn/");
  urls.push("https://kdocs.cn/");
  urls.push("https://wps.cn/");
  return [...new Set(urls)];
}

async function readCsrfFromCookies(origin) {
  const urls = buildCsrfUrls(origin);
  for (const url of urls) {
    for (const name of COOKIE_CANDIDATES) {
      const value = await getCookieValue({ url, name });
      if (value) {
        return value;
      }
    }
  }
  return null;
}

function getAllCookies() {
  return new Promise((resolve) => {
    chrome.cookies.getAll({}, (cookies) => {
      if (chrome.runtime.lastError) {
        resolve([]);
        return;
      }
      resolve(Array.isArray(cookies) ? cookies : []);
    });
  });
}

function extractCompanyIds(text) {
  if (!text) return [];
  const matches = String(text).match(/\b6\d{8}\b/g);
  return matches || [];
}

function extractDeptIds(text) {
  if (!text) return [];
  const matches = String(text).match(/\b\d{15,22}\b/g);
  return matches || [];
}

function pickCompanyIdFromCookies(cookies) {
  const scopedCookies = cookies.filter((cookie) => isSupportedDomain(cookie?.domain));
  if (scopedCookies.length === 0) return null;

  for (const nameHint of COMPANY_ID_NAME_HINTS) {
    const target = scopedCookies.find((cookie) => String(cookie?.name || "").toLowerCase() === nameHint);
    if (!target) continue;
    const ids = extractCompanyIds(target.value);
    if (ids.length > 0) {
      return ids[0];
    }
  }

  for (const cookie of scopedCookies) {
    const ids = extractCompanyIds(cookie.value);
    if (ids.length > 0) {
      return ids[0];
    }
  }
  return null;
}

async function readCompanyIdFromCookies() {
  const cookies = await getAllCookies();
  return pickCompanyIdFromCookies(cookies);
}

function pickDeptIdFromCookies(cookies) {
  const scopedCookies = cookies.filter((cookie) => isSupportedDomain(cookie?.domain));
  if (scopedCookies.length === 0) return null;

  for (const nameHint of DEPT_ID_NAME_HINTS) {
    const target = scopedCookies.find((cookie) => String(cookie?.name || "").toLowerCase() === nameHint);
    if (!target) continue;
    const ids = extractDeptIds(target.value);
    if (ids.length > 0) {
      return ids[0];
    }
  }

  for (const cookie of scopedCookies) {
    const cookieName = String(cookie?.name || "").toLowerCase();
    if (!cookieName.includes("dept")) continue;
    const ids = extractDeptIds(cookie.value);
    if (ids.length > 0) {
      return ids[0];
    }
  }
  return null;
}

async function readDeptIdFromCookies() {
  const cookies = await getAllCookies();
  return pickDeptIdFromCookies(cookies);
}

async function readRuntimeContext(origin) {
  const [csrfToken, companyId, deptId] = await Promise.all([
    readCsrfFromCookies(origin),
    readCompanyIdFromCookies(),
    readDeptIdFromCookies()
  ]);
  return { csrfToken, companyId, deptId };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "GET_CSRF_TOKEN" && message?.type !== "GET_RUNTIME_CONTEXT") {
    return false;
  }

  let originFromSender = null;
  try {
    originFromSender = sender?.url ? new URL(sender.url).origin : null;
  } catch (_error) {
    originFromSender = null;
  }
  const origin = message?.origin || originFromSender;

  readRuntimeContext(origin)
    .then(({ csrfToken, companyId, deptId }) => {
      if (message?.type === "GET_CSRF_TOKEN") {
        sendResponse({ ok: true, csrfToken });
        return;
      }
      sendResponse({ ok: true, csrfToken, companyId, deptId });
    })
    .catch((error) => {
      sendResponse({
        ok: false,
        error: error?.message || "读取 CSRF 失败"
      });
    });

  return true;
});
