import * as fs from 'fs';
import config from '../config';

const { markdownPath } = config;

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

export const markdownFiles = getFiles(markdownPath);
