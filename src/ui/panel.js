(function () {
  const ICONS = globalThis.KdocsHelperIcons;

  function buildPanelUI() {
    const root = document.createElement("div");
    root.id = "kdocs-member-helper-root";
    root.innerHTML = `
      <button id="kdocs-helper-launcher" title="企业助手">企业助手</button>
      <section id="kdocs-helper-panel" class="hidden">
        <header class="kdocs-header">
          <div class="kdocs-title-group">
            <h3>企业助手</h3>
            <button id="kdocs-company-id-btn" class="link-btn hidden" title="点击复制企业ID"></button>
          </div>
          <div class="kdocs-header-actions">
            <button id="kdocs-destroy-company-btn" class="hidden" title="注销企业">注销企业</button>
            <button id="kdocs-refresh-btn" class="icon-btn" title="加载成员">${ICONS.refresh}</button>
            <button id="kdocs-close-btn" class="icon-btn" title="关闭">${ICONS.close}</button>
          </div>
        </header>

        <div id="kdocs-status" class="status hidden"></div>

        <section class="kdocs-card">
          <div class="kdocs-list-header">
            <h4>新增未激活成员</h4>
            <button id="kdocs-add-toggle-btn" class="icon-btn" title="收起">${ICONS.chevronDown}</button>
          </div>
          <div id="kdocs-add-section-body">
            <div class="kdocs-form-row">
              <label>姓名</label>
              <input id="kdocs-name-input" type="text" placeholder="请输入成员姓名" />
            </div>
            <div class="kdocs-form-row">
              <label>手机号</label>
              <input id="kdocs-phone-input" type="text" placeholder="请输入手机号（自动转 +86）" />
            </div>
            <button id="kdocs-add-btn" class="primary">仅新增成员</button>
          </div>
        </section>

        <section class="kdocs-card">
          <div class="kdocs-list-header">
            <div class="kdocs-list-title-group">
              <h4>成员列表</h4>
              <span id="kdocs-total-label">（共 0 人）</span>
            </div>
            <div class="kdocs-list-controls">
              <button id="kdocs-list-order-btn" class="icon-btn" title="倒序显示">${ICONS.sortAsc}</button>
              <button id="kdocs-list-toggle-btn" class="icon-btn" title="收起">${ICONS.chevronDown}</button>
            </div>
          </div>
          <div id="kdocs-list-section-body">
            <div id="kdocs-list" class="kdocs-list"></div>
            <div class="kdocs-pagination">
              <button id="kdocs-prev-page" class="icon-btn" title="上一页">${ICONS.chevronLeft}</button>
              <span id="kdocs-page-indicator">第 1 / 1 页</span>
              <button id="kdocs-next-page" class="icon-btn" title="下一页">${ICONS.chevronRight}</button>
            </div>
            <div class="kdocs-actions">
              <button id="kdocs-delete-btn" class="danger">删除选中成员</button>
              <button id="kdocs-rebuild-btn" class="warning">
                删除并重建选中成员
                <span
                  class="inline-tip"
                  title="重建后的成员为未激活状态，可手动登录该账号激活"
                  aria-label="重建提示"
                  >i</span
                >
              </button>
            </div>
          </div>
        </section>

        <section class="kdocs-card">
          <h4>成员重建失败队列</h4>
          <div id="kdocs-retry-list" class="kdocs-retry-list empty">暂无失败记录</div>
        </section>
      </section>

      <div id="kdocs-confirm-mask" class="hidden">
        <div id="kdocs-confirm-modal">
          <h4 id="kdocs-confirm-title">确认操作</h4>
          <p id="kdocs-confirm-content"></p>
          <div class="kdocs-confirm-actions">
            <button id="kdocs-confirm-cancel">取消</button>
            <button id="kdocs-confirm-ok" class="danger">确认</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(root);

    return {
      launcher: root.querySelector("#kdocs-helper-launcher"),
      root,
      panel: root.querySelector("#kdocs-helper-panel"),
      closeBtn: root.querySelector("#kdocs-close-btn"),
      refreshBtn: root.querySelector("#kdocs-refresh-btn"),
      destroyCompanyBtn: root.querySelector("#kdocs-destroy-company-btn"),
      companyIdBtn: root.querySelector("#kdocs-company-id-btn"),
      status: root.querySelector("#kdocs-status"),
      addToggleBtn: root.querySelector("#kdocs-add-toggle-btn"),
      addSectionBody: root.querySelector("#kdocs-add-section-body"),
      listToggleBtn: root.querySelector("#kdocs-list-toggle-btn"),
      listOrderBtn: root.querySelector("#kdocs-list-order-btn"),
      listSectionBody: root.querySelector("#kdocs-list-section-body"),
      nameInput: root.querySelector("#kdocs-name-input"),
      phoneInput: root.querySelector("#kdocs-phone-input"),
      addBtn: root.querySelector("#kdocs-add-btn"),
      list: root.querySelector("#kdocs-list"),
      totalLabel: root.querySelector("#kdocs-total-label"),
      prevBtn: root.querySelector("#kdocs-prev-page"),
      nextBtn: root.querySelector("#kdocs-next-page"),
      pageIndicator: root.querySelector("#kdocs-page-indicator"),
      deleteBtn: root.querySelector("#kdocs-delete-btn"),
      rebuildBtn: root.querySelector("#kdocs-rebuild-btn"),
      retryList: root.querySelector("#kdocs-retry-list"),
      confirmMask: root.querySelector("#kdocs-confirm-mask"),
      confirmTitle: root.querySelector("#kdocs-confirm-title"),
      confirmContent: root.querySelector("#kdocs-confirm-content"),
      confirmCancel: root.querySelector("#kdocs-confirm-cancel"),
      confirmOk: root.querySelector("#kdocs-confirm-ok")
    };
  }

  globalThis.KdocsHelperPanel = {
    buildPanelUI
  };
})();
