# 豆包AI图像生成集成说明

## 功能概述

本次集成将 Demo 项目的豆包AI图像生成功能迁移到 MonadNewProject 中，完全保持了 MonadNewProject 的 UI 风格和设计规范。

## 新增功能

### 1. 豆包图像生成器
- **位置**: 主页面底部，"Operation History"之后
- **功能**:
  - 输入提示词生成AI图像
  - 图像尺寸选择 (1024x1024, 512x512, 256x256)
  - 随机种子设置
  - 自动保存到 MinIO 对象存储
  - 生成历史记录持久化（SQLite）

### 2. API 端点

#### `/api/doubao/generate` (POST)
生成图像并上传到 MinIO

**请求体**:
```json
{
  "prompt": "图像描述",
  "size": "1024x1024",
  "seed": 42
}
```

**响应**:
```json
{
  "success": true,
  "imageUrl": "http://localhost:9100/doubao-images/doubao-xxx.png",
  "originalUrl": "豆包原始URL",
  "fileName": "doubao-xxx.png",
  "duration": 1234,
  "timestamp": 1234567890
}
```

#### `/api/doubao/images` (GET)
获取历史生成记录

**响应**:
```json
{
  "success": true,
  "images": [
    {
      "url": "MinIO URL",
      "prompt": "提示词",
      "timestamp": 1234567890
    }
  ]
}
```

## 文件结构

### 新增文件
```
src/
├── lib/
│   ├── db.ts                          # SQLite数据库操作
│   └── minio.ts                       # MinIO对象存储
├── app/api/doubao/
│   ├── generate/route.ts              # 图像生成API
│   └── images/route.ts                # 历史记录API
└── components/
    └── DoubaoImageGenerator.tsx      # 豆包生成器组件
```

### 修改文件
- `src/app/page.tsx` - 添加 DoubaoImageGenerator 组件
- `.gitignore` - 添加数据库文件忽略
- `package.json` - 添加依赖包

## 环境变量配置

需要在 `.env.local` 中添加以下配置：

```env
# 豆包 API 配置
DOUBAO_API_KEY=cae78a6e-87a1-4490-a1fb-8bf22ed029d5
DOUBAO_API_URL=https://ark.cn-beijing.volces.com/api/v3/images/generations

# MinIO 配置
MINIO_ENDPOINT=localhost
MINIO_PORT=9100
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=doubao-images
MINIO_USE_SSL=false
NEXT_PUBLIC_MINIO_URL=http://localhost:9100
```

## 依赖包

新增的依赖：
- `better-sqlite3` - SQLite 数据库
- `@types/better-sqlite3` - TypeScript 类型定义
- `axios` - HTTP 客户端
- `minio` - MinIO 对象存储客户端

## 启动步骤

### 1. 启动 MinIO (如果还未启动)

使用 Docker:
```bash
docker run -d \
  -p 9100:9000 \
  -p 9101:9001 \
  --name doubao-minio \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  quay.io/minio/minio server /data --console-address ":9001"
```

或使用 Demo 项目的 docker-compose（如果已在运行，跳过此步）。

### 2. 启动应用

```bash
npm run dev
```

访问 http://localhost:3000，向下滚动即可看到"豆包图像生成器"部分。

## UI 风格说明

完全采用 MonadNewProject 的设计规范：
- ✅ Tailwind CSS 样式
- ✅ 圆角卡片设计 (rounded-2xl)
- ✅ 渐变背景 (bg-gradient-to-br from-blue-50 to-indigo-100)
- ✅ 阴影效果 (shadow-lg, shadow-xl)
- ✅ 响应式布局
- ✅ 统一的按钮样式（使用项目现有的 Button 组件）
- ✅ 统一的输入框样式（使用项目现有的 Textarea 组件）
- ✅ 图片预览模态框（复用项目现有的 ImageModal 组件）

## 数据存储

### SQLite 数据库
- **位置**: `data/doubao-images.db`
- **表结构**: doubao_images
  - id (自增主键)
  - prompt (提示词)
  - image_url (豆包原始URL)
  - minio_url (MinIO URL)
  - file_name (文件名)
  - size (图像尺寸)
  - seed (随机种子)
  - created_at (创建时间戳)

### MinIO 对象存储
- **Bucket**: doubao-images
- **访问策略**: 公共读取
- **文件命名**: `doubao-{timestamp}-{random}.png`

## 编译状态

✅ **编译通过** - `npm run build` 成功
- 仅有 2 个 ESLint 警告（关于使用 `<img>` 而非 `<Image />`）
- 这些是警告而非错误，不影响功能

## 如何移除此功能

如果将来需要移除豆包集成功能：

1. 删除新增文件：
   ```bash
   rm -rf src/lib/db.ts src/lib/minio.ts
   rm -rf src/app/api/doubao
   rm -rf src/components/DoubaoImageGenerator.tsx
   ```

2. 从 `src/app/page.tsx` 移除：
   ```typescript
   import { DoubaoImageGenerator } from '@/components/DoubaoImageGenerator'
   // 删除 <DoubaoImageGenerator /> 组件
   ```

3. 卸载依赖：
   ```bash
   npm uninstall better-sqlite3 @types/better-sqlite3 minio
   ```

4. 删除环境变量（.env.local 中的 DOUBAO_ 和 MINIO_ 相关配置）

5. 清理数据库文件：
   ```bash
   rm -rf data/
   ```

## 测试建议

1. 测试图像生成功能
2. 测试历史记录加载
3. 测试图片预览模态框
4. 测试响应式布局（移动端、平板、桌面）
5. 确认与现有 NFT mint 功能无冲突

## Git 分支

功能已提交到分支: `feature/ai-image-generation`

```bash
# 切换到功能分支
git checkout feature/ai-image-generation

# 合并到主分支（确认测试通过后）
git checkout main
git merge feature/ai-image-generation
```

## 注意事项

- 豆包 API 需要有效的 API Key
- MinIO 必须运行在 localhost:9100
- 数据库文件会自动创建，无需手动初始化
- 首次访问会自动创建 MinIO bucket 并设置公共读取策略

---

Created: 2025-11-29
Branch: feature/ai-image-generation
Commit: ef456db
