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
  markdownFiles.forEach((file) => convertIndividualMarkdownToHTML(file, md));
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

const createHashFrom = (content: string): string => {
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

const fixRelativeLinkReferences: MarkdownProcessor = ({ path: fpath, hash, content }) => {
  if (MarkdownFiles.has(fpath)) {
    const [prev, rendered] = MarkdownFiles.get(fpath)!;
    // if the hash is identical to the old one, return the processed content
    // every processor should feature this check
    if (prev && prev.hash === hash) {
      return { path: fpath, hash, content: rendered };
    }
  }

  const newContent = content.split(/\n/).map((line) => {
    // check for relative links
    const matches = [...line.matchAll(/\[([\w\s\d]+)\]\(((?:\.\/|\.\.\/)[\w\d./]+)\)/g)];
    if (matches.length === 0) return line;
    let newLine = line;
    matches.forEach((match) => {
      const [ matchedContent, alias, link ] = match;
      if (!matchedContent || !alias || !link) return;

      const pathParse = path.parse(link);
      if (pathParse.ext === '.md') {
        // this is a markdown reference, replace it with html
        const newPath = path.join(path.dirname(link), `${pathParse.name}.html`);
        const newLink = `[${alias}](${newPath})`;
        newLine = newLine.replace(matchedContent, newLink);
      } else {
        // this is some other reference, copy it to htmlPath so the reference is valid
        const markdownFilePath = path.join(path.dirname(fpath), link);
        if (!fsExtra.existsSync(markdownFilePath)) return;

        const pathDiff = path.relative(markdownPath, markdownFilePath);
        const htmlFilePath = path.join(
          htmlPath,
          path.dirname(pathDiff),
          pathParse.base,
        );

        if (!fsExtra.existsSync(htmlFilePath)) {
          fsExtra.createFileSync(htmlFilePath);
        }

        fsExtra.copyFileSync(markdownFilePath, htmlFilePath);
      }
    });
    return newLine;
  }).join('\n');

  return {
    path: fpath,
    hash: createHashFrom(newContent),
    content: newContent,
  };
};

export const convertIndividualMarkdownToHTML = (
  file: string,
  md: MarkdownIt,
): boolean => {
  const fileStats = fsExtra.statSync(file);
  if (fileStats.isFile()) {
    const filePath = path.parse(file);
    if (filePath.ext !== '.md') return false;

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
