import { exportDB, importDB, peakImportFile } from 'dexie-export-import';
import Dexie, { IndexableType } from 'dexie';
import fse from 'fs-extra';
import { RendererMessenger } from '../ipc/renderer';
import { FileSearchDTO } from '../api/file-search';
import { FileDTO } from '../api/file';
import { ID } from '../api/id';
import { LocationDTO } from '../api/location';
import { ConditionDTO, OrderBy, OrderDirection } from '../api/data-storage-search';
import { TagDTO, ROOT_TAG_ID } from '../api/tag';
import BackupScheduler from './backup-scheduler';
import { dbConfig, DB_NAME } from './config';
import DBRepository, { dbDelete, dbInit } from './db-repository';
import { IDataStorage } from '../api/data-storage';

/**
 * The backend of the application serves as an API, even though it runs on the same machine.
 * This helps code organization by enforcing a clear separation between backend/frontend logic.
 * Whenever we want to change things in the backend, this should have no consequences in the frontend.
 * The backend has access to the database, which is exposed to the frontend through a set of endpoints.
 */
export default class Backend implements IDataStorage {
  private fileRepository: DBRepository<FileDTO>;
  private tagRepository: DBRepository<TagDTO>;
  private locationRepository: DBRepository<LocationDTO>;
  private searchRepository: DBRepository<FileSearchDTO>;
  private db: Dexie;
  private backupScheduler: BackupScheduler;

  private constructor() {
    console.info(`Initializing database "${DB_NAME}"...`);
    // Initialize database tables
    this.db = dbInit(dbConfig, DB_NAME);
    this.fileRepository = new DBRepository('files', this.db);
    this.tagRepository = new DBRepository('tags', this.db);
    this.locationRepository = new DBRepository('locations', this.db);
    this.searchRepository = new DBRepository('searches', this.db);
    this.backupScheduler = new BackupScheduler(this);
  }

  static async init(): Promise<Backend> {
    const backend = new Backend();
    // Create a root tag if it does not exist
    const tagCount = await backend.tagRepository.count();
    if (tagCount === 0) {
      await backend.createTag({
        id: ROOT_TAG_ID,
        name: 'Root',
        dateAdded: new Date(),
        subTags: [],
        color: '',
        isHidden: false,
      });
    }
    return backend;
  }

  async setupBackup(): Promise<void> {
    try {
      await this.backupScheduler.initialize(await RendererMessenger.getDefaultBackupDirectory());
    } catch (e) {
      console.error('Could not initialize backup scheduler', e);
    }
  }

  async fetchTags(): Promise<TagDTO[]> {
    console.info('Backend: Fetching tags...');
    return this.tagRepository.getAll();
  }

  async fetchFiles(order: OrderBy<FileDTO>, fileOrder: OrderDirection): Promise<FileDTO[]> {
    console.info('Backend: Fetching files...');
    return this.fileRepository.getAllOrdered(order, fileOrder);
  }

  async fetchFilesByID(ids: ID[]): Promise<FileDTO[]> {
    console.info('Backend: Fetching files by ID...');
    const files = await this.fileRepository.getByIds(ids);
    return files.filter((f) => f !== undefined) as FileDTO[];
  }

  async fetchFilesByKey(key: keyof FileDTO, value: IndexableType): Promise<FileDTO[]> {
    console.info('Backend: Fetching files by key/value...', { key, value });
    return this.fileRepository.getByKey(key, value);
  }

  async fetchLocations(): Promise<LocationDTO[]> {
    console.info('Backend: Fetching locations...');
    return this.locationRepository.getAllOrdered('dateAdded', OrderDirection.Asc);
  }

  async fetchSearches(): Promise<FileSearchDTO[]> {
    console.info('Backend: Fetching searches...');
    const searches = await this.searchRepository.getAll();
    searches.sort((a, b) => (a.position < b.position ? -1 : Number(a.position > b.position)));
    return searches;
  }

  async searchFiles(
    criteria: ConditionDTO<FileDTO> | [ConditionDTO<FileDTO>, ...ConditionDTO<FileDTO>[]],
    order: OrderBy<FileDTO>,
    fileOrder: OrderDirection,
    matchAny?: boolean,
  ): Promise<FileDTO[]> {
    console.info('Backend: Searching files...', { criteria, matchAny });
    const criterias = Array.isArray(criteria) ? criteria : ([criteria] as [ConditionDTO<FileDTO>]);
    return this.fileRepository.find(criterias, order, fileOrder, matchAny);
  }

  async createTag(tag: TagDTO): Promise<void> {
    console.info('Backend: Creating tag...', tag);
    this.backupScheduler.notifyChange();
    return this.tagRepository.create(tag);
  }

  async createFile(file: FileDTO): Promise<void> {
    console.info('Backend: Creating file...', file);
    return this.fileRepository.create(file);
  }

  async createLocation(location: LocationDTO): Promise<void> {
    console.info('Backend: Create location...', location);
    this.backupScheduler.notifyChange();
    return this.locationRepository.create(location);
  }

  async createSearch(search: FileSearchDTO): Promise<void> {
    console.info('Backend: Create search...', search);
    this.backupScheduler.notifyChange();
    return this.searchRepository.create(search);
  }

  async saveTag(tag: TagDTO): Promise<void> {
    console.info('Backend: Saving tag...', tag);
    this.backupScheduler.notifyChange();
    return this.tagRepository.update(tag);
  }

  async saveFiles(files: FileDTO[]): Promise<void> {
    console.info('Backend: Saving files...', files);
    this.backupScheduler.notifyChange();
    return this.fileRepository.updateMany(files);
  }

  async saveLocation(location: LocationDTO): Promise<void> {
    console.info('Backend: Saving location...', location);
    this.backupScheduler.notifyChange();
    return this.locationRepository.update(location);
  }

  async saveSearch(search: FileSearchDTO): Promise<void> {
    console.info('Backend: Saving search...', search);
    this.backupScheduler.notifyChange();
    return this.searchRepository.update(search);
  }

  async removeTags(tags: ID[]): Promise<void> {
    console.info('Backend: Removing tags...', tags);
    // We have to make sure files tagged with these tags should be untagged
    // Get all files with these tags
    const filesWithTags = await this.fileRepository.findExact({
      key: 'tags',
      value: tags,
      operator: 'contains',
      valueType: 'array',
    });
    const deletedTags = new Set(tags);
    // Remove tags from files
    for (const file of filesWithTags) {
      file.tags = file.tags.filter((t) => !deletedTags.has(t));
    }
    // Update files in db
    await this.saveFiles(filesWithTags);
    // Remove tag from db
    this.backupScheduler.notifyChange();
    return this.tagRepository.removeMany(tags);
  }

  async mergeTags(tagToBeRemoved: ID, tagToMergeWith: ID): Promise<void> {
    console.info('Merging tags', tagToBeRemoved, tagToMergeWith);
    // Replace tag on all files with the tag to be removed
    const filesWithTags = await this.fileRepository.findExact({
      key: 'tags',
      value: [tagToBeRemoved],
      operator: 'contains',
      valueType: 'array',
    });
    for (const file of filesWithTags) {
      // Might contain duplicates if the tag to be merged with was already on the file, so array -> set -> array to remove dupes
      file.tags = Array.from(
        new Set(file.tags.map((t) => (t === tagToBeRemoved ? tagToMergeWith : t))),
      );
    }
    // Update files in db
    await this.saveFiles(filesWithTags);
    // Remove tag from DB
    this.backupScheduler.notifyChange();
    await this.tagRepository.remove(tagToBeRemoved);
  }

  async removeFiles(files: ID[]): Promise<void> {
    console.info('Backend: Removing files...', files);
    this.backupScheduler.notifyChange();
    return this.fileRepository.removeMany(files);
  }

  async removeLocation(location: ID): Promise<void> {
    console.info('Backend: Remove location...', location);
    const filesWithLocation = await this.fileRepository.findExact({
      key: 'locationId',
      value: location,
      operator: 'equals',
      valueType: 'string',
    });
    await this.removeFiles(filesWithLocation.map((f) => f.id));
    this.backupScheduler.notifyChange();
    return this.locationRepository.remove(location);
  }

  async removeSearch(search: ID): Promise<void> {
    console.info('Backend: Removing search...', search);
    this.backupScheduler.notifyChange();
    return this.searchRepository.remove(search);
  }

  async countFiles(): Promise<[fileCount: number, untaggedFileCount: number]> {
    console.info('Get number stats of files...');
    const fileCount = this.fileRepository.count();
    const untaggedFileCount = this.fileRepository.countExact({
      key: 'tags',
      operator: 'contains',
      value: [],
      valueType: 'array',
    });
    return Promise.all([fileCount, untaggedFileCount]);
  }

  // Creates many files at once, and checks for duplicates in the path they are in
  async createFilesFromPath(path: string, files: FileDTO[]): Promise<void> {
    console.info('Backend: Creating files...', path, files);
    // Search for file paths that start with 'path', so those can be filtered out
    const existingFilesInPath = await this.fileRepository.findExact({
      valueType: 'string',
      operator: 'startsWith',
      key: 'absolutePath',
      value: path,
    });
    console.debug('Filtering files...');
    const newFiles = files.filter((file) =>
      existingFilesInPath.every((f) => f.absolutePath !== file.absolutePath),
    );
    console.debug('Creating files...');
    await this.fileRepository.createMany(newFiles);
    console.debug('Done!');
  }

  async clear(): Promise<void> {
    console.info('Clearing database...');
    return dbDelete(DB_NAME);
  }

  async backupToFile(path: string): Promise<void> {
    const blob = await exportDB(this.db, { prettyJson: false });
    // might be nice to zip it and encode as base64 to save space. Keeping it simple for now
    await fse.ensureFile(path);
    await fse.writeFile(path, await blob.text());
  }

  async restoreFromFile(path: string): Promise<void> {
    const buffer = await fse.readFile(path);
    const blob = new Blob([buffer]);
    await this.clear();
    console.log('Importing database backup', path);
    await importDB(blob);
    // There also is "importInto" which as an "clearTablesBeforeImport" option,
    // but that didn't seem to work correctly (files were always re-created after restarting for some reason)
  }

  async peekFile(path: string): Promise<[numTags: number, numFiles: number]> {
    const buffer = await fse.readFile(path);
    const blob = new Blob([buffer]);
    const metadata = await peakImportFile(blob); // heh, they made a typo
    const tagsTable = metadata.data.tables.find((t) => t.name === 'tags');
    const filesTable = metadata.data.tables.find((t) => t.name === 'files');
    if (tagsTable && filesTable) {
      return [tagsTable.rowCount, filesTable.rowCount];
    }
    throw new Error('Database does not contain a table for files and/or tags');
  }
}
