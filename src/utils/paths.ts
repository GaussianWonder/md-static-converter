import * as fs from 'fs';
import * as path from 'path';
import config from '../config';

const { markdownPath, htmlPath } = config;

export const getFiles = (dir: string, files: string[] = []): string[] => {
  fs.readdirSync(dir).forEach((file) => {
    const name = `${dir}/${file}`;
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, files);
    } else {
      files.push(name);
    }
  });
  return files;
};

// TODO missleading name
export const markdownFiles = getFiles(markdownPath);

export const toHtmlDomain = (src: string): string => {
  const filePath = path.parse(src);
  const pathDiff = path.relative(markdownPath, src);
  return path.join(
    htmlPath,
    path.dirname(pathDiff),
    filePath.ext === '.md' ? `${filePath.name}.html` : filePath.base,
  );
}

