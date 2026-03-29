# 🚀 美团 AI 社团招聘平台：生产环境运维与更新指南

本手册旨在指导如何进行项目的日常开发、测试及云端（阿里云）部署更新。

---

## 🏗️ 1. 项目架构概览 (Structure)

项目采用 **前后端分离 + Docker 容器化** 架构：
- **前端 A (管理端)**: `recruitment-web` (部署于 `/admin` 路径)
- **前端 B (学生端)**: `recruitment-student-web` (部署于 `/` 根路径)
- **后端 (API)**: `recruitment-api` (运行于容器内 8080 端口)
- **数据库**: `MySQL 8.0` (运行于容器内 3306 端口)
- **转发层**: `Nginx` (监听 80 端口，负责静态资源分发与 API 转发)

---

## 💻 2. 本地开发与调试 (Local Development)

### 2.1 启动模式
为了方便开发，你可以选择 **“本地前端 + 云端后端”** 的模式，无需在本地运行数据库。

1.  **修改 `vite.config.ts` 的代理目标**：
    将 `target` 改为云端 IP `http://47.242.249.27`。
2.  **运行前端**：
    ```bash
    npm run dev
    ```
    *   **管理端**: 访问 `http://localhost:5174/`
    *   **学生端**: 访问 `http://localhost:5173/`

### 2.2 环境自适应 (Automatic Mode)
当前项目已配置 `mode` 感应：
- **开发模式 (`dev`)**: 自动使用 `/` 根路径，方便本地调试。
- **生产模式 (`build`)**: 自动为管理端添加 `/admin/` 路径前缀，适配云端 Nginx。

---

## 🚀 3. 云端发布流程 (Deployment)

### 3.1 前端热更新 (Frontend Update)
修改代码后，执行以下“一键三连”：

#### **管理端 (Employer)**:
```bash
cd recruitment-web
npm run build
scp -r ./dist/* admin@47.242.249.27:/home/admin/meituan-project/nginx/admin/
```

#### **学生端 (Student)**:
```bash
cd recruitment-student-web
npm run build
scp -r ./dist/* admin@47.242.249.27:/home/admin/meituan-project/nginx/student/
```

### 3.2 后端代码更新 (Backend Update)
1.  **本地打包**: 在本地 IDE 中生成 `recruitment-api-0.0.1-SNAPSHOT.jar`。
2.  **上传包**:
    ```bash
    scp ./target/xxx.jar admin@47.242.249.27:/home/admin/meituan-project/app/
    ```
3.  **云端重启**:
    ```bash
    ssh admin@47.242.249.27 "cd ~/meituan-project && sudo docker compose restart backend"
    ```

---

## 🛠️ 4. 服务器日常维护 (Maintenance)

所有命令需在服务器的 `~/meituan-project` 目录下执行：

| 任务 | 命令 |
| :--- | :--- |
| **查看所有服务状态** | `sudo docker compose ps` |
| **重启整个项目** | `sudo docker compose restart` |
| **查看后端错误日志** | `sudo docker compose logs backend --tail 50 -f` |
| **进入数据库终端** | `sudo docker exec -it meituan-project-db-1 mysql -u root -p010306` |

---

## 🚨 5. 故障排查 (Troubleshooting)

### 5.1 页面报 502 Bad Gateway
- **原因**: 后端崩溃了。
- **解决**: 运行 `sudo docker compose ps` 检查 `backend` 状态。如果是 `Exit`，看日志搜 `Caused by`。

### 5.2 页面报 404 Not Found
- **原因**: Nginx 配置文件 `nginx.conf` 里的 `proxy_pass` 结尾多/少了斜杠，或路径没对上。
- **解决**: 检查 `/nginx/nginx.conf` 并运行 `sudo docker exec meituan-project-nginx-1 nginx -s reload`。

### 5.3 数据库连不上 (Access Denied)
- **原因**: `docker-compose.yml` 里的密码与旧的数据库目录冲突。
- **解决**: `sudo rm -rf ./mysql/data` 然后重启（注意：此操作会清空数据，慎用！）。

---

## 🌟 6. 开发者寄语
项目已打通全线。建议每次修改代码前，先在本地 `npm run dev` 确认无误，再通过 `scp` 推送到云端。

祝你的社团招聘平台运营顺利！🔥🍔🥂

服务器上传密码：010306