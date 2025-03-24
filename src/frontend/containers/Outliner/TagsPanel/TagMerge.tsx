import { action } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';

import { Button, GridCombobox, GridOption, GridOptionCell, IconSet, Tag } from 'widgets';
import { Dialog } from 'widgets/popovers';
import { useStore } from '../../../contexts/StoreContext';
import { ClientTag } from '../../../entities/Tag';

interface TagMergeProps {
  tag: ClientTag;
  onClose: () => void;
}

/** this component is only shown when all tags in the context do not have child-tags */
export const TagMerge = observer(({ tag, onClose }: TagMergeProps) => {
  const { tagStore, uiStore } = useStore();

  const ctxTags = uiStore.getTagContextItems(tag.id);

  const [selectedTag, setSelectedTag] = useState<ClientTag>();

  const mergingWithSelf = ctxTags.some((t) => t.id === selectedTag?.id);

  const merge = () => {
    if (selectedTag !== undefined && !mergingWithSelf) {
      for (const ctxTag of ctxTags) {
        tagStore.merge(ctxTag, selectedTag);
      }
      onClose();
    }
  };

  // const plur = ctxTags.length === 1 ? '' : 's';

  return (
    <Dialog
      open
      title="合并标签"
      icon={IconSet.TAG_GROUP}
      onCancel={onClose}
      describedby="merge-info"
    >
      <p id="merge-info">这会将所选标签的所有标注合并到您在下面选择的标签。</p>
      <form method="dialog" onSubmit={(e) => e.preventDefault()}>
        <fieldset>
          <legend>合并标签</legend>
          <div id="tag-merge-overview">
            <span>将标签：</span>
            <br />
            {ctxTags.map((tag) => (
              <Tag key={tag.id} text={tag.name} color={tag.viewColor} />
            ))}
          </div>

          <br />

          <label htmlFor="tag-merge-picker">合并到：</label>
          <GridCombobox
            textboxId="tag-merge-picker"
            autoFocus
            isSelected={(option: ClientTag, selection: ClientTag | undefined) =>
              option === selection
            }
            value={selectedTag}
            onChange={setSelectedTag}
            data={tagStore.tagList}
            labelFromOption={labelFromOption}
            renderOption={renderTagOption}
            colcount={2}
          />
          {mergingWithSelf && <span className="form-error">您不能将标签与自身合并。</span>}
        </fieldset>

        <fieldset className="dialog-actions">
          <Button
            text="合并"
            styling="filled"
            onClick={merge}
            disabled={selectedTag === undefined || mergingWithSelf}
          />
        </fieldset>
      </form>
    </Dialog>
  );
});

const labelFromOption = action((t: ClientTag) => t.name);

const renderTagOption = action((tag: ClientTag, index: number, selection: boolean) => {
  const id = tag.id;
  const path = tag.path.join(' › ');
  const hint = path.slice(0, Math.max(0, path.length - tag.name.length - 3));

  return (
    <GridOption key={id} rowIndex={index} selected={selection || undefined} tooltip={path}>
      <GridOptionCell id={id} colIndex={1}>
        <span className="combobox-popup-option-icon" style={{ color: tag.viewColor }}>
          {IconSet.TAG}
        </span>
        {tag.name}
      </GridOptionCell>
      <GridOptionCell className="tag-option-hint" id={id + '-hint'} colIndex={2}>
        {hint}
      </GridOptionCell>
    </GridOption>
  );
});
