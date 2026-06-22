(function () {
  function createCompanyActions({
    getCompanyId,
    showConfirm,
    setStatus,
    setActionInProgress,
    normalizeErrorMessage,
    copyText
  }) {
    async function handleCopyCompanyId() {
      try {
        const companyId = await getCompanyId();
        await copyText(companyId);
        setStatus(`企业ID已复制：${companyId}`, "success");
      } catch (_error) {
        setStatus("复制企业ID失败，请手动复制。", "error");
      }
    }

    async function handleDestroyCompany() {
      let companyId = "";
      try {
        companyId = await getCompanyId();
      } catch (error) {
        setStatus(normalizeErrorMessage(error?.message || "企业未登录"), "error");
        return;
      }
      const confirmed = await showConfirm("确认注销企业？", `将注销企业 CID:${companyId}，此操作不可逆，请谨慎操作。`);
      if (!confirmed) return;

      setActionInProgress(true);
      try {
        const url = `https://plussvr.wps.cn/svr/v1/adm/e2e/companies/${companyId}`;
        const response = await fetch(url, {
          method: "DELETE",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          }
        });

        if (response.status === 204) {
          setStatus(`企业注销成功：CID ${companyId}`, "success");
          setTimeout(() => {
            window.location.reload();
          }, 800);
          return;
        }

        const responseText = await response.text();
        const errorMessage = `注销企业失败。状态码: ${response.status}，响应: ${responseText || "(空)"}`;
        setStatus(errorMessage, "error");
        await copyText(errorMessage);
      } catch (error) {
        const errorMessage = `注销企业异常：${error?.message || "未知错误"}`;
        setStatus(errorMessage, "error");
        try {
          await copyText(errorMessage);
        } catch (_copyError) {}
      } finally {
        setActionInProgress(false);
      }
    }

    return {
      handleCopyCompanyId,
      handleDestroyCompany
    };
  }

  globalThis.KdocsHelperCompanyActions = {
    createCompanyActions
  };
})();
