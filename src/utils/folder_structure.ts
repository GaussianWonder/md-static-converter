import * as fsExtra from 'fs-extra';
import * as path from 'path';
import { markdownFiles } from '../utils/paths';
import config from '../config';

const { htmlPath } = config;

export const assertExportFSTree = (): void => {
  // make sure the html folder is empty
  if (!fsExtra.pathExistsSync(htmlPath)) {
    fsExtra.mkdirSync(htmlPath);
  } else {
    fsExtra.emptyDirSync(htmlPath);
  }
  // foreach markdown file, create its coresponding path
  markdownFiles.forEach((file) => {
    const folderPath = path.dirname(file);
    fsExtra.mkdirSync(folderPath, { recursive: true });
  });
};
