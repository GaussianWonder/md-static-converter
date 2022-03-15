import * as crypto from 'crypto';
import * as fsExtra from 'fs-extra';
import MarkdownIt from 'markdown-it';
import * as pathLib from 'path';
import { toHtmlDomain } from '../utils/paths';

/**
 * A reduced version of MarkdownFile
 */
export interface MarkdownFootprint {
  path: string;
  hash: string;
  content: string;
}

/**
 * Markdown File utils
 */
export default class MarkdownFile {
  private hash: string;
  private path: string;
  private content: string;

  private processed: string;
  private processedHash: string;
  
  constructor(path: string) {
    this.path = path;
    this.content = this.readFileContents();
    this.hash = this.calculateHash();

    this.processed = this.content;
    this.processedHash = this.hash;
  }

  get footprint(): MarkdownFootprint {
    return {
      path: this.path,
      hash: this.hash,
      content: this.content,
    };
  }

  readFileContents(path: string = this.path): string {
    const fileStats = fsExtra.statSync(path);
    if (!fileStats.isFile()) throw new Error(`${path} is not a file!`);

    const filePath = pathLib.parse(path);
    if (filePath.ext !== '.md') throw new Error(`${path} is not a markdown file!`);

    return fsExtra.readFileSync(path, 'utf8');
  }

  calculateHash(content: string = this.content): string {
    const hashSum = crypto.createHash('sha256');
    hashSum.update(content);
    return hashSum.digest('hex');
  }

  equalsFootprint(footprint: MarkdownFootprint): boolean {
    return footprint.hash === this.hash;
  }

  sameAsFootprint(footprint: MarkdownFootprint): boolean {
    return footprint.path === this.path && footprint.hash === this.hash;
  }

  writeHTML(MD: MarkdownIt) {
    const htmlFilePath = toHtmlDomain(this.path);

    if (!fsExtra.existsSync(htmlFilePath)) {
      fsExtra.createFileSync(htmlFilePath);
    }

    fsExtra.writeFileSync(
      htmlFilePath,
      MD.render(this.processed),
    );
  }

  get filePath(): string {
    return this.path;
  }

  get originalHash(): string {
    return this.hash;
  }

  get processedContent(): string {
    return this.processed;
  }

  get isUnchanged(): boolean {
    return this.hash === this.processedHash;
  }

  /**
   * Shorter alias for processedContent
   */
  get md(): string {
    return this.processed;
  }

  set processedContent(processed: string) {
    this.processed = processed;
    this.processedHash = this.calculateHash(this.processed);
  }
}
