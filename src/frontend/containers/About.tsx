import { observer } from 'mobx-react-lite';
import React from 'react';
import PopupWindow from '../components/PopupWindow';
import { useStore } from '../contexts/StoreContext';

import Logo_About from 'resources/images/helpcenter/logo-about-helpcenter-dark.jpg';
import { RendererMessenger } from 'src/ipc/renderer';
import ExternalLink from '../components/ExternalLink';

const About = observer(() => {
  const { uiStore } = useStore();

  if (!uiStore.isAboutOpen) {
    return null;
  }
  return (
    <PopupWindow onClose={uiStore.closeAbout} windowName="about" closeOnEscape>
      <div id="about" className="light">
        <img src={Logo_About} alt="Logo" />
        <small>
          版本 <strong>{RendererMessenger.getVersion()}</strong>
        </small>
        <p>
          此应用程序是由一小群人制作的，他们因对艺术、设计和软件的共同兴趣而聚集在一起。
          <br />
          它是完全<b>免费和开源</b>的！了解更多信息，请访问
        </p>
        <span>
          <ExternalLink url="https://allusion-app.github.io/">allusion-app.github.io</ExternalLink>.
        </span>
        <ul>
          <li>一般信息</li>
          <li>下载最新版本</li>
        </ul>
        <ExternalLink url="https://github.com/allusion-app/Allusion">
          github.com/allusion-app/Allusion
        </ExternalLink>
        <ul>
          <li>🤓 查看源代码</li>
          <li>🐛 提供反馈并报告 bug</li>
          <li>👥 了解如何贡献</li>
        </ul>
        {/* TODO: Licensing info here? */}
      </div>
    </PopupWindow>
  );
});

export default About;
