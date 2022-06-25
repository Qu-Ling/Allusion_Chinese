import { comboMatches, getKeyCombo, parseKeyCombo } from '../hotkeyParser';
import { action, observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useRef } from 'react';
import { Split } from 'widgets/Split';
import { useStore } from '../contexts/StoreContext';
import { TagDnDProvider, DnDAttribute } from '../contexts/TagDnDContext';
import AppToolbar from './AppToolbar';
import ContentView from './ContentView';
import Outliner from './Outliner';
import { useAction } from '../hooks/mobx';
import { ContextMenuLayer } from 'widgets/menus';

const Main = () => {
  const { fileStore, uiStore } = useStore();
  const data = useRef(observable({ source: undefined, target: undefined }));

  useEffect(() => {
    const handleDragEnd = action((event: DragEvent) => {
      data.current.source = undefined;
      if (event.target instanceof HTMLElement) {
        event.target.dataset[DnDAttribute.Source] = 'false';
      }
    });

    const handleDrop = action((event: DragEvent) => {
      data.current.target = undefined;
      if (event.target instanceof HTMLElement) {
        event.target.dataset[DnDAttribute.Target] = 'false';
      }
    });

    window.addEventListener('dragend', handleDragEnd, true);
    window.addEventListener('drop', handleDrop, true);

    return () => {
      window.removeEventListener('dragend', handleDragEnd);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  const handleShortcuts = useAction((e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).matches('input')) {
      return;
    }
    const combo = getKeyCombo(e.nativeEvent);
    const matches = (c: string): boolean => {
      return comboMatches(combo, parseKeyCombo(c));
    };

    const { hotkeyMap } = uiStore;
    if (matches(hotkeyMap.selectAll)) {
      uiStore.fileSelection.select(...fileStore.fileList);
    } else if (matches(hotkeyMap.deselectAll)) {
      uiStore.fileSelection.clear();
    } else if (matches(hotkeyMap.openTagEditor)) {
      e.preventDefault();
      uiStore.openToolbarTagPopover();
    } else if (matches(hotkeyMap.deleteSelection)) {
      uiStore.openMoveFilesToTrash();
    }
  });

  return (
    <ContextMenuLayer>
      <TagDnDProvider value={data.current}>
        <Split
          id="window-splitter"
          primary={<Outliner />}
          secondary={
            <main id="main" onKeyDown={handleShortcuts}>
              <AppToolbar />
              <ContentView />
            </main>
          }
          axis="vertical"
          align="left"
          splitPoint={uiStore.outlinerWidth}
          isExpanded={uiStore.isOutlinerOpen}
          onMove={uiStore.moveOutlinerSplitter}
        />
      </TagDnDProvider>
    </ContextMenuLayer>
  );
};

export default observer(Main);
