# 🍔 美团 AI-Native 社团招新平台 🤖

<div align="center">
  <p>
    <a href="http://47.242.249.27/"><img src="https://img.shields.io/badge/Deploy-Alibaba%20Cloud%20(HK)-blue?style=for-the-badge&logo=alibabacloud" alt="Deploy"></a>
    <a href="http://47.242.249.27/"><img src="https://img.shields.io/badge/Tech-Spring%20Boot%20%2B%20React%20%2B%20Vite-61dafb?style=for-the-badge&logo=react" alt="Tech"></a>
    <a href="https://platform.deepseek.com/"><img src="https://img.shields.io/badge/AI-DeepSeek%20%2B%20RAG-orange?style=for-the-badge&logo=openai" alt="AI"></a>
  </p>
</div>

---

> **“让每一次招新都充满智慧。让每一份简历都能遇见对的社团。”** ✨

本项目是一个基于 **LLM (大语言模型) + RAG (检索增强生成)** 技术的校园社团智慧招新解决方案。通过深度整合 AI 能力，打通了从学生简历优化、智能兴趣匹配到社团招新文案生成的全链路流程。

---

## 🏛️ 项目亮点 (Highlights)

### 🎓 学生端：全能 AI 申请助手
- **AI 简历润色**：解析原始履历，通过 DeepSeek 模型进行专业化润色，**让平凡经历闪闪发光**。
- **招新广场推荐**：基于 RAG 语义检索，根据学生兴趣描述，**精准匹配**最具契合度的社团。
- **智能进度看板**：实时跟踪，招新动态尽在掌握。

### 🏢 管理端：AI 招新实验室
- **招新文案创作**：输入社团关键词，一键生成极具号召力的 **爆款招新推文**。
- **视觉海报工坊**：自动获取精美背景并渲染招新文案，生成 **视觉冲击力十足** 的海报。
- **工程黑科技**：实时热切换 AI 提供商（DeepSeek / OpenAI / Gemini），灵活管理 API 额度。

---

## 🛠️ 技术底座 (Tech Stack)

| 领域 | 技术栈 | 描述 |
| :--- | :--- | :--- |
| **后端** | `Java 17` / `Spring Boot 3` | 稳健的业务底座 |
| **持久层** | `Mybatis Plus` / `MySQL 8` | 高效的数据仓储 |
| **前端工具** | `Vite 6` / `TypeScript` | 毫秒级的开发构建体验 |
| **UI 视图** | `React 19` / `TailwindCSS` | 响应式玻璃拟态设计 |
| **AI 大模型** | `DeepSeek` / `RAG` | 核心语义理解与内容生成 |
| **运维部署** | `Docker` / `Nginx Proxy` | 工业级的同步与分发方案 |

---

## 🌍 云端访问 (Live Demo)

服务器运行于 **Alibaba Cloud (HK)** 阿里云香港节点。

- 🚀 **[点击进入：学生端入口](http://47.242.249.27/)**
- ⚙️ **[点击进入：管理端入口](http://47.242.249.27/admin/)** 
  - *提示：请前往「工程面板」填写测试 Key 以激活 AI 服务。*

---

## 🚀 快速本地开发 (Quick Start)

### 1. 后端工程 (API)
```bash
cd recruitment-api
./mvnw clean package -DskipTests
java -jar target/recruitment-api-0.0.1-SNAPSHOT.jar
```

### 2. 前端工程 (Web)
```bash
# 学生端门户 (Port: 5173)
cd recruitment-student-web && npm i && npm run dev

# 运营管理端 (Port: 5174)
cd recruitment-web && npm i && npm run dev
```

---

## 🏗️ 核心贡献 (Contributors)

- **Repo**: [l010306/Meituan_ai_coding](https://github.com/l010306/Meituan_ai_coding)
- **Developer**: l010306
- **Architecture**: AI-Native Agent Mesh

---

## 📄 协议 (License)

本项目采用 **MIT License**。

---

> 💡 **测试备忘**：  
> 请在登录页使用预填的 SSO 账号。首次登录将自动触发模拟“校企数据库”同步与用户初始化。
