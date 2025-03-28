import { observer } from 'mobx-react-lite';
import React from 'react';

import { IconSet } from 'widgets';
import { ToolbarButton } from 'widgets/toolbar';
import { FileRemoval } from '../../components/RemovalAlert';
import FileTagEditor from '../../containers/AppToolbar/FileTagEditor';
import { useStore } from '../../contexts/StoreContext';
import { SortCommand, ViewCommand } from './Menus';
import Searchbar from './Searchbar';

const OutlinerToggle = observer(() => {
  const { uiStore } = useStore();

  return (
    <ToolbarButton
      id="outliner-toggle"
      text="Toggle Outliner"
      icon={uiStore.isOutlinerOpen ? IconSet.DOUBLE_CARET : IconSet.MENU_HAMBURGER}
      controls="outliner"
      pressed={uiStore.isOutlinerOpen}
      onClick={uiStore.toggleOutliner}
      tabIndex={0}
    />
  );
});

const PrimaryCommands = observer(() => {
  const { fileStore } = useStore();

  return (
    <>
      <OutlinerToggle />
      <FileSelectionCommand />

      <Searchbar />

      {/* TODO: Put back tag button (or just the T hotkey) */}
      {fileStore.showsMissingContent ? (
        // Only show option to remove selected files in toolbar when viewing missing files */}
        <RemoveFilesPopover />
      ) : (
        // Only show when not viewing missing files (so it is replaced by the Delete button)
        <FileTagEditor />
      )}

      <SortCommand />

      <ViewCommand />
    </>
  );
});

export default PrimaryCommands;

export const SlideModeCommand = observer(() => {
  const { uiStore } = useStore();
  return (
    <>
      <ToolbarButton
        isCollapsible={false}
        icon={IconSet.ARROW_LEFT}
        onClick={uiStore.disableSlideMode}
        text="返回"
        tooltip="返回画廊"
      />

      <div className="spacer" />

      <FileTagEditor />

      <ToolbarButton
        icon={IconSet.INFO}
        onClick={uiStore.toggleInspector}
        checked={uiStore.isInspectorOpen}
        text="切换检查器面板"
        tooltip="查看图片详情"
      />
    </>
  );
});

const FileSelectionCommand = observer(() => {
  const { uiStore, fileStore } = useStore();
  const selectionCount = uiStore.fileSelection.size;
  const fileCount = fileStore.fileList.length;

  const allFilesSelected = fileCount > 0 && selectionCount === fileCount;
  // If everything is selected, deselect all. Else, select all
  const handleToggleSelect = () => {
    selectionCount === fileCount ? uiStore.clearFileSelection() : uiStore.selectAllFiles();
  };

  return (
    <ToolbarButton
      isCollapsible={false}
      icon={allFilesSelected ? IconSet.SELECT_ALL_CHECKED : IconSet.SELECT_ALL}
      onClick={handleToggleSelect}
      pressed={allFilesSelected}
      text={selectionCount}
      tooltip="选择或取消选择所有图像"
      disabled={fileCount === 0}
    />
  );
});

// 删除文件弹出窗口
const RemoveFilesPopover = observer(() => {
  const { uiStore } = useStore();
  return (
    <>
      <ToolbarButton
        icon={IconSet.DELETE}
        disabled={uiStore.fileSelection.size === 0}
        onClick={uiStore.openToolbarFileRemover}
        text="删除"
        tooltip="从库中删除选定的缺失图像"
      />
      <FileRemoval />
    </>
  );
});
