# 鱼鱼图床

一个基于 React + Vite 构建的纯静态单页应用，通过浏览器直接与 S3 兼容的对象存储服务通信，实现图片的浏览、上传、管理等功能。

## ✨ 主要功能

- 🖼️ **图片浏览**：以卡片形式展示图片，支持文件夹导航
- 📤 **图片上传**：支持批量上传，可选 WebP 格式转换
- 🗑️ **图片管理**：删除、重命名、移动图片
- 🔍 **全屏查看**：支持全屏查看图片，左右切换浏览
- 📋 **批量操作**：批量下载、批量复制 URL、批量删除
- ⚙️ **配置管理**：导入/导出配置，支持多种 S3 兼容服务
- 🎨 **主题切换**：支持浅色/深色主题
- 💾 **智能缓存**：使用 IndexedDB 缓存目录列表和缩略图
- 📱 **响应式设计**：适配桌面和移动设备

## 🚀 快速开始

### 环境要求

- Node.js 16+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 `http://localhost:5173` 查看应用。

### 构建生产版本

```bash
npm run build
```

构建产物将生成在 `dist` 目录下。

### 运行测试

```bash
# 运行所有测试
npm test

# 监听模式运行测试
npm run test:watch
```

## 📦 部署

本项目是纯静态应用，可以部署到任何静态托管服务：

### Vercel

1. 将项目推送到 GitHub
2. 在 Vercel 中导入项目
3. 构建命令：`npm run build`
4. 输出目录：`dist`

### Netlify

1. 将项目推送到 GitHub
2. 在 Netlify 中导入项目
3. 构建命令：`npm run build`
4. 发布目录：`dist`

### Cloudflare Pages

1. 将项目推送到 GitHub
2. 在 Cloudflare Pages 中创建项目
3. 构建命令：`npm run build`
4. 构建输出目录：`dist`

### GitHub Pages

```bash
npm run build
# 将 dist 目录内容推送到 gh-pages 分支
```

### 自托管

将 `dist` 目录部署到任何 Web 服务器（Nginx、Apache 等）。

## ⚙️ S3 配置

### 首次使用

1. 打开应用后，点击右上角的设置按钮（⚙️）
2. 填写 S3 配置信息：
   - **Access Key ID**：访问密钥 ID
   - **Secret Access Key**：访问密钥
   - **Region**：区域（如 `us-east-1`、`auto`）
   - **Endpoint**：端点 URL
   - **Bucket**：存储桶名称
   - **自定义域名**（可选）：用于生成图片访问 URL
3. 点击"测试连接"验证配置
4. 点击"保存"保存配置

### 配置示例

#### Cloudflare R2

```
Access Key ID: your_access_key_id
Secret Access Key: your_secret_access_key
Region: auto
Endpoint: https://your-account-id.r2.cloudflarestorage.com
Bucket: your-bucket-name
自定义域名: https://your-custom-domain.com
```

#### AWS S3

```
Access Key ID: your_access_key_id
Secret Access Key: your_secret_access_key
Region: us-east-1
Endpoint: https://s3.us-east-1.amazonaws.com
Bucket: your-bucket-name
自定义域名: （留空或填写 CloudFront 域名）
```

#### MinIO

```
Access Key ID: minioadmin
Secret Access Key: minioadmin
Region: us-east-1
Endpoint: http://localhost:9000
Bucket: your-bucket-name
自定义域名: http://localhost:9000
```

#### 阿里云 OSS

```
Access Key ID: your_access_key_id
Secret Access Key: your_secret_access_key
Region: oss-cn-hangzhou
Endpoint: https://oss-cn-hangzhou.aliyuncs.com
Bucket: your-bucket-name
自定义域名: https://your-bucket-name.oss-cn-hangzhou.aliyuncs.com
```

#### 腾讯云 COS

```
Access Key ID: your_secret_id
Secret Access Key: your_secret_key
Region: ap-guangzhou
Endpoint: https://cos.ap-guangzhou.myqcloud.com
Bucket: your-bucket-name-appid
自定义域名: https://your-bucket-name-appid.cos.ap-guangzhou.myqcloud.com
```

### 导入/导出配置

- **导出配置**：点击"导出设置"按钮，将配置保存为 JSON 文件
- **导入配置**：点击"导入设置"按钮，选择之前导出的 JSON 文件

## 🔒 CORS 配置要求

为了让浏览器能够直接访问 S3 存储桶，需要配置 CORS（跨域资源共享）策略。

### ⚠️ 重要提示

如果你在控制台看到类似以下的 CORS 错误：
```
Access to image at 'https://your-bucket.r2.dev/image.jpg' from origin 'http://localhost:5173' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

这说明你的 S3 存储桶没有正确配置 CORS，请按照下面的步骤配置。

### Cloudflare R2

在 R2 存储桶设置中添加 CORS 规则：

**开发环境配置**（本地开发）：
```json
[
  {
    "AllowedOrigins": ["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length"],
    "MaxAgeSeconds": 3600
  }
]
```

**生产环境配置**（部署后）：
```json
[
  {
    "AllowedOrigins": ["https://your-domain.com"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length"],
    "MaxAgeSeconds": 3600
  }
]
```

**开发+生产环境配置**（推荐用于测试）：
```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length"],
    "MaxAgeSeconds": 3600
  }
]
```

**配置步骤**：
1. 登录 Cloudflare Dashboard
2. 进入 R2 → 选择你的存储桶
3. 点击"设置"标签
4. 找到"CORS 策略"部分
5. 点击"添加 CORS 策略"
6. 粘贴上面的 JSON 配置
7. 保存设置

### AWS S3

在 S3 存储桶的"权限"选项卡中，编辑 CORS 配置：

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length"],
    "MaxAgeSeconds": 3600
  }
]
```

**配置步骤**：
1. 登录 AWS 控制台
2. 进入 S3 服务
3. 选择你的存储桶
4. 点击"权限"标签
5. 滚动到"跨源资源共享 (CORS)"部分
6. 点击"编辑"
7. 粘贴上面的 JSON 配置
8. 保存更改

### MinIO

使用 MinIO 客户端设置 CORS：

```bash
mc anonymous set-json policy.json myminio/mybucket
```

policy.json 内容：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"AWS": ["*"]},
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": ["arn:aws:s3:::mybucket/*"]
    }
  ]
}
```

### 阿里云 OSS

在 OSS 控制台中配置跨域规则：

1. 登录阿里云 OSS 控制台
2. 选择存储桶
3. 点击"权限管理" → "跨域设置"
4. 点击"创建规则"
5. 配置如下：
   - 来源：`*` 或 `http://localhost:5173`
   - 允许 Methods：`GET, PUT, POST, DELETE, HEAD`
   - 允许 Headers：`*`
   - 暴露 Headers：`ETag, Content-Length`
   - 缓存时间：3600

### 腾讯云 COS

在 COS 控制台中配置跨域访问：

1. 登录腾讯云 COS 控制台
2. 选择存储桶
3. 点击"安全管理" → "跨域访问CORS设置"
4. 点击"添加规则"
5. 配置如下：
   - 来源 Origin：`*` 或 `http://localhost:5173`
   - 操作 Methods：`GET, PUT, POST, DELETE, HEAD`
   - Allow-Headers：`*`
   - Expose-Headers：`ETag, Content-Length`
   - 超时 Max-Age：3600

### 生产环境安全建议

在生产环境中，建议将 `AllowedOrigins` 限制为您的应用域名，而不是使用 `*`：

```json
{
  "AllowedOrigins": ["https://your-app-domain.com", "https://www.your-app-domain.com"]
}
```

这样可以防止其他网站未经授权访问你的存储桶资源。

### 验证 CORS 配置

配置完成后，可以通过以下方式验证：

1. 打开浏览器开发者工具（F12）
2. 切换到"网络"标签
3. 刷新页面
4. 查看图片请求的响应头，应该包含：
   ```
   Access-Control-Allow-Origin: *
   Access-Control-Allow-Methods: GET, PUT, POST, DELETE, HEAD
   ```

如果仍然有 CORS 错误，请：
- 确认 CORS 配置已保存并生效（可能需要几分钟）
- 清除浏览器缓存（Ctrl+Shift+Delete）
- 尝试使用无痕模式
- 检查存储桶的公共访问权限设置
- 查看 `.docs/CORS排查指南.md` 获取详细的排查步骤

**常见问题**：

1. **配置后仍然报错**：等待 5-10 分钟让配置生效，然后清除浏览器缓存
2. **部分图片可以加载**：检查 CORS 配置的 JSON 格式是否正确
3. **本地开发正常，部署后失败**：更新 `AllowedOrigins` 为生产域名

## 📖 使用说明

### 浏览图片

- 点击文件夹进入子目录
- 点击路径栏中的路径段快速导航
- 在非根目录时，点击"返回上一级"返回父目录
- 点击图片卡片全屏查看

### 上传图片

1. 点击右上角的上传按钮（📤）
2. 选择要上传的图片文件（支持多选）
3. 配置上传选项：
   - **格式**：保持原格式或转换为 WebP
   - **路径**：当前目录或自定义路径（支持 `{year}`、`{month}`、`{day}` 变量）
   - **文件名**：保留原文件名或使用 MD5 命名
4. 点击"开始上传"

### 管理图片

#### 单张图片操作

- **下载**：点击图片下方的下载图标
- **复制 URL**：点击复制图标，将图片 URL 复制到剪贴板
- **删除**：点击删除图标，确认后删除
- **重命名**：点击更多按钮，选择"重命名"
- **移动**：点击更多按钮，选择"移动"

#### 批量操作

1. 勾选图片左上角的复选框选中图片
2. 路径栏右侧会显示批量操作按钮
3. 可执行批量下载、批量复制 URL、批量删除

### 主题切换

点击右上角的主题切换按钮（🌙/☀️）在浅色和深色主题之间切换。

## 🛠️ 技术栈

- **构建工具**：Vite
- **UI 框架**：React 18
- **UI 组件库**：Ant Design
- **状态管理**：Zustand
- **S3 客户端**：@aws-sdk/client-s3
- **图片查看**：react-photo-view
- **样式方案**：Tailwind CSS
- **缓存**：IndexedDB (idb)
- **测试**：Vitest + React Testing Library + fast-check

## 📝 开发指南

### 项目结构

```
src/
├── components/          # React 组件
│   ├── Header.tsx      # 标题栏
│   ├── Breadcrumb.tsx  # 路径栏
│   ├── Gallery.tsx     # 内容区
│   ├── ImageCard.tsx   # 图片卡片
│   └── ...
├── services/           # 服务层
│   ├── s3Service.ts    # S3 操作
│   ├── cacheService.ts # 缓存服务
│   ├── imageService.ts # 图片处理
│   └── storageService.ts # 本地存储
├── stores/             # 状态管理
│   ├── configStore.ts  # 配置状态
│   ├── galleryStore.ts # 图库状态
│   └── ...
├── utils/              # 工具函数
├── types/              # TypeScript 类型定义
└── main.tsx           # 应用入口
```

### 添加新功能

1. 在 `src/components` 中创建新组件
2. 在 `src/services` 中添加业务逻辑
3. 在 `src/stores` 中管理状态
4. 编写单元测试和属性测试

### 代码规范

```bash
# 运行 ESLint 检查
npm run lint
```

## 🔐 安全注意事项

1. **凭证存储**：S3 凭证存储在浏览器的 LocalStorage 中，请勿在公共设备上使用
2. **HTTPS**：生产环境建议使用 HTTPS 部署
3. **CORS 配置**：生产环境应限制 CORS 的 AllowedOrigins
4. **访问控制**：建议为应用创建专用的 S3 访问密钥，并限制权限

## 🐛 常见问题

### 无法连接到 S3

- 检查 Endpoint 是否正确
- 确认 Access Key 和 Secret Key 是否有效
- 检查网络连接和防火墙设置
- 确认 CORS 配置是否正确

### 图片无法显示

- 检查存储桶的公共访问权限
- 确认自定义域名配置是否正确
- 检查浏览器控制台的错误信息

### 上传失败

- 检查文件大小是否超过限制
- 确认 S3 凭证是否有写入权限
- 检查存储桶配额是否已满

### 缓存问题

- 在设置中清除缓存
- 或在浏览器开发者工具中清除 IndexedDB

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📮 联系方式

如有问题或建议，请提交 Issue。
