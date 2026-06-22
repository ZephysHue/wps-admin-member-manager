(function () {
  function createMemberListRenderer({ state, el, pageSize, escapeHtml, formatPhoneForDisplay, formatStatus }) {
    function renderUsers() {
      const orderedUsers = state.listSortAsc ? [...state.users] : [...state.users].reverse();
      const total = orderedUsers.length;
      const pageTotal = Math.max(1, Math.ceil(total / pageSize));
      if (state.currentPage > pageTotal) {
        state.currentPage = pageTotal;
      }
      const start = (state.currentPage - 1) * pageSize;
      const pageUsers = orderedUsers.slice(start, start + pageSize);

      el.totalLabel.textContent = `（共 ${total} 人）`;
      el.pageIndicator.textContent = `第 ${state.currentPage} / ${pageTotal} 页`;
      syncPaginationButtons();

      if (pageUsers.length === 0) {
        el.list.innerHTML = `<div class="kdocs-empty">暂无成员数据，请点击“加载成员”。</div>`;
        return;
      }

      const header = `
        <div class="kdocs-row kdocs-row-header">
          <span></span>
          <span class="name">昵称</span>
          <span class="phone">手机号</span>
          <span class="tag">激活状态</span>
        </div>
      `;

      const rows = pageUsers
        .map((user) => {
          const checked = state.selectedCompUids.has(user.comp_uid) ? "checked" : "";
          const phone = formatPhoneForDisplay(user.phone || "");
          const status = formatStatus(user.status || "");
          return `
            <label class="kdocs-row">
              <input type="checkbox" class="kdocs-select-item" data-comp-uid="${escapeHtml(
                user.comp_uid || ""
              )}" ${checked} />
              <span class="name">${escapeHtml(user.name || "(无姓名)")}</span>
              <span class="phone">${escapeHtml(phone || "(无手机号)")}</span>
              <span class="tag">${escapeHtml(status)}</span>
            </label>
          `;
        })
        .join("");
      el.list.innerHTML = header + rows;

      el.list.querySelectorAll(".kdocs-select-item").forEach((checkbox) => {
        checkbox.addEventListener("change", (event) => {
          const target = event.currentTarget;
          const compUid = target.getAttribute("data-comp-uid");
          if (!compUid) return;
          if (target.checked) {
            state.selectedCompUids.add(compUid);
          } else {
            state.selectedCompUids.delete(compUid);
          }
        });
      });
    }

    function syncPaginationButtons() {
      const totalPages = Math.max(1, Math.ceil(state.users.length / pageSize));
      el.prevBtn.disabled = state.currentPage <= 1;
      el.nextBtn.disabled = state.currentPage >= totalPages;
    }

    return {
      renderUsers,
      syncPaginationButtons
    };
  }

  function createRetryListRenderer({ state, el, escapeHtml, formatPhoneForDisplay, onRetry }) {
    function renderRetryList() {
      if (state.failedReAdditions.length === 0) {
        el.retryList.className = "kdocs-retry-list empty";
        el.retryList.innerHTML = "暂无失败记录";
        return;
      }

      el.retryList.className = "kdocs-retry-list";
      el.retryList.innerHTML = state.failedReAdditions
        .map(
          (item) => `
            <div class="retry-item">
              <div>
                <strong>${escapeHtml(item.name)}</strong>
                <span>${escapeHtml(formatPhoneForDisplay(item.phone))}</span>
                <p>${escapeHtml(item.error)}</p>
              </div>
              <button class="retry-btn" data-comp-uid="${escapeHtml(item.comp_uid)}">重试新增</button>
            </div>
          `
        )
        .join("");

      el.retryList.querySelectorAll(".retry-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const compUid = btn.getAttribute("data-comp-uid");
          if (!compUid) return;
          onRetry(compUid);
        });
      });
    }

    return {
      renderRetryList
    };
  }

  globalThis.KdocsHelperRender = {
    createMemberListRenderer,
    createRetryListRenderer
  };
})();
