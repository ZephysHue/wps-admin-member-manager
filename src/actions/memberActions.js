(function () {
  function createMemberActions({
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
  }) {
    async function handleAddMember() {
      const name = el.nameInput.value.trim();
      const normalizedPhone = normalizePhone(el.phoneInput.value);
      if (!name) {
        setStatus("请先输入成员姓名。", "error");
        return;
      }
      if (!normalizedPhone) {
        setStatus("请先输入合法手机号。", "error");
        return;
      }

      const confirmed = await showConfirm(
        "确认仅新增成员？",
        `将新增成员：${name}（${formatPhoneForDisplay(normalizedPhone)}）`
      );
      if (!confirmed) return;

      setActionInProgress(true);
      try {
        await addMember({ name, phone: normalizedPhone });
        el.nameInput.value = "";
        el.phoneInput.value = "";
        setStatus("新增成功。", "success");
        await loadUsers({ silent: true });
      } catch (error) {
        setStatus(`新增失败：${error.message}`, "error");
      } finally {
        setActionInProgress(false);
      }
    }

    async function handleDeleteSelected() {
      const compUids = Array.from(state.selectedCompUids);
      if (compUids.length === 0) {
        setStatus("请先勾选要删除的成员。", "error");
        return;
      }

      const confirmed = await showConfirm(
        "确认删除选中成员？",
        `将删除 ${compUids.length} 名成员，此操作不可撤销。`
      );
      if (!confirmed) return;

      setActionInProgress(true);
      try {
        const result = await deleteMembers(compUids);
        if (result.failed.length > 0) {
          setStatus(
            `删除完成：成功 ${result.success.length} 人，失败 ${result.failed.length} 人。失败示例：${result.failed[0].error}`,
            "error"
          );
        } else {
          setStatus(`删除成功，共 ${result.success.length} 人。`, "success");
        }
        await loadUsers({ silent: true });
      } catch (error) {
        setStatus(`删除失败：${error.message}`, "error");
      } finally {
        setActionInProgress(false);
      }
    }

    async function handleDeleteAndRebuildSelected() {
      const selectedUsers = state.users.filter((user) => state.selectedCompUids.has(user.comp_uid));
      if (selectedUsers.length === 0) {
        setStatus("请先勾选要重建的成员。", "error");
        return;
      }

      const confirmed = await showConfirm(
        "确认删除并重建？",
        `将删除并重建 ${selectedUsers.length} 名成员。删除后将按原姓名和手机号重新新增。`
      );
      if (!confirmed) return;

      setActionInProgress(true);
      state.failedReAdditions = [];
      renderRetryList();
      try {
        let successCount = 0;
        let deleteFailCount = 0;
        for (const user of selectedUsers) {
          try {
            await deleteSingleMember(user.comp_uid);
          } catch (_error) {
            deleteFailCount += 1;
            continue;
          }

          try {
            const phone = normalizePhone(user.phone || "");
            if (!phone) {
              throw new Error("原手机号为空或格式不合法");
            }
            await addMember({
              name: user.name || "",
              phone
            });
            successCount += 1;
          } catch (error) {
            state.failedReAdditions.push({
              comp_uid: user.comp_uid,
              name: user.name || "(无姓名)",
              phone: user.phone || "",
              error: error.message || "未知错误"
            });
          }
        }

        renderRetryList();
        if (deleteFailCount > 0 || state.failedReAdditions.length > 0) {
          setStatus(
            `重建完成：成功 ${successCount} 人，删除失败 ${deleteFailCount} 人，新增失败 ${state.failedReAdditions.length} 人（新增失败可在下方重试）。`,
            "error"
          );
        } else {
          setStatus(`重建成功，共 ${successCount} 人。`, "success");
        }

        await loadUsers({ silent: true });
      } catch (error) {
        setStatus(`删除并重建失败：${error.message}`, "error");
      } finally {
        setActionInProgress(false);
      }
    }

    async function retryAdd(compUid) {
      const target = state.failedReAdditions.find((item) => item.comp_uid === compUid);
      if (!target) return;

      setActionInProgress(true);
      try {
        const phone = normalizePhone(target.phone);
        if (!phone) {
          throw new Error("手机号格式不合法");
        }
        await addMember({ name: target.name, phone });
        state.failedReAdditions = state.failedReAdditions.filter((item) => item.comp_uid !== compUid);
        renderRetryList();
        setStatus(`重试成功：${target.name}`, "success");
        await loadUsers({ silent: true });
      } catch (error) {
        target.error = error.message || "未知错误";
        renderRetryList();
        setStatus(`重试失败：${target.name}，${target.error}`, "error");
      } finally {
        setActionInProgress(false);
      }
    }

    return {
      handleAddMember,
      handleDeleteSelected,
      handleDeleteAndRebuildSelected,
      retryAdd
    };
  }

  globalThis.KdocsHelperMemberActions = {
    createMemberActions
  };
})();
