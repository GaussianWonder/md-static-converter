import * as fsExtra from 'fs-extra';
import * as path from 'path';
import { MarkdownProcessor } from '.';
import { toHtmlDomain } from '../utils/paths';
import MarkdownFile from './markdown_file';
import { includeMetatags, layoutMetatags, metatagExtract } from './metatag';

export const includeOtherMarkdownFiles: MarkdownProcessor = (mdFile) => {
  metatagExtract(mdFile.md, includeMetatags).forEach((tag) => {
    // TODO
  });
  return mdFile;
}

export const wrapMarkdownInLayout: MarkdownProcessor = (mdFile) => {
  metatagExtract(mdFile.md, layoutMetatags).forEach((tag) => {
    // TODO
  });
  return mdFile;
}

export const fixRelativeLinkReferences: MarkdownProcessor = (mdFile) => {
  mdFile.processedContent = mdFile.md
    .split(/\n/)
    .map((line) => {
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
          const markdownFilePath = path.join(path.dirname(mdFile.filePath), link);
          if (!fsExtra.existsSync(markdownFilePath)) return;

          const htmlFilePath = toHtmlDomain(markdownFilePath);

          if (!fsExtra.existsSync(htmlFilePath)) {
            fsExtra.createFileSync(htmlFilePath);
          }

          fsExtra.copyFileSync(markdownFilePath, htmlFilePath);
        }
      });
      return newLine;
    })
    .join('\n');

  return mdFile;
};
