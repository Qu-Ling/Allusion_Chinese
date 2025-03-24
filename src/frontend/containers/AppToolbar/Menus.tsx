import React from 'react';
import { observer } from 'mobx-react-lite';

import { OrderBy, OrderDirection } from 'src/api/data-storage-search';
import { FileDTO } from 'src/api/file';
import { IconSet, KeyCombo } from 'widgets';
import { MenuButton, MenuRadioGroup, MenuRadioItem } from 'widgets/menus';
import { getThumbnailSize } from '../ContentView/utils';
import { MenuDivider, MenuSliderItem } from 'widgets/menus/menu-items';
import { useStore } from 'src/frontend/contexts/StoreContext';

// Tooltip info
const enum Tooltip {
  View = '视图样式',
  Filter = '排序面板',
}

export const SortCommand = () => {
  return (
    <MenuButton
      icon={IconSet.SORT}
      text="Sort"
      tooltip={Tooltip.Filter}
      id="__sort-menu"
      menuID="__sort-options"
    >
      <SortMenuItems />
    </MenuButton>
  );
};

export const ViewCommand = () => {
  return (
    <MenuButton
      icon={IconSet.THUMB_BG}
      text="View"
      tooltip={Tooltip.View}
      id="__layout-menu"
      menuID="__layout-options"
    >
      <LayoutMenuItems />

      <MenuDivider />

      <ThumbnailSizeSliderMenuItem />
    </MenuButton>
  );
};

const sortMenuData: Array<{
  prop: OrderBy<FileDTO>;
  icon: JSX.Element;
  text: string;
  hideDirection?: boolean;
}> = [
  // { prop: 'tags', icon: IconSet.TAG, text: 'Tag' },
  { prop: 'name', icon: IconSet.FILTER_NAME_UP, text: '名称' },
  { prop: 'absolutePath', icon: IconSet.FOLDER_OPEN, text: '路径' },
  { prop: 'extension', icon: IconSet.FILTER_FILE_TYPE, text: '文件类型' },
  { prop: 'size', icon: IconSet.FILTER_FILTER_DOWN, text: '文件大小' },
  { prop: 'dateAdded', icon: IconSet.FILTER_DATE, text: '添加日期' },
  { prop: 'dateModified', icon: IconSet.FILTER_DATE, text: '修改日期' },
  { prop: 'dateCreated', icon: IconSet.FILTER_DATE, text: '创建日期' },
  { prop: 'random', icon: IconSet.RELOAD_COMPACT, text: '随机', hideDirection: true },
];

export const SortMenuItems = observer(() => {
  const { fileStore } = useStore();
  const { orderDirection: fileOrder, orderBy, orderFilesBy, switchOrderDirection } = fileStore;
  const orderIcon = fileOrder === OrderDirection.Desc ? IconSet.ARROW_DOWN : IconSet.ARROW_UP;

  return (
    <MenuRadioGroup>
      {sortMenuData.map(({ prop, icon, text, hideDirection }) => (
        <MenuRadioItem
          key={prop}
          icon={icon}
          text={text}
          checked={orderBy === prop}
          accelerator={orderBy === prop && !hideDirection ? orderIcon : undefined}
          onClick={() => (orderBy === prop ? switchOrderDirection() : orderFilesBy(prop))}
        />
      ))}
    </MenuRadioGroup>
  );
});

const thumbnailSizeOptions = [
  { value: 128 },
  { value: 208, label: '小' },
  { value: 288 },
  { value: 368, label: '中' },
  { value: 448 },
  { value: 528, label: '大' },
  { value: 608 },
];

export const LayoutMenuItems = observer(() => {
  const { uiStore } = useStore();
  return (
    <MenuRadioGroup>
      <MenuRadioItem
        icon={IconSet.VIEW_LIST}
        onClick={uiStore.setMethodList}
        checked={uiStore.isList}
        text="列表"
        accelerator={<KeyCombo combo={uiStore.hotkeyMap.列表视图} />}
      />
      <MenuRadioItem
        icon={IconSet.VIEW_GRID}
        onClick={uiStore.setMethodGrid}
        checked={uiStore.isGrid}
        text="网格"
        accelerator={<KeyCombo combo={uiStore.hotkeyMap.网格视图} />}
      />
      <MenuRadioItem
        icon={IconSet.VIEW_MASONRY_V}
        onClick={uiStore.setMethodMasonryVertical}
        checked={uiStore.isMasonryVertical}
        // TODO: "masonry" might not ring a bell to some people. Suggestions for a better name? "Flow", "Stream"?
        text="宽度一致"
        accelerator={<KeyCombo combo={uiStore.hotkeyMap.宽度一致布局} />}
      />
      <MenuRadioItem
        icon={IconSet.VIEW_MASONRY_H}
        onClick={uiStore.setMethodMasonryHorizontal}
        checked={uiStore.isMasonryHorizontal}
        text="高度一致"
        accelerator={<KeyCombo combo={uiStore.hotkeyMap.高度一致布局} />}
      />
    </MenuRadioGroup>
  );
});

export const ThumbnailSizeSliderMenuItem = observer(() => {
  const { uiStore } = useStore();
  return (
    <MenuSliderItem
      value={getThumbnailSize(uiStore.thumbnailSize)}
      label="缩略图大小"
      onChange={uiStore.setThumbnailSize}
      id="thumbnail-sizes"
      options={thumbnailSizeOptions}
      min={thumbnailSizeOptions[0].value}
      max={thumbnailSizeOptions[thumbnailSizeOptions.length - 1].value}
      step={20}
    />
  );
});
