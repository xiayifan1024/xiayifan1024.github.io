---
title: "Hexo+GithubPage搭建个人博客时踩过的坑"
date: 2019-01-05
tags: ["北矿", "杂谈"]
excerpt: "记录使用 Hexo 与 GitHub Pages 搭建个人博客的过程，整理主题选择、Markdown 编辑工具及相关参考资料。"
render_with_liquid: false
---

## 搭建博客初衷

很久之前想正经的写点什么，还记得在QQ空间写过文章，但总是不尽如人意。后来网上冲浪博客盛行，我也申请个新浪账号写过一段时间的博客，但是样式、广告之类的总感觉我的博客不是我的（控制欲hhh），自己建站又没钱没本事。就这样到了大学干过一年多的微信推送新媒体之后，我又开始打起了写博客的主意。正好有一天看到了Hexo+GithubPage建立博客的文章，让我有了一些想法。

写博客的意义是什么？我一直认为只有两件事：记录、分享。而微博、微信等社交平台的出现虽然也是能起到记录与分享的作用，但是对于一些深入的思考分析总是不够尽如人意。代码也好数学公式也好个人思考也好，放在那几英寸的屏幕上总是感觉累，于是就还是考虑用博客吧。

毕竟我也不是大牛，以现在的水平写出来的东西也过于简单与重复，很难起到分享知识的作用，与其说是博客，倒不如说是一些笔记之类的，记录一下自己的学习历程之类的，写一些方法与感想。乐呵乐呵。而且也算是通过写博客加强一下对知识的记忆吧。

## 搭建博客

通过搭建博客你可以学会：Hexo的使用、MarkDown的使用、Git的简单使用等。

对于Hexo的原理推荐一下文章:[Zhao Biao:hexo是怎么工作的](<http://coderunthings.com/2017/08/20/howhexoworks/>)

### 前期搭建

Hexo+GitHubpage建立个人主页的文章网上有很多，实际方法不多赘述，利用Hexo的官方文档以及一些大牛的搭建教程：

Hexo中文文档：[https://hexo.io/zh-cn/docs/](<https://hexo.io/zh-cn/docs/>)（此文档不括前期Node.js和Git安装与配置）

没有 NOde.js 和 Git 使用经历的可以通过百度自行搜寻安装方法以下是我主要参考的两位博主的方法，可以结合使用。

遇见西门：[【持续更新】最全Hexo博客搭建+主题优化+插件配置+常用操作+错误分析](<https://www.simon96.online/2018/10/12/hexo-tutorial/>)（从开始到搭建完成都讲的十分详细，推荐）

Trista222:[结合hexo在GitHub上搭建个人博客——全过程](<https://www.cnblogs.com/trista222/p/8017300.html>)（SSH授权讲的比较详细）

当然这也可以参照官方文档

[git文档](<https://git-scm.com/book/zh/v2>)

### 主题优化

对于主题的选择[Hexo官方主题页](<https://hexo.io/themes/>)有不少，可以进行选择。我目前使用的是 Next 主题，比较傻瓜化而且网上修改教程也多可以推荐没有前端经验的使用。

无论用什么主题也好，请务必阅读该主题的在GitHub上 ReadMe 便于使用和改进。还有在出现问题的时候可以查询 Issue ，有问题的可能不止你一个。

### 关于 MarkDown

MarkDown的教程：网上一搜一大把。  [欧阳锋:最完整的Markdown基础教程](<https://www.jianshu.com/p/335db5716248>)

本地客户端可以使用MarkDownPad2（比较傻瓜）、Atom（神器，但是配置有碍于国内网络问题一些配置会较为麻烦）。

MDP2安装及破解：[张琪Andrea-E:从零开始Markdown——安装MarkdownPad2【已安装完毕 内含注册码】【继续剧透：CSDN就可以直接编啊！！！下毛线！！！】【我也很无奈啊】](<https://blog.csdn.net/sinat_41805381/article/details/79479697>)(注意文末注册码链接以及HTML处理方法)

Atom配置：[随煜而安：使用Atom快速打造好用的Markdown编辑器](<https://blog.csdn.net/u011583927/article/details/78858368>)

#### Hexo Markdown

在git中安装hexo-admin

`$ npm i hexo-admin --save`

安装完成后键入命令

```bash
hexo s http://localhost:4001/admin/
```

可直接利用hexo内置的markdown进行编辑管理

此外，简书、csdn、[cmd Markdown](<https://www.zybuluo.com/mdeditor>)等也都可以进行线上编辑

## 出现的问题及注意

因为是建站好久才写，所以其中辛苦忘了好多，想起多少写多少吧  

1. 注意Git与Nodejs的版本，Hexo对两者有一定的版本支持
2. 在博客根目录下执行Git Bash
3. 博客网址中必须使用你github的用户名，即某用户的用户名为ClearLove7，那么网址必须为ClearLove7.github.io
4. 空格**特别敏感**，在配置中请务必注意空格问题，如在`tag: Hexo`中冒号后存在空格。在配置文件及文章中忽视此问题可能会导致页面错误、文章无法上传、格式错误等错误。
5. Next6可能会存在 PageBuildFailure 的问题。考虑主题配置文件中的 ‘override’ 改成 ‘ture’。
6. 注意文件路径，如头像图片为在`F:\\blog\\source\\assets\\img\\xxx.jpg`其中 `blog` 为根目录，则在配置头像图片时注意为`/assets/img/xxx.jpg`
