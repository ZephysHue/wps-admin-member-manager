(function () {
  const { PLUSSVR_API_ORIGIN } = globalThis.KdocsHelperConstants;

  function createMembersApi({ getApiOrigin, getCompanyId, getDeptId, getCsrfToken, requestJson, formatPhoneForDisplay }) {
    function buildSvrUrls(pathWithQuery) {
      const currentOrigin = getApiOrigin();
      return [
        `${PLUSSVR_API_ORIGIN}${pathWithQuery}`,
        `${currentOrigin}/3rd/plussvr${pathWithQuery}`
      ].filter((url, index, urls) => urls.indexOf(url) === index);
    }

    function isRouteNotFoundError(error) {
      return error?.status === 404 && String(error?.rawMessage || error?.message || "").includes("no Route matched");
    }

    async function requestWithRouteFallback(pathWithQuery, options) {
      const urls = buildSvrUrls(pathWithQuery);
      let lastError = null;
      for (const url of urls) {
        try {
          return await requestJson(url, options);
        } catch (error) {
          lastError = error;
          if (!isRouteNotFoundError(error)) {
            throw error;
          }
        }
      }
      throw lastError;
    }

    async function fetchUsersBatch(offset, limit) {
      const companyId = await getCompanyId();
      const deptId = await getDeptId({ required: true });
      const params = new URLSearchParams();
      params.set("with_total", "true");
      params.append("dept_fields", "name");
      params.append("dept_fields", "abs_path");
      params.append("dept_fields", "id");
      params.set("next_comp_uid", "0");
      params.set("with_custom_fields", "true");
      params.set("recursive", "true");
      params.append("status", "active");
      params.append("status", "notactive");
      params.append("status", "disabled");
      params.set("offset", String(offset));
      params.set("limit", String(limit));
      params.set("need_entitlements", "true");
      params.set("entitlements_pattern", "0");
      params.set("_t", String(Date.now()));

      const path = `/svr/v1/adm/companies/${companyId}/depts/${deptId}/users?${params.toString()}`;
      const data = await requestWithRouteFallback(path, { method: "GET" });

      return {
        users: Array.isArray(data?.users) ? data.users : [],
        total: Number(data?.total || 0)
      };
    }

    async function fetchAllUsers() {
      const limit = 200;
      let offset = 0;
      let total = 0;
      const allUsers = [];

      do {
        const batch = await fetchUsersBatch(offset, limit);
        total = batch.total;
        allUsers.push(...batch.users);
        offset += limit;
        if (batch.users.length === 0) break;
      } while (allUsers.length < total);

      return allUsers;
    }

    async function addMember({ name, phone }) {
      const companyId = await getCompanyId();
      const csrfToken = await getCsrfToken();
      const deptId = await getDeptId({ required: true, forceRefresh: true });
      const submitPhone = formatPhoneForDisplay(phone);
      if (!/^\d{11}$/.test(submitPhone)) {
        throw new Error("手机号格式不合法");
      }
      const body = {
        phone: submitPhone,
        country_code: "+86",
        highlight_id: 1,
        name,
        name_langs: [],
        dept_ids: [deptId],
        role_id: 3,
        custom_fields: [],
        need_send: false,
        csrfmiddlewaretoken: csrfToken
      };

      const path = `/svr/v2/adm/companies/${companyId}/users`;
      return requestWithRouteFallback(path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
    }

    async function deleteMembers(compUids) {
      const result = { success: [], failed: [] };
      if (!Array.isArray(compUids) || compUids.length === 0) return result;

      for (const compUid of compUids) {
        try {
          await deleteSingleMember(compUid);
          result.success.push(compUid);
        } catch (error) {
          result.failed.push({
            comp_uid: compUid,
            error: error.message || "未知错误"
          });
        }
      }
      return result;
    }

    async function deleteSingleMember(compUid) {
      const companyId = await getCompanyId();
      const csrfToken = await getCsrfToken();
      const body = {
        comp_uids: [compUid],
        comp_uid: compUid,
        csrfmiddlewaretoken: csrfToken
      };
      const path = `/svr/v2/adm/companies/${companyId}/users`;
      return requestWithRouteFallback(path, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
    }

    return {
      fetchUsersBatch,
      fetchAllUsers,
      addMember,
      deleteMembers,
      deleteSingleMember
    };
  }

  globalThis.KdocsHelperMembersApi = {
    createMembersApi
  };
})();
