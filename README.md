# 🔐 PassDiff

本地密码文档对比与优化工具。纯客户端运行，数据零上传。

## 功能

### 对比模式
上传两个密码 CSV 文件，识别差异：
- **相同** - 两边一致的条目
- **修改** - 同账户密码不同
- **仅A/仅B** - 单边独有的条目

### 合并模式
上传单个 CSV 文件，识别可去重条目：
- 自动发现同域名同密码的重复项
- 支持三种合并策略：根域名 / 保留第一个 / 手动选择
- 单项选择，精确控制合并范围

## 支持格式

| 来源 | 格式 |
|------|------|
| Chrome | `name, url, username, password, note` |
| BitWarden | `login_uri, login_username, login_password, ...` |

## 技术栈

- React 19 + TypeScript + Vite
- PapaParse (CSV 解析)
- 纯 CSS 设计系统

## 运行

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 生产构建
npm run build
```

## 设计原则

- **简约** - 极简界面，聚焦核心功能
- **克制** - 无多余依赖，无复杂配置
- **高效** - 快速操作，即开即用

## 隐私

所有数据处理均在浏览器本地完成，不会上传到任何服务器。
