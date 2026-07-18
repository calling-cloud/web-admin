# Telephone Admin

[English](README.md) | [中文](README.zh-CN.md)

Telephone Admin is the web management console for Telephone, supporting user login, customer management, call record review, analytics, recording operations, app update configuration, and system administration.

## Overview

This directory contains the admin frontend built on Vben Admin. It connects to the Telephone backend and provides the operational workspace for CRM data, teams, employees, roles, menus, and system settings.

```text
admin/
  apps/web-ele/   Main web application
  packages/       Shared Vben packages
  internal/       Internal build, lint, and tooling packages
  scripts/        Project scripts
```

## Features

- Dashboard overview and trend analytics
- Customer, school, team, and employee management
- Call record search, review, and data operations
- Role and menu administration
- System settings for assignment rules, notifications, captcha, and app updates
- Vben Admin layout, routing, access control, and UI infrastructure

## Requirements

- Node.js `22.18+` or `24+`
- pnpm `11+`
- Telephone Server running and reachable

## Quick Start

```sh
pnpm install
pnpm dev
```

## Commands

```sh
pnpm dev
pnpm build
pnpm check
pnpm lint
pnpm format
```

## Notes

- Keep API contracts aligned with `server`.
- When backend CRUD APIs change, update the corresponding admin views and request types.
- Production builds are generated from `apps/web-ele`.
