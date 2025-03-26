[![Build Status](https://travis-ci.com/allusion-app/Allusion.svg?token=a7yw4czL1Lye2zty617R&branch=master)](https://travis-ci.com/allusion-app/Allusion)

<img alt="Allusion" src="./resources/images/helpcenter/logo-about-helpcenter-dark.jpg" width="250" />

Allusion是一个为艺术家建立的工具，旨在帮助您组织您的**视觉图书馆**-一个包含您的整个参考，灵感和任何其他类型的图像集合的地方。

[阅读更多 关于 Allusion →](https://allusion-app.github.io/)

## 安装

在[发行页](https://github.com/allusion-app/Allusion/releases) 上找到最新版本的 Allusion。
当新版本可用时，应用程序可以自动更新。

## 开发

### 快速入门


您需要安装 [NodeJS](https://nodejs.org/en/download/) 和包管理器（如 [Yarn](https://yarnpkg.com/lang/en/docs/install/)）。然后运行以下命令以开始使用：

1. 运行 'yarn install' 来安装或更新所有必要的依赖项。
2. 运行 'yarn dev' 将项目文件构建到 /build 目录下。这将保持运行，以便在更新时立即构建更改的文件。
3. 在第二个终端中，运行 'yarn start' 以启动应用程序。修改文件后刷新窗口 （Ctrl/Cmd + R） 以加载更新的构建文件。

### 发布版本

可以使用'yarn package'命令构建在“/dist”文件夹中的可安装的可执行文件。

构建是使用 [electron-builder](https://www.electron.build/) 包完成的，并由 'package.json' 文件中的一个部分配置。
在 GitHub 中创建标记时，内部版本会自动发布到 Github 版本。

## 更多信息

从文档到常见问题以及详细开发步骤等，任何相关内容都可以在我们的 [wiki](https://github.com/allusion-app/Allusion/wiki) 中找到。

## 汉化版本

汉化采用的是硬编码汉化，所以可能会产生一些bug，如果有遇到问题可以在问题或讨论中发消息，或者可以发送消息到邮箱x2995924975@163.com进行联系。

后面如果有机会会考虑加入相似图筛选和图片颜色判断的功能。