# AI儿童阅读辅导系统 — 技术设计文档

**项目代号**: ReadingBuddy  
**文档版本**: v1.1  
**日期**: 2026-04-04  
**作者**: 架构设计稿（MVP简化版）  
**变更说明**: MVP阶段取消独立家长管理端；书本内容录入入口移至儿童端；章节数量上限设为5个

---

## 目录

1. [项目概述](#1-项目概述)
2. [需求分析](#2-需求分析)
3. [技术选型](#3-技术选型)
4. [系统架构](#4-系统架构)
5. [模块详细设计](#5-模块详细设计)
6. [数据模型](#6-数据模型)
7. [AI Agent 设计](#7-ai-agent-设计)
8. [语音子系统设计](#8-语音子系统设计)
9. [安全与合规](#9-安全与合规)
10. [部署方案](#10-部署方案)
11. [开发路线图](#11-开发路线图)
12. [成本估算](#12-成本估算)

---

## 1. 项目概述

### 1.1 背景

市场上现有的儿童AI阅读辅导工具（Ello、Readability、Amira）均使用封闭的内置书库，家长无法指定特定书目。本项目旨在构建一个**书目可自定义**的AI英语阅读辅导Agent，首期以《The Wild Robot》为示范书目，面向华裔家庭英语literacy提升场景。

**MVP范围说明**：不建设独立的家长管理后台，书本内容录入功能直接内嵌于儿童端界面，以最小开发量验证核心体验。

### 1.2 核心价值主张

- 用户可在儿童端直接录入书本内容（最多5个章节），AI严格围绕该书进行辅导
- 孩子可以朗读、Agent实时监听并纠正
- Agent可做示范朗读、拆解长难句、专项词汇训练
- 儿童安全：话题范围严格受限，界面简洁无干扰

### 1.3 目标用户

| 角色 | 描述 |
|------|------|
| **孩子（学生端）** | 6–12岁，母语非英语，英语阅读能力发展阶段 |
| **家长（辅助录入）** | MVP阶段协助孩子在儿童端完成书本内容录入，无需独立账号 |

---

## 2. 需求分析

### 2.1 功能性需求

#### 儿童端（全部功能，含书本管理）

| 功能 | 描述 | 优先级 |
|------|------|--------|
| 书本内容录入 | 粘贴文字录入章节内容，最多5个章节 | P0 |
| 书本阅读界面 | 展示当前章节内容，段落高亮 | P0 |
| 跟读练习 | Agent朗读一段 → 孩子跟读 → AI评分 | P0 |
| 自主朗读监听 | 孩子朗读，Agent实时纠错、鼓励 | P0 |
| 对话问答 | 孩子就书本内容提问，Agent解答（限书本范围） | P0 |
| 长难句拆解 | 选中句子 → Agent解释句子结构和生词 | P1 |
| 词汇训练 | 随机抽取书中重点词汇做练习 | P1 |
| 示范朗读 | Agent用标准发音朗读选定段落 | P1 |
| 学习进度记录 | 记录已读章节、生词本、练习得分 | P2 |

> **MVP章节限制**：单本书最多录入 **5个章节**，每章节文本上限约 **3000词**（约4000 tokens），5章合计约20K tokens，远低于Claude 200K上下文上限，Phase 0可全量注入，无需RAG。

#### 家长端 — MVP阶段不建设

家长端功能（学习报告、子账号管理、重点词汇标注）推迟至 Phase 2 实现。MVP阶段家长通过陪同孩子使用儿童端来参与学习过程。

### 2.2 非功能性需求

- **响应速度**：AI文字回复 < 2秒，TTS音频首字节 < 1秒
- **儿童安全**：任何非书本相关话题均被礼貌拒绝
- **设备兼容**：优先支持iPad/平板（孩子最常用设备），其次PC浏览器
- **离线能力**：基础阅读界面可离线使用，AI功能需联网

---

## 3. 技术选型

### 3.1 选型原则

> 以**快速上线、成本可控、功能覆盖**为优先，选择成熟度高、社区活跃的技术栈。避免过度工程化。

### 3.2 前端技术

| 模块 | 选型 | 理由 |
|------|------|------|
| 框架 | **Next.js 15 (App Router)** | SSR利于SEO，React生态，部署简单 |
| UI组件库 | **shadcn/ui + Tailwind CSS** | 高质量组件，完全可定制，无vendor lock-in |
| 语音输入 | **Web Speech API**（主） + **OpenAI Whisper**（备） | Web Speech API免费、低延迟适合实时；Whisper准确率更高用于评分 |
| 语音输出（TTS） | **ElevenLabs API** | 声音最自然，有儿童友好音色，支持情感调节 |
| 音频处理 | **Wavesurfer.js** | 音频波形可视化，增强孩子互动感 |
| 状态管理 | **Zustand** | 轻量，适合中等复杂度应用 |

#### Web Speech API vs Whisper 分工

```
实时跟读监听（低延迟优先）  →  Web Speech API
跟读完成后的发音评分      →  Whisper API（精确）
```

### 3.3 后端技术

| 模块 | 选型 | 理由 |
|------|------|------|
| 运行时 | **Node.js + TypeScript** | 与前端同语言，减少上下文切换 |
| 框架 | **Fastify** | 比Express快3-5倍，插件体系完善 |
| AI核心 | **Claude API (claude-sonnet-4)** | 长上下文窗口(200K)，可将全书塞入；中文理解能力强，方便切换中英解释 |
| 向量搜索 | **Supabase pgvector**（P1阶段启用） | 与PostgreSQL一体化，书本内容分段存储和检索 |
| 语音评估 | **Azure Cognitive Services - Speech SDK** | 提供专业的Pronunciation Assessment API，有音素级别的精确评分 |

#### 为什么选Claude而不是GPT-4

| 维度 | Claude | GPT-4o |
|------|--------|--------|
| 上下文窗口 | 200K tokens（可放下全书） | 128K |
| 儿童内容安全 | Constitutional AI，天然保守 | 需要额外调校 |
| 中文能力 | 优秀（家长端可用中文操作） | 优秀 |
| API价格 | Sonnet性价比更高 | 相当 |

### 3.4 数据存储

| 用途 | 选型 | 理由 |
|------|------|------|
| 主数据库 | **Supabase (PostgreSQL)** | 书本内容、用户数据、学习记录，自带认证 |
| 向量数据库 | **Supabase pgvector 扩展** | 无需额外服务，书本段落embedding存储 |
| 文件存储 | **Supabase Storage** | 音频录音文件（用于发音分析）临时存储 |
| 缓存 | **Upstash Redis** | API响应缓存，Serverless友好 |

### 3.5 基础设施

| 模块 | 选型 |
|------|------|
| 部署平台 | **Vercel**（前端） + **Railway**（后端API） |
| 认证 | **Supabase Auth**（MVP阶段仅单一用户账号，无角色区分） |
| 监控 | **Sentry**（错误监控）+ **Vercel Analytics** |
| CDN | Vercel Edge Network（自动） |

### 3.6 技术选型汇总图

```
┌─────────────────────────────────────────────────────────┐
│                    客户端（浏览器/iPad）                    │
│                                                         │
│   Next.js 15  ──  shadcn/ui  ──  Tailwind CSS           │
│   Zustand（状态）  Wavesurfer.js（音频波形）               │
│   Web Speech API（实时语音输入）                           │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS / WebSocket
┌──────────────────────▼──────────────────────────────────┐
│                   后端 API（Railway）                      │
│                                                         │
│   Fastify + TypeScript                                  │
│   ├── /api/chat       → Claude API（受限Agent）           │
│   ├── /api/tts        → ElevenLabs（示范朗读）            │
│   ├── /api/assess     → Azure Speech（发音评分）          │
│   ├── /api/books      → 书本管理（儿童端录入，最多5章）    │
│   └── /api/progress   → 学习进度记录                     │
└──────┬───────────────────────────┬───────────────────────┘
       │                           │
┌──────▼──────┐           ┌────────▼────────┐
│  Supabase   │           │  第三方AI服务     │
│             │           │                 │
│  PostgreSQL │           │  Claude API     │
│  pgvector   │           │  ElevenLabs     │
│  Auth       │           │  Azure Speech   │
│  Storage    │           │  OpenAI Whisper │
└─────────────┘           └─────────────────┘
```

---

## 4. 系统架构

### 4.1 整体架构风格

采用**单体优先（Monolith-first）**策略：初期前后端分离的单体服务，功能验证后再按需拆分微服务。避免过早的服务化带来的运维复杂度。

### 4.2 核心数据流

#### 场景一：孩子自主朗读 → AI实时纠正

```
孩子朗读
   │
   ▼
Web Speech API（浏览器端实时转文字）
   │  transcript（流式）
   ▼
前端将transcript与书本原文对比（简单diff）
   │  发现可能的错读词
   ▼
调用后端 /api/chat
   │  携带：当前段落原文 + transcript + 错误词列表
   ▼
Claude Agent（带书本上下文）
   │  生成温和纠正反馈
   ▼
ElevenLabs TTS → 音频流
   │
   ▼
孩子听到纠正反馈
```

#### 场景二：孩子就书本内容提问

```
孩子输入/说出问题
   │
   ▼
后端检索书本相关段落（pgvector similarity search）
   │  返回Top-3相关段落
   ▼
拼装Prompt：[系统提示] + [书本段落] + [对话历史] + [孩子问题]
   │
   ▼
Claude API（流式输出）
   │
   ▼
前端流式渲染回答 + 可选TTS朗读
```

#### 场景三：示范朗读

```
家长/孩子选择段落
   │
   ▼
后端调用 ElevenLabs /v1/text-to-speech
   │  voice_id: 预设儿童友好音色
   │  model: eleven_turbo_v2（低延迟）
   ▼
音频流返回前端
   │
   ▼
Wavesurfer.js 播放 + 文字同步高亮
```

---

## 5. 模块详细设计

### 5.1 儿童端界面（Student Interface）

MVP阶段儿童端承担**全部功能**，包含书本录入入口。

#### 主要页面

```
/                        → 欢迎页（选择/录入书本）
/books/setup             → 书本录入与章节管理（最多5章）
/read/[chapterId]        → 阅读主界面
/practice/vocab          → 词汇训练
/practice/shadowing      → 跟读练习
```

#### 书本录入页（/books/setup）

MVP的书本管理入口，设计上**简洁、低门槛**，家长可陪孩子一起完成初始设置：

```
┌─────────────────────────────────────────────┐
│  📚 我的书：The Wild Robot                   │
│  ─────────────────────────────────────────  │
│  章节列表（已添加 2 / 最多 5 章）             │
│                                             │
│  ✅ Chapter 1: The Island  [编辑] [删除]     │
│  ✅ Chapter 2: The Sounds  [编辑] [删除]     │
│  ＋ 添加新章节                               │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │ 章节标题：____________________________│  │
│  │                                       │  │
│  │ 粘贴章节内容（最多3000词）：           │  │
│  │ ┌─────────────────────────────────┐  │  │
│  │ │                                 │  │  │
│  │ │  [文字粘贴区域]                  │  │  │
│  │ │                                 │  │  │
│  │ └─────────────────────────────────┘  │  │
│  │  字数：0 / 3000    [保存章节]         │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ⚠️ 提示：本功能仅供家庭私人学习使用          │
└─────────────────────────────────────────────┘
```

**章节限制的前后端双重校验**：

```typescript
// 后端校验（/api/books/chapters POST）
const MAX_CHAPTERS = 5;
const MAX_WORDS_PER_CHAPTER = 3000;

async function addChapter(bookId: string, payload: ChapterInput) {
  const existing = await db.chapters.count({ where: { bookId } });
  if (existing >= MAX_CHAPTERS) {
    throw new ApiError(400, `MVP阶段每本书最多${MAX_CHAPTERS}个章节`);
  }
  const wordCount = payload.rawText.split(/\s+/).length;
  if (wordCount > MAX_WORDS_PER_CHAPTER) {
    throw new ApiError(400, `章节内容不能超过${MAX_WORDS_PER_CHAPTER}词`);
  }
  // ... 正常保存逻辑
}
```

#### 阅读主界面（/read/[chapterId]）

```
┌─────────────────────────────────────────────┐
│  📖 Chapter 3: The Nest                      │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  The wild robot looked at the egg.   │  │
│  │  She did not know what to do with    │  │  ← 书本内容区
│  │  it. But something inside her said:  │  │     点击句子可拆解
│  │  "Keep it warm."                     │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ 🎙️ 我来读 │  │ 🔊 听示范 │  │ ❓ 有问题 │  │  ← 操作按钮
│  └──────────┘  └──────────┘  └──────────┘  │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  Roz老师：很棒！"warm"读得很准确。     │  │
│  │  "something inside her"是一个很有意   │  │  ← AI对话区
│  │  思的表达，你知道是什么意思吗？        │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### 5.2 书本内容处理管道

```
用户粘贴原始文本（儿童端 /books/setup）
       │
       ▼
前端实时字数统计（超3000词时提示截断）
       │
       ▼
后端校验：章节数 ≤ 5，单章词数 ≤ 3000
       │
       ▼
文本清洗（去除多余空白、统一标点）
       │
       ▼
按段落切分（每段200-400 tokens）
       │
       ├──→ 存入 chapters / paragraphs 表
       │
       └──→ 生成段落 embedding（text-embedding-3-small）
              │
              ▼
           存入 pgvector（用于相似度搜索）
```

> **Phase 0简化**：5章合计约20K tokens，可直接全量注入System Prompt，跳过embedding生成步骤，等Phase 1再补充RAG管道。

---

## 6. 数据模型

### 6.1 核心数据表

```sql
-- 用户表（MVP：单一角色，无家长/孩子区分）
CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 书本表
CREATE TABLE books (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID REFERENCES profiles(id),
  title       TEXT NOT NULL,
  author      TEXT,
  cover_url   TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 章节表（MVP限制：每本书最多5章，每章最多3000词）
CREATE TABLE chapters (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id     UUID REFERENCES books(id) ON DELETE CASCADE,
  title       TEXT,
  chapter_num INTEGER NOT NULL CHECK (chapter_num BETWEEN 1 AND 5),
  raw_text    TEXT NOT NULL,
  word_count  INTEGER GENERATED ALWAYS AS (
                array_length(string_to_array(trim(raw_text), ' '), 1)
              ) STORED,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  -- 数据库层面强制章节上限
  CONSTRAINT max_chapters_per_book EXCLUDE USING btree (
    book_id WITH =
  ) WHERE (chapter_num > 5)
);

-- 段落表（RAG 检索单元）
CREATE TABLE paragraphs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id  UUID REFERENCES chapters(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  para_index  INTEGER NOT NULL,    -- 段落在章节中的顺序
  embedding   VECTOR(1536),        -- pgvector embedding
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 家长标注的重点词汇
CREATE TABLE vocab_highlights (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id     UUID REFERENCES books(id),
  word        TEXT NOT NULL,
  definition  TEXT,               -- 家长可以自定义解释
  paragraph_id UUID REFERENCES paragraphs(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 学习会话记录
CREATE TABLE learning_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id    UUID REFERENCES profiles(id),
  book_id     UUID REFERENCES books(id),
  chapter_id  UUID REFERENCES chapters(id),
  started_at  TIMESTAMPTZ DEFAULT NOW(),
  ended_at    TIMESTAMPTZ,
  duration_sec INTEGER
);

-- 对话历史（每次会话）
CREATE TABLE chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID REFERENCES learning_sessions(id),
  role        TEXT CHECK (role IN ('user', 'assistant')),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 发音评估记录
CREATE TABLE pronunciation_assessments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID REFERENCES learning_sessions(id),
  original_text   TEXT NOT NULL,   -- 书本原文
  transcript      TEXT NOT NULL,   -- 孩子实际读的
  accuracy_score  NUMERIC(5,2),    -- Azure返回的综合分数
  error_words     JSONB,           -- 读错的词列表
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.2 索引设计

```sql
-- 向量相似度搜索索引（HNSW算法，速度快于IVFFlat）
CREATE INDEX ON paragraphs USING hnsw (embedding vector_cosine_ops);

-- 常用查询索引
CREATE INDEX ON chapters (book_id, chapter_num);
CREATE INDEX ON chat_messages (session_id, created_at);
CREATE INDEX ON learning_sessions (child_id, started_at DESC);
```

---

## 7. AI Agent 设计

### 7.1 系统提示（System Prompt）架构

Agent的System Prompt分为三层：

```
┌─────────────────────────────────────┐
│  Layer 1：角色与约束（固定，不变）      │
│  "你是Roz老师，只讨论书本内容..."      │
├─────────────────────────────────────┤
│  Layer 2：书本上下文（RAG检索动态注入） │
│  "当前相关段落：{retrieved_paragraphs}"│
├─────────────────────────────────────┤
│  Layer 3：会话状态（动态）             │
│  当前章节、孩子年龄、最近的错误词汇      │
└─────────────────────────────────────┘
```

### 7.2 完整 System Prompt 模板

```
你是Roz老师，一位专门辅导小朋友阅读《{book_title}》的英语老师。

【你的性格】
- 温柔、耐心、充满鼓励
- 用简单、友好的语言和孩子交流
- 每次纠正错误时，先表扬孩子的努力，再温柔指出问题
- 用"很棒！"、"你做得真好！"等正向语言

【严格规则 - 必须遵守】
1. 只讨论《{book_title}》的内容，拒绝任何与书本无关的话题
2. 如果孩子问无关问题，用"Roz老师只能帮你了解这本书哦！"回应
3. 不提供书本以外的故事、游戏、或其他内容
4. 保持儿童安全：不讨论任何暴力、恐怖、或不适合儿童的话题
5. 解释生词时，用简单的英语解释，可以辅以中文（因为孩子的母语是中文）

【当前书本信息】
书名：{book_title}
当前章节：{chapter_title}
孩子年龄：{child_age}岁

【相关书本段落（RAG检索结果）】
{retrieved_paragraphs}

【你可以做的事】
- 解释生词和词组
- 拆解长难句（先说句子结构，再解释意思）
- 纠正孩子的发音错误（通过文字描述正确发音）
- 回答关于故事情节、人物、主题的问题
- 出词汇小测验
- 让孩子用自己的话复述故事

【输出格式】
- 回答简短，不超过3-4句话（孩子注意力有限）
- 避免使用markdown格式
- 如果要拆解句子，用编号列表清晰呈现
```

### 7.3 意图识别与路由

后端在转发给Claude之前，先做轻量级的意图识别，决定RAG检索策略：

```typescript
type Intent = 
  | 'vocabulary_question'      // 问生词
  | 'sentence_breakdown'       // 要求拆解句子
  | 'story_comprehension'      // 理解故事情节
  | 'pronunciation_feedback'   // 发音纠错（来自朗读transcript）
  | 'vocab_quiz_request'       // 要求词汇测验
  | 'off_topic'                // 无关话题（直接拦截）

function detectIntent(message: string, context: SessionContext): Intent {
  // 简单关键词匹配 + Claude轻量分类
  // 根据Intent决定检索哪些段落、用什么prompt变体
}
```

### 7.4 对话历史管理

孩子的注意力短，对话窗口保持最近 **10轮**，防止token膨胀：

```typescript
const MAX_HISTORY_TURNS = 10;

function buildMessages(history: ChatMessage[], newMessage: string) {
  const recentHistory = history.slice(-MAX_HISTORY_TURNS * 2);
  return [
    ...recentHistory.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: newMessage }
  ];
}
```

---

## 8. 语音子系统设计

### 8.1 实时朗读监听流程

```typescript
// 前端：Web Speech API 实时监听
const recognition = new webkitSpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = 'en-US';

recognition.onresult = (event) => {
  const transcript = Array.from(event.results)
    .map(r => r[0].transcript)
    .join('');
  
  // 实时对比书本原文，高亮已读内容
  updateReadingProgress(transcript);
  
  // 结束后发送到后端评分
  if (event.results[event.results.length - 1].isFinal) {
    assessPronunciation(transcript, currentParagraphText);
  }
};
```

### 8.2 发音评估（Azure Pronunciation Assessment）

```typescript
// 后端：调用 Azure Speech SDK
async function assessPronunciation(
  audioBlob: Buffer,
  referenceText: string
): Promise<AssessmentResult> {
  
  const pronunciationConfig = PronunciationAssessmentConfig.fromJSON({
    referenceText,
    gradingSystem: "HundredMark",
    granularity: "Word",  // 词级别评分
    enableMiscue: true    // 检测替换、漏读、多读
  });

  // 返回结构：
  // {
  //   accuracyScore: 85,
  //   fluencyScore: 72,
  //   words: [
  //     { word: "robot", accuracyScore: 95, errorType: "None" },
  //     { word: "looked", accuracyScore: 45, errorType: "Mispronunciation" }
  //   ]
  // }
}
```

### 8.3 TTS 示范朗读（ElevenLabs）

```typescript
// 后端：调用 ElevenLabs API
async function generateSpeech(text: string): Promise<ReadableStream> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2',  // 低延迟模型
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.85,
          style: 0.3,          // 轻微情感表达
          use_speaker_boost: true
        }
      })
    }
  );
  
  return response.body; // 流式返回，减少首字节延迟
}
```

**推荐音色**：ElevenLabs 的 `Charlotte` 或 `Matilda`，声音清晰温柔，适合儿童英语教学。

### 8.4 文字与音频同步高亮

```
ElevenLabs 返回音频 + 时间戳对齐数据（word-level timestamps）
       │
       ▼
前端 Wavesurfer.js 播放音频
       │
       ▼
根据时间戳，逐词高亮书本文字
```

---

## 9. 安全与合规

### 9.1 儿童安全（COPPA 合规考虑）

- MVP阶段为单一账号模式，账户由使用者（家长陪同下）自行注册
- 不收集儿童的个人可识别信息（PII），用户名仅用昵称
- 音频录音仅用于实时发音评估，**不长期存储**（处理完立即删除）
- Phase 2引入家长端后，再建立家长账号与儿童账号的绑定关系

### 9.2 内容安全

- System Prompt的约束是第一道防线
- 后端在发送给Claude前，对用户输入做关键词过滤（维护黑名单）
- 对Claude的输出做二次扫描（使用Claude的moderation接口）

### 9.3 API Key 管理

```
❌ 错误：在前端暴露任何API Key
✅ 正确：所有第三方API调用（Claude、ElevenLabs、Azure）均通过后端代理
```

后端使用环境变量管理，部署在Railway的密钥存储中：

```
ANTHROPIC_API_KEY=sk-ant-...
ELEVENLABS_API_KEY=...
AZURE_SPEECH_KEY=...
AZURE_SPEECH_REGION=eastus
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...  # 仅后端使用，不暴露给前端
```

### 9.4 速率限制

```typescript
// 防止滥用，按用户限流
const rateLimiter = {
  chat: '30 requests/minute per child',
  tts: '20 requests/minute per session',
  assessment: '10 requests/minute per child'
};
```

---

## 10. 部署方案

### 10.1 环境划分

| 环境 | 用途 | 说明 |
|------|------|------|
| **Development** | 本地开发 | `localhost:3000`，使用测试API Key |
| **Staging** | 功能测试 | Vercel Preview + Railway staging |
| **Production** | 正式上线 | Vercel Production + Railway production |

### 10.2 部署架构

```
GitHub (代码仓库)
    │
    ├── Push to main ──→ Vercel (前端自动部署)
    │                        │
    │                    vercel.app / 自定义域名
    │
    └── Push to main ──→ Railway (后端自动部署)
                             │
                         railway.app / 自定义域名
                             │
                         连接 Supabase (数据库)
```

### 10.3 域名规划（示例）

```
readbuddy.app          → 儿童端（含书本录入入口）
api.readbuddy.app      → 后端API（Railway）
```

---

## 11. 开发路线图

### Phase 0：技术验证（1-2周）

**目标**：用最小代码验证核心体验

- [ ] 搭建Next.js项目骨架
- [ ] 实现基础对话界面（手动输入，不含语音）
- [ ] 接入Claude API，硬编码《The Wild Robot》前两章内容进System Prompt
- [ ] 验证AI的书本限制效果和回答质量
- [ ] 接入ElevenLabs TTS，实现示范朗读

**交付物**：可演示的对话原型，家长可测试AI的回答质量

---

### Phase 1：MVP（4-6周）

**目标**：完成核心学习功能，可供真实孩子使用

- [ ] 儿童端：书本录入界面（粘贴文字，最多5章，每章3000词）
- [ ] 前后端双重章节数量/字数校验
- [ ] 书本内容分段 + 向量化（Supabase pgvector）
- [ ] RAG检索替换全文注入
- [ ] Web Speech API接入（实时朗读监听）
- [ ] 发音错误检测 + AI温和纠正反馈
- [ ] 学生端完整UI（阅读界面 + 操作按钮 + 对话区）
- [ ] Supabase认证（单一账号，邮箱注册）
- [ ] 基础学习记录（已读章节）

**交付物**：功能完整的MVP，可供3-5个家庭测试

---

### Phase 2：体验优化 + 家长端（4-6周）

**目标**：提升用户体验，补建家长管理端

- [ ] **家长管理端上线**（独立账号、绑定孩子账号）
- [ ] **家长端学习报告**（图表展示进度、错误词汇统计）
- [ ] 书本管理迁移至家长端（儿童端入口降级为只读）
- [ ] Azure Speech发音评估（词级别评分）
- [ ] 文字与TTS音频同步高亮
- [ ] 词汇训练模式（闪卡 + 填空）
- [ ] 跟读练习模式（Agent读一句 → 孩子跟读 → 评分）
- [ ] 长难句可视化拆解（树状结构图）
- [ ] 移动端/iPad适配优化

---

### Phase 3：规模化（持续迭代）

- [ ] 支持多种书本（家长书库管理）
- [ ] 自适应难度（根据孩子表现自动调整训练内容）
- [ ] 多孩子账号支持
- [ ] 家长可设置每日学习目标和提醒
- [ ] 可选：将产品开放给更多华裔家庭（SaaS化）

---

## 12. 成本估算

### 12.1 API调用成本（每月，假设1个孩子每天使用30分钟）

| 服务 | 用量估算 | 单价 | 月成本 |
|------|---------|------|--------|
| Claude Sonnet | ~100次对话/月，平均2K tokens/次 | $3/MTok(input) $15/MTok(output) | ~$3-5 |
| ElevenLabs TTS | ~500次示范朗读/月，平均100字/次 | $0.30/1K字符 | ~$1.5 |
| Azure Speech（发音评估） | ~200次评估/月 | $1/小时音频 | ~$0.5 |
| OpenAI Whisper（备用） | ~50次精确转写/月 | $0.006/分钟 | ~$0.1 |
| **合计** | | | **~$5-7/月/孩子** |

### 12.2 基础设施成本（固定）

| 服务 | 方案 | 月成本 |
|------|------|--------|
| Vercel | Hobby（个人使用免费） | $0 |
| Railway | Starter $5/月 | $5 |
| Supabase | Free Tier（500MB够用） | $0 |
| Upstash Redis | Free Tier | $0 |
| **合计** | | **~$5/月** |

### 12.3 总结

> 自用（1-2个孩子）：**约 $15-20/月**  
> 若扩展为SaaS：每个付费用户边际成本约 $5-7，定价 $15-20/月可实现盈利

---

## 附录 A：项目文件结构

```
readbuddy/
├── apps/
│   ├── web/                      # Next.js 前端
│   │   ├── app/
│   │   │   ├── (student)/        # 儿童端路由组（含书本管理）
│   │   │   │   ├── page.tsx      # 首页（选择章节）
│   │   │   │   ├── books/
│   │   │   │   │   └── setup/    # 书本录入界面（最多5章）
│   │   │   │   ├── read/[id]/    # 阅读界面
│   │   │   │   └── practice/     # 练习模块
│   │   │   └── api/              # Next.js API Routes（轻量BFF）
│   │   └── components/
│   │       ├── reader/           # 阅读相关组件
│   │       ├── book-setup/       # 书本录入组件（章节管理、字数统计）
│   │       ├── voice/            # 语音相关组件
│   │       └── chat/             # 对话UI组件
│   │
│   └── api/                      # Fastify 后端（Railway部署）
│       ├── src/
│       │   ├── routes/
│       │   │   ├── chat.ts
│       │   │   ├── tts.ts
│       │   │   ├── assess.ts
│       │   │   └── books.ts      # 含章节数/字数校验中间件
│       │   ├── services/
│       │   │   ├── claude.ts
│       │   │   ├── elevenlabs.ts
│       │   │   ├── azure-speech.ts
│       │   │   └── rag.ts
│       │   └── db/
│       │       └── supabase.ts
│       └── Dockerfile
│
├── packages/
│   ├── shared-types/             # 前后端共享类型定义
│   └── prompts/                  # System Prompt 模板管理
│
├── supabase/
│   └── migrations/               # 数据库迁移脚本
│
└── docs/
    └── design.md                 # 本文档
```

---

## 附录 B：关键技术决策记录（ADR）

### ADR-001：为什么不用Dify等低代码平台

**决策**：自主开发而非低代码平台  
**原因**：Dify等平台对语音I/O的支持有限，且儿童端UI需要高度定制化。自主开发虽然初期成本高，但长期灵活性更好。  
**权衡**：接受更长的初期开发时间（+2-3周）

### ADR-002：为什么Phase 0不用RAG，直接全文注入

**决策**：Phase 0将全书内容放入System Prompt而非RAG  
**原因**：《The Wild Robot》全书约50K词，约70K tokens，在Claude 200K上下文窗口内。省去向量数据库的搭建，快速验证核心体验。  
**权衡**：每次API调用成本略高，但验证阶段调用量小，可接受

### ADR-003：为什么选Web Speech API而非全部用Whisper

**决策**：实时监听用Web Speech API，精确评分用Whisper/Azure  
**原因**：Web Speech API零延迟（本地处理），用户体验好；Whisper更准确但需要网络往返。两者结合取长补短。  
**权衡**：Web Speech API在部分浏览器兼容性有限，需要fallback处理

### ADR-004：MVP阶段为什么取消独立家长管理端

**决策**：MVP不建设家长端，书本录入入口内嵌于儿童端  
**原因**：独立家长端需要角色体系、账号绑定、权限隔离，工程量约占整体的30-40%。MVP阶段最重要的是验证"AI辅导孩子读书"这个核心体验，家长端功能不影响核心验证。  
**权衡**：家长无法独立查看学习报告，但可以陪同孩子使用儿童端观察进度  
**恢复路径**：Phase 2增加家长端时，数据库profiles表已预留扩展空间，工作量可控

---

*文档结束 · ReadBuddy v1.1 Design Document — MVP简化版*
