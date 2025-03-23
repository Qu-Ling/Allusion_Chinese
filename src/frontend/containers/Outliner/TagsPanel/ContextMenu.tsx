import { observer } from 'mobx-react-lite';
import React from 'react';
import { HexColorPicker } from 'react-colorful';

import { IconSet } from 'widgets';
import { Menu, MenuCheckboxItem, MenuDivider, MenuItem, MenuSubItem } from 'widgets/menus';
import { useStore } from '../../../contexts/StoreContext';
import { ClientTagSearchCriteria } from '../../../entities/SearchCriteria';
import { ClientTag } from '../../../entities/Tag';
import { Action, Factory } from './state';

const defaultColorOptions = [
  { title: 'Eminence', color: '#5f3292' },
  { title: 'Indigo', color: '#5642A6' },
  { title: 'Blue Ribbon', color: '#143ef1' },
  { title: 'Azure Radiance', color: '#147df1' },
  { title: 'Aquamarine', color: '#6cdfe3' },
  { title: 'Aero Blue', color: '#bdfce4' },
  { title: 'Golden Fizz', color: '#f7ea3a' },
  { title: 'Goldenrod', color: '#fcd870' },
  { title: 'Christineapprox', color: '#f36a0f' },
  { title: 'Crimson', color: '#ec1335' },
  { title: 'Razzmatazz', color: '#ec125f' },
];

const ColorPickerMenu = observer(({ tag }: { tag: ClientTag }) => {
  const { uiStore } = useStore();

  const handleChange = (color: string) => {
    if (tag.isSelected) {
      uiStore.colorSelectedTagsAndCollections(tag.id, color);
    } else {
      tag.setColor(color);
    }
  };
  const color = tag.color;

  return (
    <>
      {/* Rainbow gradient icon? */}
      <MenuCheckboxItem
        checked={color === 'inherit'}
        text="继承父颜色"
        onClick={() => handleChange(color === 'inherit' ? '' : 'inherit')}
      />
      <MenuSubItem text="选择颜色" icon={IconSet.COLOR}>
        <HexColorPicker color={color || undefined} onChange={handleChange} />
        <button
          key="none"
          aria-label="No Color"
          style={{
            background: 'none',
            border: '1px solid var(--text-color)',
            borderRadius: '100%',
            height: '1rem',
            width: '1rem',
          }}
          onClick={() => handleChange('')}
        />
        {defaultColorOptions.map(({ title, color }) => (
          <button
            key={title}
            aria-label={title}
            style={{
              background: color,
              border: 'none',
              borderRadius: '100%',
              height: '1rem',
              width: '1rem',
            }}
            onClick={() => handleChange(color)}
          />
        ))}
      </MenuSubItem>
    </>
  );
});

interface IContextMenuProps {
  tag: ClientTag;
  dispatch: React.Dispatch<Action>;
  pos: number;
}

export const TagItemContextMenu = observer((props: IContextMenuProps) => {
  const { tag, dispatch, pos } = props;
  const { tagStore, uiStore } = useStore();
  const ctxTags = uiStore.getTagContextItems(tag.id);

  return (
    <Menu>
      <MenuItem
        onClick={() =>
          tagStore
            .create(tag, 'New Tag')
            .then((t) => dispatch(Factory.insertNode(tag.id, t.id)))
            .catch((err) => console.log('Could not create tag', err))
        }
        text="新标签"
        icon={IconSet.TAG_ADD}
      />
      <MenuItem
        onClick={() => dispatch(Factory.enableEditing(tag.id))}
        text="重命名"
        icon={IconSet.EDIT}
      />
      <MenuItem
        icon={!tag.isHidden ? IconSet.HIDDEN : IconSet.PREVIEW}
        text="隐藏标记的图像"
        onClick={tag.toggleHidden}
      />
      <MenuItem
        onClick={() => dispatch(Factory.confirmMerge(tag))}
        text="合并"
        icon={IconSet.TAG_GROUP}
        disabled={ctxTags.some((tag) => tag.subTags.length > 0)}
      />
      <MenuItem
        onClick={() => dispatch(Factory.confirmDeletion(tag))}
        text="删除"
        icon={IconSet.DELETE}
      />
      <MenuDivider />
      <ColorPickerMenu tag={tag} />
      <MenuDivider />
      <MenuItem
        onClick={() =>
          tag.isSelected
            ? uiStore.addTagSelectionToCriteria()
            : uiStore.addSearchCriteria(new ClientTagSearchCriteria('tags', tag.id))
        }
        text="添加一个查询"
        icon={IconSet.SEARCH}
      />
      <MenuItem
        onClick={() =>
          tag.isSelected
            ? uiStore.replaceCriteriaWithTagSelection()
            : uiStore.replaceSearchCriteria(new ClientTagSearchCriteria('tags', tag.id))
        }
        text="替换搜索"
        icon={IconSet.REPLACE}
      />
      <MenuDivider />
      <MenuItem
        onClick={() => tag.parent.insertSubTag(tag, pos - 2)}
        text="上升"
        icon={IconSet.ITEM_MOVE_UP}
        disabled={pos === 1}
      />
      <MenuItem
        onClick={() => tag.parent.insertSubTag(tag, pos + 1)}
        text="下降"
        icon={IconSet.ITEM_MOVE_DOWN}
        disabled={pos === tag.parent.subTags.length}
      />
      {/* TODO: Sort alphanumerically option. Maybe in modal for more options (e.g. all levels or just 1 level) and for previewing without immediately saving */}
    </Menu>
  );
});
