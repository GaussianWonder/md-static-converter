import * as fsExtra from 'fs-extra';
import * as path from 'path';
import { markdownFiles } from './paths';
import config from '../config';
import MarkdownIt from 'markdown-it';

const { markdownPath, htmlPath } = config;

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

export const convertMarkdownToHTML = (
  md: MarkdownIt,
): void => {
  markdownFiles.forEach((file) => {
    convertIndividualMarkdownToHTML(file, md);
  });
};

export const convertIndividualMarkdownToHTML = (
  file: string,
  md: MarkdownIt,
): boolean => {
  const fileStats = fsExtra.statSync(file);
  if (fileStats.isFile()) {
    const filePath = path.parse(file);
    const newFileName = filePath.base.replace(filePath.ext, '.html');
    const pathDiff = path.relative(markdownPath, file);
    const htmlFilePath = path.join(
      htmlPath,
      path.dirname(pathDiff),
      newFileName
    );
    if (!fsExtra.existsSync(htmlFilePath)) {
      fsExtra.createFileSync(htmlFilePath);
    }
    fsExtra.writeFileSync(
      htmlFilePath,
      md.render(fsExtra.readFileSync(file, 'utf8')),
    );
    return true;
  }
  return false;
};
