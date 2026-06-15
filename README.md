# 社区健身房次卡管理系统

一个全栈的社区健身房次卡管理系统，支持会员购买次卡、扫码核销入场、预约团课、管理员后台数据统计等功能。

## 技术栈

- **前端**: Vite + React 18 + TypeScript (端口 5173)
- **后端**: Express + TypeScript + better-sqlite3 (端口 3000)
- **认证**: JWT + bcryptjs
- **并发运行**: concurrently

## 功能概览

### 会员端
- 注册/登录
- 购买次卡套餐（10次卡、月卡、季卡）
- 个人中心查看剩余次数和到期时间
- 扫码/输入验证码核销入场
- 浏览团课列表，预约报名
- 候补机制：名额满后排队，取消自动递补
- 查看入场记录和团课参加历史
- 按月统计入场次数

### 管理员端
- 每日入场人数统计
- 团课满座率统计
- 次卡销售统计
- 会员活跃度排行
- 管理团课发布（瑜伽、动感单车、搏击操等）
- 器械维护公告发布

## 快速开始

```bash
# 安装所有依赖
npm run install:all

# 初始化数据库并填入测试数据
npm run seed

# 启动前后端开发服务器
npm run dev
```

前端运行在 http://localhost:5173
后端运行在 http://localhost:3000

## 测试账号

| 角色 | 手机号 | 密码 |
|------|--------|------|
| 管理员 | 13800000001 | admin123 |
| 会员 | 13800000002 | user123 |
| 会员 | 13800000003 | user123 |
| 会员 | 13800000004 | user123 |
| 会员 | 13800000005 | user123 |

## 项目结构

```
wje-178/
├── package.json              # 根配置
├── README.md
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts          # 服务入口
│       ├── db.ts             # 数据库初始化
│       ├── seed.ts           # 测试数据
│       ├── middleware/
│       │   └── auth.ts       # JWT认证中间件
│       ├── routes/
│       │   ├── auth.ts       # 认证路由
│       │   ├── passes.ts     # 次卡路由
│       │   ├── classes.ts    # 团课路由
│       │   ├── checkin.ts    # 核销路由
│       │   └── admin.ts      # 管理员路由
│       └── utils/
│           └── helpers.ts    # 工具函数
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── index.html            # 含所有样式
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── pages/
        │   ├── Login.tsx
        │   ├── Register.tsx
        │   ├── Dashboard.tsx
        │   ├── PassStore.tsx
        │   ├── MyPasses.tsx
        │   ├── GroupClasses.tsx
        │   ├── MyClasses.tsx
        │   ├── Checkin.tsx
        │   ├── History.tsx
        │   ├── AdminDashboard.tsx
        │   ├── AdminClasses.tsx
        │   └── AdminAnnouncements.tsx
        ├── components/
        │   ├── Header.tsx
        │   └── ProtectedRoute.tsx
        └── utils/
            └── api.ts        # API请求工具
```
