import { chromeExtensionUrl, firefoxExtensionUrl } from 'common/config';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import ExternalLink from 'src/frontend/components/ExternalLink';
import { RendererMessenger } from 'src/ipc/renderer';
import { IconSet, Toggle } from 'widgets';
import { Callout } from 'widgets/notifications';
import { useStore } from '../../contexts/StoreContext';
import FileInput from 'src/frontend/components/FileInput';

export const BackgroundProcesses = observer(() => {
  const { uiStore, locationStore } = useStore();

  const importDirectory = uiStore.importDirectory;
  const browseImportDirectory = async ([newDir]: [string, ...string[]]) => {
    if (locationStore.locationList.some((loc) => newDir.startsWith(loc.path))) {
      await RendererMessenger.setClipServerImportLocation(newDir);
      uiStore.setImportDirectory(newDir);
    } else {
      alert('Please choose a location or any of its subfolders.');
      return;
    }
  };

  const [isRunInBackground, setRunInBackground] = useState(RendererMessenger.isRunningInBackground);
  const toggleRunInBackground = (value: boolean) => {
    setRunInBackground(value);
    RendererMessenger.setRunInBackground({ isRunInBackground: value });
  };

  const [isClipEnabled, setClipServerEnabled] = useState(RendererMessenger.isClipServerEnabled);
  const toggleClipServer = (value: boolean) => {
    setClipServerEnabled(value);
    RendererMessenger.setClipServerEnabled({ isClipServerRunning: value });
  };

  return (
    <>
      <Toggle checked={isRunInBackground} onChange={toggleRunInBackground}>
        程序在后台运行
      </Toggle>
      <h3>浏览器扩展</h3>
      <Callout icon={IconSet.INFO}>
        您需要先安装浏览器扩展，然后再在{' '}
        <ExternalLink url={chromeExtensionUrl}>谷歌扩展</ExternalLink> 或{' '}
        <ExternalLink url={firefoxExtensionUrl}>火狐扩展</ExternalLink>中启用.
      </Callout>
      <Callout icon={IconSet.INFO}>
        要在 Allusion 关闭时保持浏览器扩展正常工作，您必须启用 程序在后台运行 选项。
      </Callout>
      <Callout icon={IconSet.INFO}>
        要使浏览器扩展正常工作，请选择位于您的<strong>「位置」</strong>的文件夹或其子文件夹 来添加到
        Allusion 中。
      </Callout>
      <Toggle
        checked={isClipEnabled}
        onChange={
          isClipEnabled || importDirectory
            ? toggleClipServer
            : () => alert('Please choose a download directory first.')
        }
      >
        运行浏览器扩展
      </Toggle>
      <div className="filepicker">
        <FileInput
          className="btn-minimal filepicker-input"
          options={{
            properties: ['openDirectory'],
            defaultPath: importDirectory,
          }}
          onChange={browseImportDirectory}
        >
          更改
        </FileInput>
        <h4 className="filepicker-label">下载目录</h4>
        <div className="filepicker-path">{uiStore.importDirectory || 'Not set'}</div>
      </div>
    </>
  );
});
