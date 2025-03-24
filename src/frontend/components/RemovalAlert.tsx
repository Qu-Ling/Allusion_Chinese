import { action } from 'mobx';
import { observer } from 'mobx-react-lite';
import React from 'react';

import { IconSet, Tag } from 'widgets';
import { Alert, DialogButton } from 'widgets/popovers';
import { RendererMessenger } from '../../ipc/renderer';
import { useStore } from '../contexts/StoreContext';
import { ClientLocation, ClientSubLocation } from '../entities/Location';
import { ClientFileSearchItem } from '../entities/SearchItem';
import { ClientTag } from '../entities/Tag';
import { AppToaster } from './Toaster';

interface IRemovalProps<T> {
  object: T;
  onClose: () => void;
}

export const LocationRemoval = (props: IRemovalProps<ClientLocation>) => (
  <RemovalAlert
    open
    title={`是否确实要删除位置: "${props.object.name}"?`}
    information="这将永久删除位置和链接在Allusion中其图像的所有数据"
    onCancel={props.onClose}
    onConfirm={() => {
      props.onClose();
      props.object.delete();
    }}
  />
);

export const SubLocationExclusion = (props: IRemovalProps<ClientSubLocation>) => {
  return (
    <Alert
      open
      title={`确定要屏蔽 "${props.object.name}" 文件夹吗?`}
      icon={IconSet.WARNING}
      type="warning"
      primaryButtonText="Exclude"
      defaultButton={DialogButton.PrimaryButton}
      onClick={(button) => {
        if (button !== DialogButton.CloseButton) {
          props.object.toggleExcluded();
        }
        props.onClose();
      }}
    >
      <p>保存在该文件夹中的图片以及标签都将不可见。</p>
    </Alert>
  );
};

export const TagRemoval = observer((props: IRemovalProps<ClientTag>) => {
  const { uiStore } = useStore();
  const { object } = props;
  const tagsToRemove = Array.from(
    object.isSelected ? uiStore.tagSelection : object.getSubTree(),
    (t) => <Tag key={t.id} text={t.name} color={t.viewColor} />,
  );

  const text = `确定要删除标签: "${object.name}" 吗?`;

  return (
    <RemovalAlert
      open
      title={text}
      information="删除标签或集合将会永久地从Allusion中删除它们。"
      body={
        tagsToRemove.length > 0 && (
          <div id="tag-remove-overview">
            <p>选中的标签有：</p>
            {tagsToRemove}
          </div>
        )
      }
      onCancel={props.onClose}
      onConfirm={() => {
        props.onClose();
        object.isSelected ? uiStore.removeSelectedTags() : props.object.delete();
      }}
    />
  );
});

export const FileRemoval = observer(() => {
  const { fileStore, uiStore } = useStore();
  const selection = uiStore.fileSelection;

  const handleConfirm = action(() => {
    uiStore.closeToolbarFileRemover();
    const files = [];
    for (const file of selection) {
      if (file.isBroken === true) {
        files.push(file);
      }
    }
    fileStore.deleteFiles(files);
  });

  return (
    <RemovalAlert
      open={uiStore.isToolbarFileRemoverOpen}
      title={`你确定要删除这${selection.size}个缺失文件吗?`}
      information="删除文件将永久地从Allusion中删除它们，因此保存在它们上的任何标签都将丢失。 如果您将文件移回其位置，典故将自动检测到它们。"
      body={
        <div className="deletion-confirmation-list">
          {Array.from(selection).map((f) => (
            <div key={f.id}>{f.absolutePath}</div>
          ))}
        </div>
      }
      onCancel={uiStore.closeToolbarFileRemover}
      onConfirm={handleConfirm}
    />
  );
});

// 移动文件到回收站 0层
export const MoveFilesToTrashBin = observer(() => {
  const { fileStore, uiStore } = useStore();
  const selection = uiStore.fileSelection;

  const handleConfirm = action(async () => {
    uiStore.closeMoveFilesToTrash();
    const files = [];
    for (const file of selection) {
      // File deletion used to be possible in renderer process, not in new electron version
      // await shell.trashItem(file.absolutePath);
      // https://github.com/electron/electron/issues/29598
      const error = await RendererMessenger.trashFile(file.absolutePath);
      if (!error) {
        files.push(file);
      } else {
        console.warn('Could not move file to trash', file.absolutePath, error);
      }
    }
    fileStore.deleteFiles(files);
    if (files.length !== selection.size) {
      AppToaster.show({
        message: 'Some files could not be deleted.',
        clickAction: {
          onClick: () => RendererMessenger.toggleDevTools(),
          label: 'More info',
        },
        timeout: 8000,
      });
    }
  });

  // 0层
  return (
    <RemovalAlert
      open={uiStore.isMoveFilesToTrashOpen}
      title={`你确定要删除这${selection.size}个文件吗?`}
      information={'您将能从系统的回收站恢复这些文件，但给文件分配的所有标签在 Allusion 中将丢失。'}
      body={
        <div className="deletion-confirmation-list">
          {Array.from(selection).map((f) => (
            <div key={f.id}>{f.absolutePath}</div>
          ))}
        </div>
      }
      onCancel={uiStore.closeMoveFilesToTrash}
      onConfirm={handleConfirm}
    />
  );
});

export const SavedSearchRemoval = observer((props: IRemovalProps<ClientFileSearchItem>) => {
  const { searchStore } = useStore();
  return (
    <RemovalAlert
      open
      title="搜索项删除"
      information={`是否确实要删除搜索项： "${props.object.name}" 吗?`}
      onCancel={props.onClose}
      onConfirm={() => {
        props.onClose();
        searchStore.remove(props.object);
      }}
    />
  );
});

interface IRemovalAlertProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  information: string;
  primaryButtonText?: string;
  body?: React.ReactNode;
}

// 移除警告
const RemovalAlert = (props: IRemovalAlertProps) => (
  <Alert
    open={props.open}
    title={props.title}
    icon={IconSet.WARNING}
    type="danger"
    primaryButtonText="删除"
    defaultButton={DialogButton.PrimaryButton}
    onClick={(button) =>
      button === DialogButton.CloseButton ? props.onCancel() : props.onConfirm()
    }
  >
    <p>{props.information}</p>
    {props.body}
  </Alert>
);
