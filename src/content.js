(function () {
  const { PAGE_SIZE, ACCESS_SCOPE_PERMISSION, DEFAULT_API_ORIGIN } = globalThis.KdocsHelperConstants;
  const { normalizeErrorMessage, normalizePhone, formatPhoneForDisplay, formatStatus } = globalThis.KdocsHelperFormat;
  const { escapeHtml, copyText } = globalThis.KdocsHelperDom;
  const apiClient = globalThis.KdocsHelperApiClient;
  const { createCompanyApi } = globalThis.KdocsHelperCompanyApi;
  const { createMembersApi } = globalThis.KdocsHelperMembersApi;
  const ICONS = globalThis.KdocsHelperIcons;
  const { buildPanelUI } = globalThis.KdocsHelperPanel;
  const { createMemberListRenderer, createRetryListRenderer } = globalThis.KdocsHelperRender;
  const { createCompanyActions } = globalThis.KdocsHelperCompanyActions;
  const { createMemberActions } = globalThis.KdocsHelperMemberActions;
  const API_ORIGIN = getApiOrigin();

  const state = {
    users: [],
    selectedCompUids: new Set(),
    currentPage: 1,
    loading: false,
    defaultDeptId: null,
    failedReAdditions: [],
    csrfToken: null,
    companyId: null,
    deptId: null,
    deptSourceCompanyId: null,
    addSectionExpanded: true,
    listSectionExpanded: true,
    listSortAsc: true,
    actionInProgress: false,
    autoRefreshEnabled: true,
    autoRefreshIntervalMs: 30000,
    autoRefreshTimer: null,
    floating: {
      x: null,
      y: null
    }
  };

  const el = {};
  const memberListRenderer = createMemberListRenderer({
    state,
    el,
    pageSize: PAGE_SIZE,
    escapeHtml,
    formatPhoneForDisplay,
    formatStatus
  });
  const retryListRenderer = createRetryListRenderer({
    state,
    el,
    escapeHtml,
    formatPhoneForDisplay,
    onRetry: retryAdd
  });
  const companyActions = createCompanyActions({
    getCompanyId,
    showConfirm,
    setStatus,
    setActionInProgress,
    normalizeErrorMessage,
    copyText
  });
  const memberActions = createMemberActions({
    state,
    el,
    showConfirm,
    setStatus,
    setActionInProgress,
    loadUsers,
    renderRetryList,
    addMember,
    deleteMembers,
    deleteSingleMember,
    normalizePhone,
    formatPhoneForDisplay
  });
  const companyApi = createCompanyApi({
    getApiOrigin: () => API_ORIGIN,
    requestJson,
    accessScopePermission: ACCESS_SCOPE_PERMISSION
  });
  const membersApi = createMembersApi({
    getApiOrigin: () => API_ORIGIN,
    getCompanyId,
    getDeptId,
    getCsrfToken,
    requestJson,
    formatPhoneForDisplay
  });

  bootstrap();

  function getApiOrigin() {
    const host = String(window.location.hostname || "").toLowerCase();
    if (host.includes("wps.cn") || host.includes("kdocs.cn")) {
      return window.location.origin;
    }
    return DEFAULT_API_ORIGIN;
  }

  function bootstrap() {
    if (document.body) {
      init();
      return;
    }
    window.addEventListener("DOMContentLoaded", init, { once: true });
  }

  function init() {
    if (document.getElementById("kdocs-member-helper-root")) {
      return;
    }
    if (!document.body) {
      return;
    }
    buildUI();
    bindEvents();
    initFloatingPosition();
    refreshRuntimeContext().catch(() => {});
  }

  function buildUI() {
    Object.assign(el, buildPanelUI());
  }

  function bindEvents() {
    el.launcher.addEventListener("click", () => {
      if (el.launcher.dataset.dragging === "1") return;
      loadUsers({ silent: true });
      el.panel.classList.toggle("hidden");
      ensureFloatingInViewport();
      updateAutoRefreshState();
    });
    el.closeBtn.addEventListener("click", () => {
      el.panel.classList.add("hidden");
      updateAutoRefreshState();
    });
    el.refreshBtn.addEventListener("click", () => loadUsers({ silent: false }));
    el.destroyCompanyBtn.addEventListener("click", handleDestroyCompany);
    el.companyIdBtn.addEventListener("click", handleCopyCompanyId);
    el.addToggleBtn.addEventListener("click", toggleAddSection);
    el.listToggleBtn.addEventListener("click", toggleListSection);
    el.listOrderBtn.addEventListener("click", toggleListOrder);
    el.addBtn.addEventListener("click", handleAddMember);
    el.prevBtn.addEventListener("click", () => changePage(-1));
    el.nextBtn.addEventListener("click", () => changePage(1));
    el.deleteBtn.addEventListener("click", handleDeleteSelected);
    el.rebuildBtn.addEventListener("click", handleDeleteAndRebuildSelected);
    makeDraggable(el.launcher);
    makeDraggable(el.panel.querySelector(".kdocs-header h3"));
    window.addEventListener("resize", ensureFloatingInViewport);
    document.addEventListener("visibilitychange", updateAutoRefreshState);
  }

  function isPanelVisible() {
    return !el.panel.classList.contains("hidden");
  }

  function clearAutoRefreshTimer() {
    if (state.autoRefreshTimer) {
      clearTimeout(state.autoRefreshTimer);
      state.autoRefreshTimer = null;
    }
  }

  function updateAutoRefreshState() {
    clearAutoRefreshTimer();
    if (
      !state.autoRefreshEnabled ||
      !isPanelVisible() ||
      document.visibilityState !== "visible" ||
      state.loading ||
      state.actionInProgress
    ) {
      return;
    }

    state.autoRefreshTimer = setTimeout(async () => {
      state.autoRefreshTimer = null;
      if (
        !state.autoRefreshEnabled ||
        !isPanelVisible() ||
        document.visibilityState !== "visible" ||
        state.loading ||
        state.actionInProgress
      ) {
        updateAutoRefreshState();
        return;
      }

      try {
        await loadUsers({ silent: true });
      } finally {
        updateAutoRefreshState();
      }
    }, state.autoRefreshIntervalMs);
  }

  function initFloatingPosition() {
    const launcherWidth = el.launcher.offsetWidth || 90;
    const launcherHeight = el.launcher.offsetHeight || 40;
    const defaultX = Math.max(8, window.innerWidth - launcherWidth - 20);
    const defaultY = Math.max(8, window.innerHeight - launcherHeight - 24);
    state.floating.x = defaultX;
    state.floating.y = defaultY;
    applyFloatingPosition();
  }

  function applyFloatingPosition() {
    el.root.style.left = `${state.floating.x}px`;
    el.root.style.top = `${state.floating.y}px`;
  }

  function ensureFloatingInViewport() {
    const panelVisible = !el.panel.classList.contains("hidden");
    const launcherWidth = el.launcher.offsetWidth || 90;
    const launcherHeight = el.launcher.offsetHeight || 40;
    const panelWidth = el.panel.offsetWidth || 420;
    const panelHeight = el.panel.offsetHeight || 300;
    const gap = 8;

    let minX = 8;
    let maxX = Math.max(8, window.innerWidth - launcherWidth - 8);
    let minY = 8;
    let maxY = Math.max(8, window.innerHeight - launcherHeight - 8);

    if (panelVisible) {
      // 面板位于按钮上方并右侧对齐，需按整体外接矩形约束边界。
      minX = Math.max(8, panelWidth - launcherWidth + 8);
      minY = Math.max(8, panelHeight + gap + 8);
    }

    if (maxX < minX) {
      minX = 8;
      maxX = Math.max(8, window.innerWidth - launcherWidth - 8);
    }
    if (maxY < minY) {
      minY = 8;
      maxY = Math.max(8, window.innerHeight - launcherHeight - 8);
    }

    state.floating.x = Math.min(maxX, Math.max(minX, state.floating.x));
    state.floating.y = Math.min(maxY, Math.max(minY, state.floating.y));
    applyFloatingPosition();
  }

  function makeDraggable(handle) {
    if (!handle) return;
    handle.style.cursor = "move";

    handle.addEventListener("mousedown", (event) => {
      if (event.button !== 0) return;
      const startX = event.clientX;
      const startY = event.clientY;
      const originX = state.floating.x;
      const originY = state.floating.y;
      let moved = false;

      const onMove = (moveEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
          moved = true;
        }
        state.floating.x = originX + dx;
        state.floating.y = originY + dy;
        ensureFloatingInViewport();
      };

      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        if (moved) {
          setTimeout(() => {
            handle.dataset.dragging = "0";
          }, 0);
          handle.dataset.dragging = "1";
        }
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    });
  }

  async function handleCopyCompanyId() {
    return companyActions.handleCopyCompanyId();
  }

  async function handleDestroyCompany() {
    return companyActions.handleDestroyCompany();
  }

  function toggleAddSection() {
    state.addSectionExpanded = !state.addSectionExpanded;
    el.addSectionBody.classList.toggle("hidden", !state.addSectionExpanded);
    el.addToggleBtn.innerHTML = state.addSectionExpanded ? ICONS.chevronDown : ICONS.chevronRight;
    el.addToggleBtn.title = state.addSectionExpanded ? "收起" : "展开";
    ensureFloatingInViewport();
  }

  function toggleListSection() {
    state.listSectionExpanded = !state.listSectionExpanded;
    el.listSectionBody.classList.toggle("hidden", !state.listSectionExpanded);
    el.listToggleBtn.innerHTML = state.listSectionExpanded ? ICONS.chevronDown : ICONS.chevronRight;
    el.listToggleBtn.title = state.listSectionExpanded ? "收起" : "展开";
    ensureFloatingInViewport();
  }

  function toggleListOrder() {
    state.listSortAsc = !state.listSortAsc;
    state.currentPage = 1;
    el.listOrderBtn.innerHTML = state.listSortAsc ? ICONS.sortAsc : ICONS.sortDesc;
    el.listOrderBtn.title = state.listSortAsc ? "倒序显示" : "正序显示";
    renderUsers();
  }

  async function refreshRuntimeContext() {
    const response = await chrome.runtime.sendMessage({ type: "GET_RUNTIME_CONTEXT", origin: API_ORIGIN });
    if (!response?.ok) {
      throw new Error(normalizeErrorMessage(response?.error || "读取运行时上下文失败"));
    }
    state.csrfToken = response.csrfToken || null;
    if (response.companyId) {
      if (state.companyId && state.companyId !== response.companyId) {
        state.deptId = null;
        state.deptSourceCompanyId = null;
        state.defaultDeptId = null;
      }
      state.companyId = response.companyId;
    } else {
      state.companyId = null;
    }
    updateCompanyIdLabel();
    return {
      csrfToken: state.csrfToken,
      companyId: state.companyId,
      deptId: state.deptId
    };
  }

  function updateCompanyIdLabel() {
    if (!el.companyIdBtn) return;
    const hasCompanyId = !!state.companyId;
    el.companyIdBtn.textContent = hasCompanyId ? `CID:${state.companyId}` : "";
    el.companyIdBtn.classList.toggle("hidden", !hasCompanyId);
    if (el.destroyCompanyBtn) {
      el.destroyCompanyBtn.classList.toggle("hidden", !hasCompanyId);
    }
  }

  async function getCompanyId() {
    if (!state.companyId) {
      await refreshRuntimeContext();
    }
    if (!state.companyId) {
      throw new Error("企业未登录");
    }
    return state.companyId;
  }

  async function getDeptId(options = {}) {
    const required = !!options.required;
    const forceRefresh = !!options.forceRefresh;
    const companyId = await getCompanyId();
    const cached =
      !forceRefresh &&
      state.deptId &&
      state.deptSourceCompanyId &&
      String(state.deptSourceCompanyId) === String(companyId);
    if (cached) {
      return state.deptId;
    }

    const deptId = await fetchAccessScopeDeptId(companyId);
    if (deptId) {
      state.deptId = deptId;
      state.deptSourceCompanyId = companyId;
      state.defaultDeptId = deptId;
      return deptId;
    }

    if (required) {
      throw new Error("未从 access_scope 接口获取到部门ID，请确认当前账号有企业通讯录权限。");
    }
    return null;
  }

  async function getCsrfToken() {
    if (!state.csrfToken) {
      await refreshRuntimeContext();
    }
    if (!state.csrfToken) {
      throw new Error("企业未登录");
    }
    return state.csrfToken;
  }

  async function requestJson(url, options) {
    return apiClient.requestJson(url, options, {
      onLoggedOut: applyLoggedOutState
    });
  }

  function applyLoggedOutState() {
    state.companyId = null;
    state.csrfToken = null;
    state.deptId = null;
    state.deptSourceCompanyId = null;
    state.defaultDeptId = null;
    updateCompanyIdLabel();
  }

  async function fetchAccessScopeDeptId(companyId) {
    return companyApi.fetchAccessScopeDeptId(companyId);
  }

  async function fetchUsersBatch(offset, limit) {
    return membersApi.fetchUsersBatch(offset, limit);
  }

  async function fetchAllUsers() {
    return membersApi.fetchAllUsers();
  }

  async function loadUsers(options = {}) {
    const silent = !!options.silent;
    if (state.loading) return;
    state.loading = true;
    if (!silent) {
      setStatus("正在加载企业成员...", "info");
    }
    toggleActionButtons(true);
    updateAutoRefreshState();
    try {
      const users = await fetchAllUsers();
      state.users = users;
      state.selectedCompUids.clear();
      state.currentPage = 1;
      state.defaultDeptId = state.deptId || users?.[0]?.depts?.[0]?.id || null;
      renderUsers();
      if (!silent) {
        setStatus(`成员加载完成，共 ${users.length} 人。`, "success");
      }
    } catch (error) {
      setStatus(`加载失败：${error.message}`, "error");
    } finally {
      state.loading = false;
      toggleActionButtons(false);
      updateAutoRefreshState();
    }
  }

  function renderUsers() {
    memberListRenderer.renderUsers();
  }

  function renderRetryList() {
    retryListRenderer.renderRetryList();
  }

  function changePage(delta) {
    const totalPages = Math.max(1, Math.ceil(state.users.length / PAGE_SIZE));
    const targetPage = state.currentPage + delta;
    if (targetPage < 1 || targetPage > totalPages) return;
    state.currentPage = targetPage;
    renderUsers();
  }

  async function handleAddMember() {
    return memberActions.handleAddMember();
  }

  async function handleDeleteSelected() {
    return memberActions.handleDeleteSelected();
  }

  async function handleDeleteAndRebuildSelected() {
    return memberActions.handleDeleteAndRebuildSelected();
  }

  async function retryAdd(compUid) {
    return memberActions.retryAdd(compUid);
  }

  async function addMember({ name, phone }) {
    return membersApi.addMember({ name, phone });
  }

  async function deleteMembers(compUids) {
    return membersApi.deleteMembers(compUids);
  }

  async function deleteSingleMember(compUid) {
    return membersApi.deleteSingleMember(compUid);
  }

  function setStatus(message, type) {
    el.status.textContent = message;
    el.status.className = `status ${type}`;
  }

  function setActionInProgress(inProgress) {
    state.actionInProgress = inProgress;
    toggleActionButtons(inProgress);
    updateAutoRefreshState();
  }

  function toggleActionButtons(disabled) {
    [el.destroyCompanyBtn, el.refreshBtn, el.addBtn, el.deleteBtn, el.rebuildBtn].forEach((node) => {
      node.disabled = disabled;
    });
    if (disabled) {
      el.prevBtn.disabled = true;
      el.nextBtn.disabled = true;
      return;
    }
    syncPaginationButtons();
  }

  function syncPaginationButtons() {
    memberListRenderer.syncPaginationButtons();
  }

  function showConfirm(title, content) {
    return new Promise((resolve) => {
      el.confirmTitle.textContent = title;
      el.confirmContent.textContent = content;
      el.confirmMask.classList.remove("hidden");

      const cleanup = () => {
        el.confirmMask.classList.add("hidden");
        el.confirmCancel.removeEventListener("click", onCancel);
        el.confirmOk.removeEventListener("click", onOk);
      };
      const onCancel = () => {
        cleanup();
        resolve(false);
      };
      const onOk = () => {
        cleanup();
        resolve(true);
      };
      el.confirmCancel.addEventListener("click", onCancel);
      el.confirmOk.addEventListener("click", onOk);
    });
  }
})();
