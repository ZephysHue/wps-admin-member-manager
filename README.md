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

## 安装方式（开发者模式）

1. 打开 Chrome 或 Edge 扩展管理页。
2. 开启“开发者模式”。
3. 点击“加载已解压的扩展程序”。
4. 选择当前目录：`d:\DeCrCompany`。
5. 打开 `https://365.kdocs.cn/*` 页面即可看到右下角悬浮按钮“成员助手”。

## 文件结构

- `manifest.json`：扩展配置（MV3）
- `src/background.js`：读取 Cookie 中的 CSRF
- `src/content.js`：悬浮窗 UI 与业务逻辑
- `src/content.css`：插件样式
