import { observer } from 'mobx-react-lite';
import React, { useCallback } from 'react';

import { IconSet } from 'widgets';
import { MultiSplitPaneProps } from 'widgets/MultiSplit/MultiSplitPane';
import { Toolbar, ToolbarButton } from 'widgets/toolbar';
import { useStore } from '../../../contexts/StoreContext';
import { ClientTagSearchCriteria } from '../../../entities/SearchCriteria';
import { useAction } from '../../../hooks/mobx';
import { comboMatches, getKeyCombo, parseKeyCombo } from '../../../hotkeyParser';
import TagsTree from './TagsTree';

// Tooltip info
const enum TooltipInfo {
  AllImages = '查看图库中的所有图片',
  Untagged = '查看所有未标记的图片',
  Missing = '查看系统上缺失的映像',
}

export const OutlinerActionBar = observer(() => {
  const { fileStore, uiStore } = useStore();

  const handleUntaggedClick = useCallback((e: React.MouseEvent) => {
    if (!e.ctrlKey) {
      fileStore.fetchUntaggedFiles();
      return;
    }
    // With ctrl key pressed, either add/remove a Untagged criteria based on whether it's already there
    const maybeUntaggedCrit = uiStore.searchCriteriaList.find(
      (crit) => crit instanceof ClientTagSearchCriteria && !crit.value,
    );

    if (maybeUntaggedCrit) {
      uiStore.removeSearchCriteria(maybeUntaggedCrit);
    } else {
      uiStore.addSearchCriteria(new ClientTagSearchCriteria('tags'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Toolbar id="actionbar" label="Action Bar" controls="content-view">
      <ToolbarButton
        text={fileStore.numTotalFiles}
        icon={IconSet.MEDIA}
        onClick={fileStore.fetchAllFiles}
        pressed={fileStore.showsAllContent}
        tooltip={TooltipInfo.AllImages}
      />
      <ToolbarButton
        text={fileStore.numUntaggedFiles}
        icon={IconSet.TAG_BLANCO}
        onClick={handleUntaggedClick}
        pressed={fileStore.showsUntaggedContent}
        tooltip={TooltipInfo.Untagged}
      />
      {fileStore.numMissingFiles > 0 && (
        <ToolbarButton
          text={fileStore.numMissingFiles}
          icon={IconSet.WARNING_FILL}
          onClick={fileStore.fetchMissingFiles}
          pressed={fileStore.showsMissingContent}
          tooltip={TooltipInfo.Missing}
        />
      )}
    </Toolbar>
  );
});

const TagsPanel = (props: Partial<MultiSplitPaneProps>) => {
  const { uiStore } = useStore();

  const handleShortcuts = useAction((e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).matches('input')) {
      return;
    }
    const combo = getKeyCombo(e.nativeEvent);
    const matches = (c: string): boolean => {
      return comboMatches(combo, parseKeyCombo(c));
    };
    const { hotkeyMap } = uiStore;
    if (matches(hotkeyMap.全选)) {
      uiStore.selectAllTags();
    } else if (matches(hotkeyMap.取消全选)) {
      uiStore.clearTagSelection();
    }
  });

  return <TagsTree onKeyDown={handleShortcuts} {...props} />;
};

export default TagsPanel;
