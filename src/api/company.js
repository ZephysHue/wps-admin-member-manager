(function () {
  const { PLUSSVR_API_ORIGIN } = globalThis.KdocsHelperConstants;

  function createCompanyApi({ getApiOrigin, requestJson, accessScopePermission }) {
    function isAccountWpsCn(origin) {
      try {
        const host = new URL(origin).hostname.toLowerCase();
        return host === "account.wps.cn";
      } catch (_) {
        return false;
      }
    }

    function buildAccessScopeUrls(companyId, params) {
      const query = params.toString();
      const currentOrigin = getApiOrigin();
      const plussvrUrl = `${PLUSSVR_API_ORIGIN}/plusadmin/v2/companies/${companyId}/users/self/access_scope?${query}`;

      if (isAccountWpsCn(currentOrigin)) {
        // account.wps.cn 下与 kdocs 一致，直接走 plussvr.wps.cn 直连，
        // CID 由 background.js 从 account.wps.cn 域的 cid cookie 读取后传入。
        return [plussvrUrl];
      }

      return [
        plussvrUrl,
        `${currentOrigin}/3rd/plussvr/plusadmin/v2/companies/${companyId}/users/self/access_scope?${query}`
      ].filter((url, index, urls) => urls.indexOf(url) === index);
    }

    async function fetchAccessScopeDeptId(companyId) {
      const params = new URLSearchParams();
      params.set("permissions", accessScopePermission);
      params.set("_t", String(Date.now()));
      const urls = buildAccessScopeUrls(companyId, params);
      let lastError = null;
      let hasSuccessfulResponse = false;

      for (const url of urls) {
        try {
          const data = await requestJson(url, { method: "GET" });
          hasSuccessfulResponse = true;
          const deptId = pickDeptIdFromAccessScope(data);
          if (deptId) {
            return deptId;
          }
        } catch (error) {
          lastError = error;
        }
      }

      if (hasSuccessfulResponse) {
        return null;
      }
      if (lastError) {
        throw lastError;
      }
      return null;
    }

    function pickDeptIdFromAccessScope(data) {
      const scopes = Array.isArray(data?.scope) ? data.scope : [];
      for (const scope of scopes) {
        const accessDepts = Array.isArray(scope?.access_depts) ? scope.access_depts : [];
        for (const dept of accessDepts) {
          const idPath = String(dept?.id_path || dept?.id || "").trim();
          if (idPath) {
            return idPath;
          }
        }
      }
      return null;
    }

    return {
      fetchAccessScopeDeptId
    };
  }

  globalThis.KdocsHelperCompanyApi = {
    createCompanyApi
  };
})();
