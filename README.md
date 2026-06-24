# KDocs 企业成员助手（Chrome / Edge）

## 功能

- 在 `https://365.kdocs.cn/*` 页面显示悬浮窗按钮。
- 加载企业通讯录成员列表（前端分页，每页 10 条）。
- 支持批量删除选中成员。
- 支持仅新增成员（手动输入姓名和手机号，自动提交 `+86` 格式）。
- 支持删除并重建选中成员。
- 重建过程中若新增失败，会在插件内标红并提供“重试新增”按钮。
- 顶部提供“注销企业”按钮（调用企业注销接口，二次确认后执行）。

## 关键约定

- 部门 ID 通过 `access_scope` 接口实时获取，取响应中的 `scope[*].access_depts[*].id_path`。
- 通讯录加载和新增成员都会使用该动态部门 ID。
- 企业 ID（CID）从 `.kdocs.cn` Cookie 实时读取，不写死在代码中。
- CSRF 从 `.kdocs.cn` Cookie 中读取 `csrf` 或 `csrfmiddlewaretoken`，并映射到请求体字段 `csrfmiddlewaretoken`。
- 列表展示手机号时会隐藏 `+86` 前缀。

## 环境准备

- 浏览器：Chrome 或 Edge（需开启开发者模式）
- Git：用于克隆本仓库（[安装 Git](https://git-scm.com/downloads)）
- 已登录 WPS/KDocs 企业管理后台的账号（管理员权限）

## 安装方式（开发者模式）

### 1. 克隆仓库到本地

在本地任意目录新建一个文件夹用于存放插件，然后在该目录下打开终端（CMD / PowerShell / Git Bash 均可），执行：

```bash
git clone https://github.com/ZephysHue/wps-admin-member-manager.git
```

克隆完成后，本地会生成一个 `wps-admin-member-manager` 文件夹，即为插件目录。

### 2. 在浏览器中加载插件

1. 打开 Chrome 或 Edge，地址栏输入 `chrome://extensions/`（Edge 为 `edge://extensions/`）。
2. 打开页面右上角的「开发者模式」开关。
3. 点击左上角「加载已解压的扩展程序」。
4. 在弹出的目录选择框中，选中上一步克隆下来的 `wps-admin-member-manager` 文件夹（即包含 `manifest.json` 的那一层）。
5. 加载成功后，扩展列表中会出现「企业助手」。

### 3. 开始使用

1. 浏览器中打开 `https://365.kdocs.cn/*` 或 `https://account.wps.cn/*` 页面并登录企业管理账号。
2. 页面右下角会出现悬浮按钮「成员助手」，点击即可打开操作面板。
3. 后续插件代码有更新时，在本地目录执行 `git pull` 拉取最新代码，再到扩展管理页点击该插件的「刷新」按钮即可生效。

## 文件结构

- `manifest.json`：扩展配置（MV3）
- `src/background.js`：读取 Cookie 中的 CSRF
- `src/content.js`：悬浮窗 UI 与业务逻辑
- `src/content.css`：插件样式
