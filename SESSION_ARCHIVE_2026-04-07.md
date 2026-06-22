# 企业助手 - 会话纪要（2026-04-07）

## 目标

基于企业通讯录管理需求，开发并迭代浏览器插件（Chrome/Edge），以悬浮窗形式在已登录的 WPS/KDocs 管理页面执行成员管理操作。

---

## 当前插件状态（已落地）

- 插件名称：`企业助手`
- 运行方式：内容脚本注入页面，右下角悬浮按钮打开面板
- 主要能力：
  - 加载成员列表（前端分页）
  - 删除选中成员
  - 仅新增成员
  - 删除并重建成员（失败支持重试新增）
  - 注销企业（顶部按钮）

---

## 已实现的关键功能与规则

### 1) 数据与接口

- 通讯录拉取：
  - 接口：`/3rd/plussvr/svr/v1/adm/companies/{cid}/depts/{deptId}/users`
  - 方法：`GET`
  - 分页：插件内前端分页（每页 5 条）
- 新增成员：
  - 接口：`/3rd/plussvr/svr/v2/adm/companies/{cid}/users`
  - 方法：`POST`
  - 手机号提交为 11 位纯数字（不带 `+86`），`country_code` 保持 `+86`
- 删除成员：
  - 接口：`/3rd/plussvr/svr/v2/adm/companies/{cid}/users`
  - 方法：`DELETE`
  - 采用逐个串行删除，避免多选批量时网关异常
- 注销企业：
  - 接口：`https://plussvr.wps.cn/svr/v1/adm/e2e/companies/{cid}`
  - 方法：`DELETE`
  - 二次确认，204 视为成功

### 2) 动态参数来源（当前生效）

- `cid`：从 cookie 动态读取（不写死）
- `deptId`：通过接口动态获取（不从 cookie 推断）
  - 接口：`/3rd/plussvr/plusadmin/v2/companies/{cid}/users/self/access_scope`
  - 取值：`scope[*].access_depts[*].id_path`

### 3) 登录态与错误处理

- 若接口返回 `userNotLogin` / `not login`：
  - UI 文案统一显示：`企业未登录`
  - 立即清空登录态相关缓存（`cid/csrf/dept`）
  - 顶部隐藏 `CID` 与 `注销企业` 按钮
- 无有效 `cid` 时，顶部不显示 `CID` 与 `注销企业`

### 4) UI/交互（最终版）

- 悬浮按钮文案：`企业助手`
- 面板标题：`企业助手`
- 顶部：
  - `CID`（有值才显示，可点击复制）
  - `注销企业`（仅有 `cid` 时显示）
  - 刷新图标、关闭图标（统一线性 SVG）
- 新增模块标题：`新增未激活成员`
- 成员列表：
  - 表头：`昵称 / 手机号 / 激活状态`
  - 标题右侧人数显示：`（共 x 人）`
  - 支持模块折叠/展开
  - 支持正序/倒序切换（默认正序）
- “删除并重建选中成员”按钮：
  - 右侧有 `i` 提示图标
  - hover 文案：`重建后的成员为未激活状态，可手动登录该账号激活`
- 每次点击悬浮按钮都会触发一次成员列表请求（静默刷新）
- 面板支持拖拽，显示在悬浮按钮上方且右侧对齐

### 5) 自动刷新策略

- 默认开启轻量轮询（30 秒）
- 仅在面板可见、页面可见、且非操作执行中时触发
- 操作期间自动暂停，完成后恢复

### 6) 域名兼容（最新）

- 已支持在 `*.kdocs.cn` 与 `*.wps.cn` 下正常使用：
  - 内容脚本注入范围已覆盖两类域名
  - 接口请求按当前页面域名优先
  - 运行时上下文读取会按当前页面 origin 优先取 CSRF，并兼容 `kdocs.cn/wps.cn` cookie

---

## 兼容性与范围

- 浏览器：Chrome / Edge
- 注入范围（manifest）：
  - `https://365.kdocs.cn/*`
  - `https://*.365.kdocs.cn/*`
  - `https://*.kdocs.cn/*`
  - `https://*.wps.cn/*`

---

## 图标与命名

- 插件名：`企业助手`
- 图标文件已接入四尺寸 PNG：
  - `icons/icon-16.png`
  - `icons/icon-32.png`
  - `icons/icon-48.png`
  - `icons/icon-128.png`
- `manifest.json` 的 `icons` 与 `action.default_icon` 已引用上述文件

---

## 主要文件（当前）

- `manifest.json`
- `src/background.js`
- `src/content.js`
- `src/content.css`
- `README.md`

---

## 下次继续建议（可选）

- 增加“调试模式”开关（显示当前 `cid/deptId` 与最近请求结果）
- 增加本地操作日志面板（时间、动作、结果）
- 将企业/部门接口链路抽成独立 service，降低 `content.js` 复杂度

---

## 本轮增量记录（追加）

- 修复 `*.wps.cn` 注入可见但功能不可用问题（请求与 cookie 链路完成域名兼容）。
- 新增成员接口手机号提交规则改为“默认不带 `+86`”，并在提交前校验 11 位格式。

