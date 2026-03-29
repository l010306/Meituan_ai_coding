# 🍔 美团 AI-Native 社团招新平台 🤖

[![Deploy Status](https://img.shields.io/badge/Deploy-Alibaba%20Cloud%20(HK)-blue?style=for-the-badge&logo=alibabacloud)](http://47.242.249.27/)
[![Tech Stack](https://img.shields.io/badge/Tech-Spring%20Boot%20%2B%20React%20%2B%20Vite-61dafb?style=for-the-badge&logo=react)](http://47.242.249.27/)
[![LLM Power](https://img.shields.io/badge/AI-DeepSeek%20%2B%20RAG-orange?style=for-the-badge&logo=openai)](https://platform.deepseek.com/)

<ctrl94> **“让每一次招新都充满智慧。让每一份简历都能遇见对的社团。”**

本项目是一个基于 **LLM (大语言模型) + RAG (检索增强生成)** 技术的校园社团智慧招新解决方案。通过深度整合 AI 能力，打通了从学生简历优化、智能兴趣匹配到社团招新文案生成的全链路流程。

---

## 🏛️ 项目全景 (Overview)

### 1. 学生端：全能 AI 申请助手
*   **AI 简历润色**：解析原始履历，通过 DeepSeek 模型进行专业化润色，提升申请成功率。
*   **招新广场推荐**：基于 RAG 语义检索，根据学生兴趣描述，精准匹配最具契合度的社团。
*   **智能仪表盘**：实时跟踪申请进度。

### 2. 管理端：AI 招新实验室
*   **招新文案生成**：输入社团关键词，一键生成极具号召力的招新推文。
*   **视觉海报生成**：基于 DALL-E 3 (或 Unsplash 图片库) 自动渲染精美的招新海报。
*   **工程配置面板**：实时热切换 AI 提供商（DeepSeek / OpenAI / Gemini），灵活管理 API Key。

---

## 🛠️ 技术架构 (Tech Stack)

### 后端 (Backend)
- **Core**: Java 17, Spring Boot 3.x
- **ORM**: Mybatis Plus
- **Database**: MySQL 8.0
- **AI Integration**: RestTemplate + Multi-Provider Gateway (OpenAI SDK Compatible)
- **Similarity Engine**: RAG-based Text Similarity Matching

### 前端 (Frontend)
- **Framework**: React 19 + TypeScript
- **Styling**: TailwindCSS & Glassmorphism Design
- **Build Tool**: Vite 6.0
- **Deployment**: SSR Compatible Nginx Proxy Strategy

---

## 🌍 云端部署与访问 (Live Demo)

该项目当前已稳定部署于 **Alibaba Cloud (HK) 阿里云香港** 集群，通过 Docker 容器化方案进行自动化运维。

*   **学生端入口**: [http://47.242.249.27/](http://47.242.249.27/)
*   **管理端入口**: [http://47.242.249.27/admin/](http://47.242.249.27/admin/) (建议在 [工程面板] 配置 DeepSeek Key 开启 AI 完整体验)

---

## 🚀 快速开始 (Getting Started)

### 本地编译与运行

1. **后端启动 (recruitment-api)**
```bash
cd recruitment-api
chmod +x mvnw
./mvnw clean package -DskipTests
java -jar target/recruitment-api-0.0.1-SNAPSHOT.jar
```

2. **前端启动**
```bash
# 启动学生端 (Port: 5173)
cd recruitment-student-web && npm run dev

# 启动管理端 (Port: 5174)
cd recruitment-web && npm run dev
```

### 部署到服务器 (Docker)

```bash
# 进入部署目录并一键拉起
sudo docker compose up -d --build
```

---

## 🏗️ 核心贡献者 (Contributors)

*   **Repo**: [l010306/Meituan_ai_coding](https://github.com/l010306/Meituan_ai_coding)
*   **Developer**: l010306
*   **Environment**: Alibaba Cloud (HK) Elastic Compute Service

---

## 📄 开源协议 (License)

本项目采用 **MIT License**。您可以自由地将其用于学习、交流或二次开发，请保留原作者信息。

---

> 💡 **测试账号备注**：
> 请在登录页使用预填的 SSO 账号。首次登录将自动触发模拟“校企数据库”同步与用户预支，开启您的智慧招新之旅！
