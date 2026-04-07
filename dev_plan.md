# ReadingBuddy 开发计划

> 原则：前端先行，用 mock 数据跑通 UI 和交互，再接入后端 API。

---

## 一、前端开发（apps/web）— 已完成

### 1.1 项目初始化 ✅
- [x] 执行 npm install，确认 Next.js dev server 能启动
- [x] 配置 shadcn/ui（初始化 + 安装基础组件：Button, Input, Textarea, Card, Dialog）
- [x] 配置全局样式和字体（Nunito，儿童友好的圆润风格）
- [x] 创建通用 Layout 组件（顶部导航栏 + 页面容器）

### 1.2 书本录入页（/books/setup）✅
- [x] 书本标题输入
- [x] 章节列表展示（已有章节 + 添加/编辑/删除）
- [x] 章节录入表单（标题 + 文本粘贴区 + 实时字数统计）
- [x] 前端校验：章节数 ≤ 5，单章词数 ≤ 3000
- [x] 数据通过后端 API 存入 Supabase

### 1.3 阅读主界面（/read/[id]）✅
- [x] 章节选择 tab 切换
- [x] 书本内容展示区（按段落渲染，支持点击句子触发 AI 解释）
- [x] 两个操作按钮：Read Aloud / Listen
- [x] AI 对话区（ChatPanel，Claude SSE 流式回复）
- [x] 段落高亮 + TTS 句子级绿色高亮

### 1.4 对话功能 ✅
- [x] ChatPanel：消息列表 + 输入框 + 发送
- [x] Claude SSE 流式回复（真实 API）
- [x] 流式文字显示效果 + 光标动画
- [x] 对话历史管理（最近 10 轮）

### 1.5 语音功能 ✅
- [x] useSpeech hook：Web Speech API 实时转文字
- [x] 朗读时实时逐词对比高亮（correct/incorrect/unread）
- [x] TTS 逐句发送 OpenAI API + 预加载下一句 + 句子高亮
- [x] Pause / Resume / Stop 控制

### 1.6 练习页面（/practice）✅
- [x] 词汇训练：用户标记的词 → 闪卡 + 填空测验
- [x] 闪卡内嵌 Listen（OpenAI TTS）+ Read Aloud（语音对比评分）
- [x] 读完自动停止录音
- [x] Read-Along 功能已整合到 Vocabulary 模块

### 1.7 首页（/）✅
- [x] 展示当前书本信息和章节状态（Started / Not started + 标记词数）
- [x] 快速进入阅读/练习/设置的入口卡片
- [x] 无书本时引导去录入页面

### 1.8 响应式适配 ✅
- [x] iPad/平板优先布局
- [x] 移动端基础可用（44px 触摸区域、16px 输入防缩放）
- [x] 大按钮、大字体，适合儿童操作

### 1.9 设置页面（/settings）✅
- [x] Voice 选择（10 种 OpenAI TTS 音色，可预览试听）
- [x] Speed 选择（4 档语速：0.7x / 0.85x / 1.0x / 1.15x）
- [x] 设置持久化到 localStorage

---

## 二、后端开发（apps/api）— 已完成

### 2.1 项目初始化 ✅
- [x] npm install，Fastify dev server 启动
- [x] 配置 Supabase 连接 + 运行 migration（5 张表）
- [x] 配置 CORS（含 PUT/DELETE）、rate limit
- [x] 健康检查接口 /api/health

### 2.2 书本管理 API（/api/books）✅
- [x] POST /api/books — 创建书本
- [x] GET /api/books — 获取书本列表
- [x] GET /api/books/:bookId — 获取书本详情（含章节）
- [x] POST /api/books/:bookId/chapters — 添加章节（含校验 + 文本清洗）
- [x] PUT /api/books/:bookId/chapters/:chapterId — 编辑章节
- [x] DELETE /api/books/:bookId/chapters/:chapterId — 删除章节

### 2.3 对话 API（/api/chat）✅
- [x] POST /api/chat — 非流式回复
- [x] POST /api/chat/stream — SSE 流式回复
- [x] 拼装 System Prompt（Roz 老师 + 全书内容注入）
- [x] 对话历史截断（最近 10 轮）

### 2.4 TTS API（/api/tts）✅
- [x] POST /api/tts — 接收 text/voice/speed，调用 OpenAI TTS API
- [x] 流式返回 mp3 音频
- [x] 支持用户自定义音色和语速


### 2.5 认证 — TODO
- [ ] Supabase Auth 集成（邮箱注册/登录）
- [ ] API 路由鉴权中间件
- [ ] 前端登录/注册页面



### 2.6 发音评估 API（/api/assess）— TODO
- [ ] Phase 2: 接入 Azure Speech SDK 做音素级评分
- 当前使用前端 text-diff 做基础逐词对比



---

## 三、前后端联调 — 已完成 ✅

- [x] Book Setup → Supabase 存储 → 阅读页读取，全链路跑通
- [x] Chat → Claude API SSE 流式回复
- [x] TTS → OpenAI API 真实语音（逐句播放 + 句子高亮）
- [x] 删除 wavesurfer.js，用原生 Audio 播放

---

## 四、部署上线 — 待开始

- [ ] Vercel 部署前端
- [ ] Railway 部署后端
- [ ] 环境变量配置
- [ ] 自定义域名绑定
- [ ] Sentry 错误监控接入
