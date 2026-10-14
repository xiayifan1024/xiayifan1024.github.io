# 个人主页与技术博客

使用 Jekyll + Minimal Mistakes，英文简历为默认首页。电脑端使用左侧导航，最近博客和文章标签可以点击展开；页面右上角切换中英文简历。全站关闭动画和过渡。

## 内容维护

- `_pages/resume-en.md`：英文简历，地址 `/`。
- `_pages/resume.md`：中文简历，地址 `/zh/`。
- `_posts/`：Markdown 文章，命名为 `YYYY-MM-DD-title.md`。
- `_pages/blog.html`：技术博客列表，地址 `/blog/`。
- `_pages/tags.html`：标签归档，地址 `/tags/`，标签从文章自动生成。
- `_data/navigation.yml`：中英文导航。
- `_data/site-text.yml`：中英文界面文字。
- `_config.yml`：站点信息、文章默认配置和构建设置。
- `assets/css/custom.css`：自定义排版。
- `assets/images/profile.jpg`：中英文简历共用的个人照片。
- `assets/images/logos/`：教育经历的学校标识。
- `assets/images/posts/`：按文章组织的配图。

## 添加文章

新建 `_posts/2026-10-14-example.md`：

```markdown
---
title: "文章标题"
date: 2026-10-14
tags: [Python]
excerpt: "一两句话概括文章内容，用于博客列表摘要。"
render_with_liquid: false
---

## 内容

正文直接写 Markdown。

![图片说明](/assets/images/posts/example/image.png)
```

文章地址统一为 `/blog/文件名中去掉日期的部分/`。`render_with_liquid: false` 可防止代码片段中的模板标记被执行。未来日期的文章不会发布。

## 本地预览

安装 Ruby 3.3 和 Bundler 后运行：

```bash
bundle config set --local path vendor/bundle
bundle install
bundle exec jekyll serve
```

访问 `http://localhost:4000`。正式构建可运行 `bundle exec jekyll build --strict_front_matter`。

## GitHub Pages

仓库 Settings → Pages → Build and deployment → Source 选择 GitHub Actions。推送到 `master` 后，`.github/workflows/jekyll.yml` 构建并发布；拉取请求仅验证构建。

## 历史清理

旧 Hexo 文章已转为 Markdown，保留正文、日期、摘要及当前标签。旧的 `/2019/.../`、`/archives/.../`、`/year-archive/`、`/tags/DL/` 和 `/tags/Hexo/` 兼容地址已移除。

未使用的 Academic Pages 模板备份与上游协作模板已删除，仍可从 Git 历史恢复。简历入口 `/en/`、`/about/` 和 `/cv/` 继续跳转到当前首页。

主题文档：https://mmistakes.github.io/minimal-mistakes/docs/quick-start-guide/
