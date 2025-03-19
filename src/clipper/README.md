# Allusion Web裁剪器
'./web-extension' 目录包含我们的 [Chrome 浏览器扩展](https://chrome.google.com/webstore/detail/allusion-web-clipper/gjceheijjnmdfcolopodbopfoaicobna) 和 [FireFox 附加组件](https://addons.mozilla.org/nl/firefox/addon/allusion-web-clipper/) 的源代码

它允许您右键单击任何图像以将其下载到 Allusion 正在观看的磁盘上的位置。
您也可以立即将标签应用于最近下载的映像。

## 发布
在此目录中创建所有文件的zip，不包括此`README.md'档案。
然后可以将其上传到[Chrome开发者控制台](https://chrome.google.com/webstore/devconsole)和[FireFox dev hub](https://addons.mozilla.org/nl/developers/addon/allusion-web-clipper/edit)

## 运行方式
在 'server.ts' 中，我们在端口 '5454' 上托管一个简单的 HTTP 服务器。如果启用了浏览器扩展支持选项，则浏览器扩展可以通过该端口与 Allusion 通信。
此选项是必需的，因为 OS 将提示用户请求允许网络访问。在启动时执行此作而不加解释可能会被解释为恶意。

当图像从浏览器扩展发送到本地服务器时，它将自动导入到 Allusion 中，因为下载目录必须位于监视位置之一（在设置面板中强制执行）。
然后，当应用标签时，可以通过向渲染器进程发送消息，将这些标签自动保存到数据库中的该图像条目中。

当 Allusion 的窗口关闭时，我们无法访问数据库（IndexedDB 只能在浏览器窗口中工作）。通过浏览器扩展应用于图像的任何标签都将被放入队列中（保存到磁盘上的文本文件中），每当再次打开浏览器窗口时，该队列将存储在数据库中。

## 想法/灵感
- [x] 将屏幕截图区域下载为图像：现在支持在 Allusion 本身中粘贴
- [ ] 特定网站（ArtStation、Instagram、Pinterest、Twitter 等）的集成。可以自动将元数据提取为标签

## 待办事项
- [ ] 也可以在 React 中构建扩展，就像 Allusion 本身一样，因此可以使用相同的标签编辑器组件

