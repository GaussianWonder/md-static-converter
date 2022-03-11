import * as fsExtra from 'fs-extra';
import * as path from 'path';
import { toHtmlDomain } from '../utils/paths';
import { MarkdownProcessor, MarkdownFiles, createHashFrom } from './convertor';

export const fixRelativeLinkReferences: MarkdownProcessor = ({ path: fpath, hash, content }) => {
  if (MarkdownFiles.has(fpath)) {
    const [originalMDFile, processed] = MarkdownFiles.get(fpath)!;
    // if the hash is identical to the old one, return the processed content
    // every processor should feature this check
    if (originalMDFile && originalMDFile.hash === hash) {
      return { path: fpath, hash, content: processed };
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

        const htmlFilePath = toHtmlDomain(markdownFilePath);

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