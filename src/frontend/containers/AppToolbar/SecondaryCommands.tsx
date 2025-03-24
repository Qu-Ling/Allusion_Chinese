import React from 'react';
import { observer } from 'mobx-react-lite';

import { IconSet, KeyCombo } from 'widgets';
import { MenuButton, MenuItem } from 'widgets/menus';
import { RendererMessenger } from 'src/ipc/renderer';
import { useStore } from 'src/frontend/contexts/StoreContext';

const SecondaryCommands = observer(() => {
  const { uiStore } = useStore();
  return (
    <MenuButton
      icon={IconSet.MORE}
      text="More"
      tooltip="更多"
      id="__secondary-menu"
      menuID="__secondary-menu-options"
    >
      <MenuItem
        icon={IconSet.SEARCH_EXTENDED}
        onClick={uiStore.toggleAdvancedSearch}
        text="高级搜索"
        accelerator={<KeyCombo combo={uiStore.hotkeyMap.高级搜索} />}
      />
      <MenuItem
        icon={IconSet.HELPCENTER}
        onClick={uiStore.toggleHelpCenter}
        text="帮助中心"
        accelerator={<KeyCombo combo={uiStore.hotkeyMap.打开帮助中心} />}
      />
      <MenuItem
        icon={IconSet.SETTINGS}
        onClick={uiStore.toggleSettings}
        text="设置"
        accelerator={<KeyCombo combo={uiStore.hotkeyMap.打开设置} />}
      />
      <MenuItem icon={IconSet.RELOAD} onClick={RendererMessenger.checkForUpdates} text="检查更新" />
      <MenuItem icon={IconSet.LOGO} onClick={uiStore.toggleAbout} text="关于" />
    </MenuButton>
  );
});

export default SecondaryCommands;
