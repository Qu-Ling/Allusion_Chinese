import { observer } from 'mobx-react-lite';
import React, { useCallback, useState } from 'react';
import { RendererMessenger } from 'src/ipc/renderer';
import { Toggle } from 'widgets';
import { useStore } from '../../contexts/StoreContext';

export const StartupBehavior = observer(() => {
  const { uiStore } = useStore();

  const [isAutoUpdateEnabled, setAutoUpdateEnabled] = useState(
    RendererMessenger.isCheckUpdatesOnStartupEnabled,
  );

  const toggleAutoUpdate = useCallback(() => {
    RendererMessenger.toggleCheckUpdatesOnStartup();
    setAutoUpdateEnabled((isOn) => !isOn);
  }, []);

  return (
    <div className="vstack">
      <Toggle
        checked={uiStore.isRememberSearchEnabled}
        onChange={uiStore.toggleRememberSearchQuery}
      >
        恢复和查询上次提交的搜索查询
      </Toggle>
      <Toggle checked={isAutoUpdateEnabled} onChange={toggleAutoUpdate}>
        检查更新
      </Toggle>
    </div>
  );
});
