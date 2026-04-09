# ReadingBuddy

AI儿童英语阅读辅导系统，面向6-12岁华裔家庭。孩子可录入书本内容（最多5章/每章3000词），AI（Roz老师）围绕书本进行朗读纠正、词汇训练、对话问答。

## 技术栈

- **Monorepo**: npm workspaces + Turborepo
- **前端**: Next.js 15 (App Router) + shadcn/ui + Tailwind CSS + Zustand
- **后端**: Fastify + TypeScript
- **AI 对话**: Claude API (claude-sonnet-4) — Phase 0 全文注入 System Prompt
- **TTS**: OpenAI TTS API (tts-1 模型，用户可选音色和语速)
- **语音输入**: Web Speech API (实时转文字 + 逐词对比)
- **发音评估**: 前端 text-diff 对比（Phase 2 升级 Azure Speech SDK）
- **数据库**: Supabase (PostgreSQL)
- **部署**: Vercel (前端) + Railway (后端)

## 项目结构

```
apps/web/              — Next.js 前端
  app/(student)/       — 页面路由: /, /books/setup, /read/[id], /practice, /practice/vocab, /settings
  components/          — reader/, book-setup/, chat/, voice/ (AudioPlayer已移除)
  lib/                 — store.ts (Zustand), api.ts (后端API客户端), use-speech.ts, text-diff.ts
apps/api/              — Fastify 后端
  src/routes/          — chat.ts (SSE流式), tts.ts (OpenAI TTS), assess.ts, books.ts
  src/services/        — claude.ts, elevenlabs.ts (实际已改为OpenAI TTS), rag.ts
  src/db/              — supabase.ts
packages/shared-types/ — 前后端共享 TypeScript 类型
packages/prompts/      — System Prompt 模板 (buildSystemPrompt)
supabase/migrations/   — 数据库 schema (5张表: books, chapters, paragraphs, vocab_highlights, chat_messages)
```

## 当前进度

- 前端全部完成 (1.1-1.8): 书本录入、阅读界面、AI对话(SSE流式)、TTS逐句播放+句子高亮、语音朗读+逐词对比、词汇标记+练习(闪卡/填空/朗读)、设置页(音色/语速)、响应式适配
- 后端完成: Fastify启动、Supabase连接+migration、Books API (CRUD)、Chat API (Claude SSE流式)、TTS API (OpenAI)
- 前后端联调完成: Book Setup → Supabase、Chat → Claude SSE、TTS → OpenAI API
- 已完成: 认证(Supabase Auth)、部署(Vercel部署了前端web， 后端部署在自有的Win Server 2022上)

## 关键设计决策

- MVP 无独立家长端，书本录入在儿童端完成
- Phase 0 不用 RAG，全书内容直接注入 Claude 上下文（5章约20K tokens）
- AI角色"Roz老师"严格限制只讨论书本内容，保障儿童安全
- TTS 用 OpenAI tts-1（替代原计划的 ElevenLabs，因免费计划API受限）
- 词汇练习由用户在阅读页手动标记，不自动提取
- Read-Along 功能已整合到 Vocabulary 模块，不单独设页面
- wavesurfer.js 已移除，TTS 用原生 Audio 播放
