import { getFilenameFriendlyFormattedDateTime } from 'common/fmt';
import { shell } from 'electron';
import { observer } from 'mobx-react-lite';
import SysPath from 'path';
import React, { useEffect, useState } from 'react';
import { AppToaster } from 'src/frontend/components/Toaster';
import { RendererMessenger } from 'src/ipc/renderer';
import { Button, ButtonGroup, IconSet } from 'widgets';
import { Callout } from 'widgets/notifications';
import { Alert, DialogButton } from 'widgets/popovers';
import { useStore } from '../../contexts/StoreContext';
import ExternalLink from 'src/frontend/components/ExternalLink';
import FileInput from 'src/frontend/components/FileInput';

export const ImportExport = observer(() => {
  const rootStore = useStore();
  const { fileStore, tagStore, exifTool } = rootStore;
  const [isConfirmingMetadataExport, setConfirmingMetadataExport] = useState(false);
  const [isConfirmingFileImport, setConfirmingFileImport] = useState<{
    path: string;
    info: string;
  }>();
  const [backupDir, setBackupDir] = useState('');
  useEffect(() => {
    RendererMessenger.getDefaultBackupDirectory().then(setBackupDir);
  }, []);

  const handleChooseImportDir = async ([path]: [string, ...string[]]) => {
    try {
      const [numTags, numFiles] = await rootStore.peekDatabaseFile(path);
      setConfirmingFileImport({
        path,
        info: `Backup contains ${numTags} tags (currently ${tagStore.count}) and ${numFiles} images (currently ${fileStore.numTotalFiles}).`,
      });
    } catch (e) {
      console.log(e);
      AppToaster.show({ message: 'Backup file is invalid', timeout: 5000 });
    }
  };

  const handleCreateExport = async () => {
    const formattedDateTime = getFilenameFriendlyFormattedDateTime(new Date());
    const filename = `backup_${formattedDateTime}.json`.replaceAll(':', '-');
    const filepath = SysPath.join(backupDir, filename);
    try {
      await rootStore.backupDatabaseToFile(filepath);
      AppToaster.show({
        message: '成功创建备份！',
        clickAction: { label: '查看', onClick: () => shell.showItemInFolder(filepath) },
        timeout: 5000,
      });
    } catch (e) {
      console.error(e);
      AppToaster.show({
        message: '无法创建备份，请打开开发面板了解更多详细信息',
        clickAction: { label: '查看', onClick: RendererMessenger.toggleDevTools },
        timeout: 5000,
      });
    }
  };

  return (
    <>
      <h3>文件元数据</h3>

      <p>
        此功能适用于在各类软件之间批量导入/导出标签。
        如果您使用Dropbox、Google等服务，可在一台设备中将标签写入文件，在其他设备上读取这些标签。
      </p>
      <Callout icon={IconSet.INFO}>
        用于规范标签元数据的格式。例如当文件包含已分配标签「食品、水果、苹果」时，系统会根据当前选定的分隔符自动生成格式化字符串：
        <pre style={{ display: 'inline' }}>
          {['食品', '水果', '苹果'].join(exifTool.hierarchicalSeparator)}
        </pre>
        .
      </Callout>
      <div className="vstack">
        <label>
          父子级分隔符
          <select
            value={exifTool.hierarchicalSeparator}
            onChange={(e) => exifTool.setHierarchicalSeparator(e.target.value)}
          >
            <option value="|">|</option>
            <option value="/">/</option>
            <option value="\">\</option>
            <option value=":">:</option>
          </select>
        </label>
        {/* TODO: adobe bridge has option to read with multiple separators */}

        <ButtonGroup>
          <Button
            text="从文件元数据导入标签"
            onClick={fileStore.readTagsFromFiles}
            styling="outlined"
          />
          <Button
            text="将标签导出到文件元数据"
            onClick={() => setConfirmingMetadataExport(true)}
            styling="outlined"
          />
          <Alert
            open={isConfirmingMetadataExport}
            title="您确定要用新标签覆盖这些文件的原有标签吗？"
            primaryButtonText="导出"
            onClick={(button) => {
              if (button === DialogButton.PrimaryButton) {
                fileStore.writeTagsToFiles();
              }
              setConfirmingMetadataExport(false);
            }}
          >
            <p>
              <p>
                此操作会将Allusion的标签<strong>覆盖</strong>
                到这些文件中的现有标签。建议在添加新标签前，先导入所有已有标签。
              </p>
            </p>
          </Alert>
        </ButtonGroup>
      </div>

      <h3>将数据库备份为文件</h3>

      <Callout icon={IconSet.INFO}>
        系统每10分钟自动创建一次备份，存储路径为：
        <ExternalLink url={backupDir}>备份目录</ExternalLink>.
      </Callout>
      <ButtonGroup>
        <FileInput
          className="btn-outlined"
          options={{
            properties: ['openFile'],
            filters: [{ extensions: ['json'], name: 'JSON' }],
            defaultPath: backupDir,
          }}
          onChange={handleChooseImportDir}
        >
          {IconSet.IMPORT} 从文件还原数据库
        </FileInput>
        <Button
          text="将数据库备份到文件"
          onClick={handleCreateExport}
          icon={IconSet.OPEN_EXTERNAL}
          styling="outlined"
        />

        <Alert
          open={Boolean(isConfirmingFileImport)}
          title="你确定要从备份文件中读取数据库？"
          primaryButtonText="Import"
          onClick={async (button) => {
            if (isConfirmingFileImport && button === DialogButton.PrimaryButton) {
              AppToaster.show({
                message: 'Restoring database... Allusion will restart',
                timeout: 5000,
              });
              try {
                await rootStore.restoreDatabaseFromFile(isConfirmingFileImport.path);
                RendererMessenger.reload();
              } catch (e) {
                console.error('Could not restore backup', e);
                AppToaster.show({
                  message: 'Restoring database failed!',
                  timeout: 5000,
                });
              }
            }
            setConfirmingFileImport(undefined);
          }}
        >
          <p>
            此操作将<strong>覆盖</strong>
            当前标签层级及所有已分配给图片的标签，建议进行该操作前请先创建备份以避免数据丢失。
          </p>
          <p>{isConfirmingFileImport?.info}</p>
        </Alert>
      </ButtonGroup>
    </>
  );
});
