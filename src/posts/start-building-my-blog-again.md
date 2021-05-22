---
title: 我又又又开始倒腾我的博客了
layout: post.njk
date: 2021-05-22
tags:
- post
- 生活
---

上一个比较正式的博客是 17 年 1 月左右开始动手构建的，当时年轻气盛，就想造轮子，不过当时也想着锻炼下自己的能力，就选择了完全从头开始构建一个自己的博客系统（后端、前端、功能设计和 UI），虽然不是静态博客那种直接基于 Markdown 文件来直接生成博客内容，我也选择了使用 Markdown 来写作，所有文章的源内容都是 Markdown 格式的，最后再渲染成 HTML 展示出来。

技术层面用的都是当时很“时髦”的技术：前后端分离，后端是用 Python 写的，使用了 Flask 框架和 PostgreSQL 数据库，前端是 TypeScript + React + Sass + CSS Modules，代码开源在 [GitHub](https://github.com/iawia002/Diana)，整个博客放在一台阿里云的机器上面。

![](/img/in-post/diana.jpeg)
<p class="text-center text-gray-500">上一代博客的截图</p>

整个博客我还是很满意的，唯一的问题就在文章内容的管理上，和使用 static site generator 构建的博客不同，我的文章是单独存放在线上的 PostgreSQL 数据库中的，备份和维护都很麻烦，完全不如静态博客那样写完直接提交 git 方便，所以现在还是决定换成静态博客，文章和代码都放在 GitHub 上，不用再单独备份了，部署也非常方便，回归本质，不搞那些花里胡哨的东西了。

在网上冲了一圈浪之后，本来打算用 [Track3/hermit](https://github.com/Track3/hermit) 或者 [Huxpro/huxpro.github.io](https://github.com/Huxpro/huxpro.github.io) 来改一下，两个都是非常不错的风格，一个基于 Hugo，一个基于 Jekyll，但后面想起了之前看到过的 [Randy 的博客](https://lutaonan.com)，真的是非常好看的风格，很简洁，又有高级感，然后初步尝试了下这个博客用的 [Eleventy](https://www.11ty.dev) 和 [TailwindCSS](https://tailwindcss.com)，我也挺喜欢的，所以最后就基于 Randy 的 [djyde/blog-2020](https://github.com/djyde/blog-2020) 改出了我现在这个博客，风格基本上没变，配色改成我自己喜欢的颜色，后面可能会再调整一下，功能层面的话增加了[标签](/tags)页面，我自己是很喜欢用标签来管理内容的，所以把这个加上了，然后还有一些很细碎的改动，具体可以看 [iawia002/blog](https://github.com/iawia002/blog) repo 的 commit 记录。

这次绝对是我最后一次折腾博客系统 🤥，这个博客我不保证能经常更新，但是我保证它能一直存在，能一直被访问到。
