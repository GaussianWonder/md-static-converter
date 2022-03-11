import * as fsExtra from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
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

export const MarkdownFiles = new Map<MarkdownPath, [MarkdownFile, ProcessedMarkdown]>();

export const readMarkdownFile = (path: string): MarkdownFile => {
  const content = fsExtra.readFileSync(path, 'utf8');
  const hashSum = crypto.createHash('sha256');
  hashSum.update(content);
  const hash = hashSum.digest('hex');
  return {
    path,
    hash,
    content,
  };
};

const fixRelativeLinkReferences: MarkdownProcessor = (mdFile) => {
  const { path: fpath, hash, content } = mdFile;
  if (MarkdownFiles.has(fpath)) {
    const [prev, rendered] = MarkdownFiles.get(fpath)!;
    // if the hash is identical to the old one, return the processed content
    // every processor should feature this check
    if (prev && prev.hash === hash) {
      return { path: fpath, hash, content: rendered };
    }
  }

  const newContent = content.split(/\r?\n/).map((line) => {
    const matches = [...line.matchAll(/\[([\w\s\d]+)\]\(((?:\/|\.\/|#)[\w\d./]+)\)/g)];
    if (matches.length === 0) return line;
    let newLine = line;
    matches.forEach((match) => {
      const pathParse = path.parse(match[2]);
      // TODO this can break if path name includes folder.md.name names
      const newPath = pathParse.ext === '.md' ? match[2].replace('.md', '.html') : match[2];
      newLine = newLine.replace(match[0], `[${match[1]}](${newPath})`);
    });
    return newLine;
  }).join('\n');

  return { path: fpath, hash, content: newContent };
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

    const mdFile = fixRelativeLinkReferences(readMarkdownFile(file));

    fsExtra.writeFileSync(
      htmlFilePath,
      md.render(mdFile.content),
    );
    return true;
  }
  return false;
};
