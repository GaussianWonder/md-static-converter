import * as fsExtra from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import { markdownFiles, toHtmlDomain } from '../utils/paths';
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
  pipeline: MDPPipeline = [],
): void => {
  markdownFiles.forEach((file) => convertIndividualMarkdownToHTML(file, md, pipeline));
};

export type MarkdownPath = string;
export type MarkdownHash = string;
export type MarkdownContent = string;
export type ProcessedMarkdown = MarkdownContent;

export interface MarkdownFile {
  path: MarkdownPath;
  hash: MarkdownHash;
  content: MarkdownContent;
}

export type MarkdownProcessor = (markdownFile: MarkdownFile) => MarkdownFile;
export type MDPPipeline = MarkdownProcessor[];

export const MarkdownFiles = new Map<MarkdownPath, [MarkdownFile, ProcessedMarkdown]>();

export const createHashFrom = (content: string): string => {
  const hashSum = crypto.createHash('sha256');
  hashSum.update(content);
  return hashSum.digest('hex');
}

export const readMarkdownFile = (path: string): MarkdownFile => {
  const content = fsExtra.readFileSync(path, 'utf8');
  const hash = createHashFrom(content);
  return {
    path,
    hash,
    content,
  };
};

export const convertIndividualMarkdownToHTML = (
  file: string,
  md: MarkdownIt,
  pipeline: MDPPipeline = [],
): boolean => {
  const fileStats = fsExtra.statSync(file);
  if (fileStats.isFile()) {
    const filePath = path.parse(file);
    if (filePath.ext !== '.md') return false;

    const htmlFilePath = toHtmlDomain(file);

    if (!fsExtra.existsSync(htmlFilePath)) {
      fsExtra.createFileSync(htmlFilePath);
    }

    // get the md file
    const initMD = readMarkdownFile(file);
    // process the md file
    const mdFile = pipeline.reduce((current, next) => next(current), initMD);

    // store updates
    MarkdownFiles.set(file, [initMD, mdFile.content]);

    // write html
    fsExtra.writeFileSync(
      htmlFilePath,
      md.render(mdFile.content),
    );

    return true;
  }
  return false;
};
