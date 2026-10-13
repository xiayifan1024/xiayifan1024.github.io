# 个人主页与技术博客

使用 Jekyll + Minimal Mistakes。首页为简历，个人信息暂留空；技术博客位于 `/blog/`，点击标题直接阅读正文。关闭页面动画和过渡。

## 修改内容

- `_pages/resume.md`：填写首页简历，各栏目内有不可见的编辑提示。
- `_config.yml`：修改站点标题、描述和个人资料。
- `_data/navigation.yml`：修改顶部导航。
- `_posts/`：添加文章，文件名使用 `YYYY-MM-DD-title.md`。
- `assets/css/custom.css`：自定义样式。

文章示例：

```markdown
---
title: "文章标题"
tags: [Python]
---

## 内容

正文直接写 Markdown。
```

原 Hexo 两篇文章从 Git 历史恢复为 HTML 文章，保留原始正文和访问地址；新文章直接用 Markdown。原 Academic Pages 模板及示例内容备份在 `_legacy/academicpages/`，不会参与构建或发布。

## 本地预览

安装 Ruby 3.3 和 Bundler 后运行：

```bash
bundle config set --local path vendor/bundle
bundle install
bundle exec jekyll serve
```

访问 `http://localhost:4000`。

## GitHub Pages

在仓库 Settings → Pages → Build and deployment → Source 中选择 GitHub Actions。推送到 `master` 后，`.github/workflows/jekyll.yml` 会构建并发布；拉取请求仅验证构建。

主题文档：https://mmistakes.github.io/minimal-mistakes/docs/quick-start-guide/

## 中英双语简历

- 中文简历：`_pages/resume.md`，访问 `/zh/`。
- 英文简历：`_pages/resume-en.md`，默认首页 `/`；旧地址 `/en/` 自动跳转到首页。
- 两页分别维护，通过顶部导航和正文顶部的语言链接切换。
- `_data/site-text.yml` 控制中英文站点名称、导航辅助文字和页脚文字。
- `_data/navigation.yml` 的 `main` 与 `main_en` 分别控制中英文导航。
- 技术博客共用 `/blog/`，文章保留原语言。
- 两页可共用同一张照片，例如 `/assets/images/profile.jpg`。

个人照片存放在 `assets/images/profile.jpg`，中英文简历共用；更换照片时覆盖该文件即可。
