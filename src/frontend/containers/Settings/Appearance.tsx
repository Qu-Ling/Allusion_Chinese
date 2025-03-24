import { WINDOW_STORAGE_KEY } from 'common/window';
import { shell } from 'electron';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useState } from 'react';
import useCustomTheme from 'src/frontend/hooks/useCustomTheme';
import { RendererMessenger } from 'src/ipc/renderer';
import { Button, IconSet, Radio, RadioGroup, Toggle } from 'widgets';
import { useStore } from '../../contexts/StoreContext';

export const Appearance = observer(() => {
  const { uiStore } = useStore();

  const toggleFullScreen = (value: boolean) => {
    localStorage.setItem(WINDOW_STORAGE_KEY, JSON.stringify({ isFullScreen: value }));
    RendererMessenger.setFullScreen(value);
  };

  return (
    <>
      <h3>主题</h3>

      <div className="vstack">
        <RadioGroup
          orientation="horizontal"
          name="主题颜色"
          value={uiStore.theme}
          onChange={uiStore.setTheme}
        >
          <Radio value="light">浅色模式</Radio>
          <Radio value="dark">深色模式</Radio>
        </RadioGroup>
        <CustomThemePicker />
      </div>

      <h3>显示</h3>

      <div className="vstack">
        <Toggle checked={uiStore.isFullScreen} onChange={toggleFullScreen}>
          全屏显示（隐藏顶部栏）
        </Toggle>
        <Zoom />
        <RadioGroup
          orientation="horizontal"
          name="选择图片样式"
          value={uiStore.upscaleMode}
          onChange={uiStore.setUpscaleMode}
        >
          <Radio value="smooth">光滑</Radio>
          <Radio value="pixelated">像素化</Radio>
        </RadioGroup>
      </div>

      <h3>缩略图</h3>

      <div className="vstack">
        <Toggle
          checked={uiStore.isThumbnailTagOverlayEnabled}
          onChange={uiStore.toggleThumbnailTagOverlay}
        >
          显示已分配的标签
        </Toggle>
        <Toggle
          checked={uiStore.isThumbnailFilenameOverlayEnabled}
          onChange={uiStore.toggleThumbnailFilenameOverlay}
        >
          显示文件名
        </Toggle>
        <Toggle
          checked={uiStore.isThumbnailResolutionOverlayEnabled}
          onChange={uiStore.toggleThumbnailResolutionOverlay}
        >
          显示图片分辨率
        </Toggle>
        <RadioGroup
          orientation="horizontal"
          name="图片展示"
          value={uiStore.thumbnailShape}
          onChange={uiStore.setThumbnailShape}
        >
          <Radio value="square">填充展示框</Radio>
          <Radio value="letterbox">维持长宽比</Radio>
        </RadioGroup>
      </div>
    </>
  );
});

const Zoom = () => {
  const [localZoomFactor, setLocalZoomFactor] = useState(RendererMessenger.getZoomFactor);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = Number(event.target.value);
    setLocalZoomFactor(value);
    RendererMessenger.setZoomFactor(value);
  };

  return (
    <label>
      画廊缩放大小
      <select value={localZoomFactor} onChange={handleChange}>
        <option value={0.5}>50%</option>
        <option value={0.6}>60%</option>
        <option value={0.7}>70%</option>
        <option value={0.8}>80%</option>
        <option value={0.9}>90%</option>
        <option value={1.0}>100%</option>
        <option value={1.1}>110%</option>
        <option value={1.2}>120%</option>
        <option value={1.3}>130%</option>
        <option value={1.4}>140%</option>
        <option value={1.5}>150%</option>
        <option value={1.6}>160%</option>
        <option value={1.7}>170%</option>
        <option value={1.8}>180%</option>
        <option value={1.9}>190%</option>
        <option value={2.0}>200%</option>
      </select>
    </label>
  );
};

const CustomThemePicker = () => {
  const { theme, setTheme, refresh, options, themeDir } = useCustomTheme();

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="hstack">
      <label>
        自定义主题样式
        <select onChange={(e) => setTheme(e.target.value)} defaultValue={theme}>
          {<option value="">None</option>}
          {options.map((file) => (
            <option key={file} value={file}>
              {file.replace('.css', '')}
            </option>
          ))}
        </select>
      </label>
      <Button
        icon={IconSet.FOLDER_CLOSE}
        text="添加"
        onClick={() => shell.openExternal(themeDir)}
        tooltip="打开包含主题文件的目录"
      />
      <Button
        icon={IconSet.RELOAD}
        text="刷新"
        onClick={refresh}
        tooltip="重新加载主题列表和当前主题"
      />
    </div>
  );
};
