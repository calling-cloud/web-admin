# Telephone Admin

[English](README.md) | [中文](README.zh-CN.md)

Telephone 的 Web 管理后台，支持用户登录、客户管理、通话数据查看、统计分析、录音管理、应用更新配置和系统运营管理。

## 概览

本目录是基于 Vben Admin 构建的管理端前端工程，连接 Telephone 后端服务，为 CRM 数据、团队、员工、角色、菜单和系统配置提供统一的运营工作台。

```text
admin/
  apps/web-ele/   主 Web 应用
  packages/       Vben 共享包
  internal/       内部构建、规范和工具包
  scripts/        工程脚本
```

## 核心能力

- 业务概览与趋势统计
- 客户、学校、团队和员工管理
- 通话记录查询、查看与数据操作
- 角色和菜单管理
- 分配规则、通知推送、验证码和 App 更新配置
- Vben Admin 布局、路由、权限和基础 UI 能力

## 环境要求

- Node.js `22.18+` 或 `24+`
- pnpm `11+`
- 可访问的 Telephone Server

## 快速启动

```sh
pnpm install
pnpm dev
```

## 常用命令

```sh
pnpm dev
pnpm build
pnpm check
pnpm lint
pnpm format
```

## 开发说明

- 管理端接口契约需要与 `server` 保持一致。
- 后端 CRUD API 变更后，同步更新对应页面和请求类型。
- 生产构建入口为 `apps/web-ele`。
