import { shell } from 'electron';
import { observer } from 'mobx-react-lite';
import SysPath from 'path';
import React from 'react';

import { IconSet } from 'widgets';
import { MenuItem, MenuRadioItem, MenuSubItem } from 'widgets/menus';
import { useStore } from '../../contexts/StoreContext';
import { ClientFile } from '../../entities/File';
import {
  ClientDateSearchCriteria,
  ClientFileSearchCriteria,
  ClientNumberSearchCriteria,
  ClientStringSearchCriteria,
  ClientTagSearchCriteria,
} from '../../entities/SearchCriteria';
import { ClientTag } from '../../entities/Tag';
import { LocationTreeItemRevealer } from '../Outliner/LocationsPanel';
import { TagsTreeItemRevealer } from '../Outliner/TagsPanel/TagsTree';

export const MissingFileMenuItems = observer(() => {
  const { uiStore, fileStore } = useStore();
  return (
    <>
      <MenuItem
        onClick={fileStore.fetchMissingFiles}
        text="打开恢复面板"
        icon={IconSet.WARNING_BROKEN_LINK}
        disabled={fileStore.showsMissingContent}
      />
      <MenuItem onClick={uiStore.openToolbarFileRemover} text="删除" icon={IconSet.DELETE} />
    </>
  );
});

export const FileViewerMenuItems = ({ file }: { file: ClientFile }) => {
  const { uiStore, locationStore } = useStore();

  const handleViewFullSize = () => {
    uiStore.selectFile(file, true);
    uiStore.enableSlideMode();
  };

  const handlePreviewWindow = () => {
    // Only clear selection if file is not already selected
    uiStore.selectFile(file, !uiStore.fileSelection.has(file));
    uiStore.openPreviewWindow();
  };

  const handleSearchSimilar = (
    e: React.MouseEvent,
    crit: ClientFileSearchCriteria | ClientFileSearchCriteria[],
  ) => {
    const crits = Array.isArray(crit) ? crit : [crit];
    if (e.ctrlKey) {
      uiStore.addSearchCriterias(crits);
    } else {
      uiStore.replaceSearchCriterias(crits);
    }
  };

  return (
    <>
      <MenuItem onClick={handleViewFullSize} text="以全尺寸查看" icon={IconSet.SEARCH} />
      <MenuItem onClick={handlePreviewWindow} text="在预览窗口中打开" icon={IconSet.PREVIEW} />
      <MenuItem onClick={uiStore.openToolbarTagPopover} text="打开标签选择器" icon={IconSet.TAG} />
      <MenuSubItem text="搜索相似图片..." icon={IconSet.MORE}>
        <MenuItem
          onClick={(e) =>
            handleSearchSimilar(
              e,
              file.tags.toJSON().map((t) => new ClientTagSearchCriteria('tags', t.id, '包含')),
            )
          }
          text="同标签"
          icon={IconSet.TAG}
        />
        <MenuItem
          onClick={(e) =>
            handleSearchSimilar(
              e,
              new ClientStringSearchCriteria(
                'absolutePath',
                SysPath.dirname(file.absolutePath) + SysPath.sep,
                'startsWith',
              ),
            )
          }
          text="同目录"
          icon={IconSet.FOLDER_CLOSE}
        />
        <MenuItem
          onClick={(e) =>
            handleSearchSimilar(
              e,
              new ClientStringSearchCriteria(
                'absolutePath',
                locationStore.get(file.locationId)!.path + SysPath.sep,
                'startsWith',
              ),
            )
          }
          text="同位置"
        />
        <MenuItem
          onClick={(e) =>
            handleSearchSimilar(
              e,
              new ClientStringSearchCriteria('extension', file.extension, 'equals'),
            )
          }
          text="同文件类型"
          icon={IconSet.FILTER_FILE_TYPE}
        />
        <MenuItem
          onClick={(e) =>
            handleSearchSimilar(e, [
              new ClientNumberSearchCriteria('width', file.width, 'equals'),
              new ClientNumberSearchCriteria('height', file.height, 'equals'),
            ])
          }
          text="同分辨率"
          icon={IconSet.ARROW_RIGHT}
        />
        <MenuItem
          onClick={(e) =>
            handleSearchSimilar(e, new ClientNumberSearchCriteria('size', file.size, 'equals'))
          }
          text="同样文件大小"
          icon={IconSet.FILTER_FILTER_DOWN}
        />
        <MenuItem
          onClick={(e) =>
            handleSearchSimilar(
              e,
              new ClientDateSearchCriteria('dateCreated', file.dateCreated, 'equals'),
            )
          }
          text="同创建日期"
          icon={IconSet.FILTER_DATE}
        />
        <MenuItem
          onClick={(e) =>
            handleSearchSimilar(
              e,
              new ClientDateSearchCriteria('dateModified', file.dateModified, 'equals'),
            )
          }
          text="同修改日期"
        />
      </MenuSubItem>
    </>
  );
};

export const SlideFileViewerMenuItems = observer(({ file }: { file: ClientFile }) => {
  const { uiStore } = useStore();

  const handlePreviewWindow = () => {
    uiStore.selectFile(file, true);
    uiStore.openPreviewWindow();
  };

  return (
    <>
      <MenuItem onClick={handlePreviewWindow} text="在预览窗口中打开" icon={IconSet.PREVIEW} />

      <MenuSubItem text="分辨率选择" icon={IconSet.VIEW_GRID}>
        <MenuRadioItem
          onClick={uiStore.setUpscaleModeSmooth}
          checked={uiStore.upscaleMode === 'smooth'}
          text="平滑"
        />
        <MenuRadioItem
          onClick={uiStore.setUpscaleModePixelated}
          checked={uiStore.upscaleMode === 'pixelated'}
          text="像素化"
        />
      </MenuSubItem>
    </>
  );
});

export const ExternalAppMenuItems = observer(({ file }: { file: ClientFile }) => {
  const { uiStore } = useStore();
  return (
    <>
      <MenuItem
        onClick={() => uiStore.openExternal()}
        text="在外部打开"
        icon={IconSet.OPEN_EXTERNAL}
        disabled={file.isBroken}
      />
      <MenuItem
        onClick={() =>
          LocationTreeItemRevealer.instance.revealSubLocation(file.locationId, file.absolutePath)
        }
        text="在位置中显示"
        icon={IconSet.TREE_LIST}
      />
      <MenuItem
        onClick={() => shell.showItemInFolder(file.absolutePath)}
        text="在资源管理器中显示"
        icon={IconSet.FOLDER_CLOSE}
      />
      <MenuItem onClick={uiStore.openMoveFilesToTrash} text={'删除文件'} icon={IconSet.DELETE} />
    </>
  );
});

export const FileTagMenuItems = observer(({ file, tag }: { file: ClientFile; tag: ClientTag }) => (
  <>
    <MenuItem
      onClick={() => TagsTreeItemRevealer.instance.revealTag(tag)}
      text="在标签面板中显示"
      //Reveal in Tags Panel
      icon={IconSet.TREE_LIST}
      disabled={file.isBroken}
    />
    <MenuItem
      onClick={() => file.removeTag(tag)}
      text="从文件取消分配标签"
      // Unassign Tag from File
      icon={IconSet.TAG_BLANCO}
    />
  </>
));
