# 卡坦岛完整项目

当前完整包为 v31：在 v30 基础上修复 Worker 月初补采后“不完整”标记不恢复的问题。从 v30 升级只需部署 gateway/worker.js，不重启游戏站、不修改数据库。游戏服务版本仍为 v30，所有地图与数据中心改动保留。升级步骤、数字配额和用量填写见 [部署说明](DEPLOYMENT.md)。

完整上传、Render 配置和本轮加载修复请查看 [部署说明](DEPLOYMENT.md)。

本机安装依赖：`npm ci --include=dev`。

免配置演示：`npm run demo`，打开 `http://localhost:5174/demo.html`。

正式构建：`npm run build`；正式运行：配置环境变量和 `NODE_ENV=production` 后执行 `npm start`。

线上数据库和邮件配置继续使用 Render 中已有的值；`.env.example` 仅提供示例。

外部保活请查看 [保活说明](EXTERNAL-KEEP-ALIVE.md)。
