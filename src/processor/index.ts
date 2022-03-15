import MarkdownIt from "markdown-it";
import MarkdownFile, { MarkdownFootprint } from "./markdown_file";

export type MarkdownProcessor = (markdownFile: MarkdownFile) => MarkdownFile;
export type MDPPipeline = MarkdownProcessor[];

export const pipelineReducer = (current: MarkdownFile, next: MarkdownProcessor) => next(current);

export default class Processor {
  private MD: MarkdownIt;
  private pipeline: MDPPipeline;
  private files: Map<MarkdownFootprint, MarkdownFile>;
  private processingHistory: Set<MarkdownFootprint>;

  constructor(MD: MarkdownIt, pipeline: MDPPipeline) {
    this.MD = MD;
    this.pipeline = pipeline;
    this.files = new Map();
    this.processingHistory = new Set();
  }

  processAll(files: string[]): Set<MarkdownFootprint> {
    return files
      .map((file) => this.process(file))
      .filter((footprint): footprint is MarkdownFootprint => !!footprint)
      .reduce(
        (processed, footprint) => processed.add(footprint),
        new Set<MarkdownFootprint>()
      );
  }

  process(filePath: string): MarkdownFootprint | null {
    try {
      const mdFile = new MarkdownFile(filePath);
      const mdFootprint = mdFile.footprint;

      const processedMd = this.files.get(mdFootprint);
      if (processedMd && processedMd.sameAsFootprint(mdFootprint)) {
        // this file was already processed before
        // this has no changes, we can use the processed result that we already have
        return mdFootprint;
      }

      // otherwise we need to reprocess the file
      if (this.processingHistory.has(mdFootprint)) {
        throw new Error(`Cyclic markdown processing detected for ${mdFootprint.path}!`);
      }

      this.processingHistory.add(mdFootprint);
      const newMdFile = this.pipeline.reduce(pipelineReducer, mdFile);
      this.processingHistory.delete(mdFootprint);

      // TODO statistics, maybe git diffs when debugging

      this.files.set(mdFootprint, newMdFile);

      return mdFootprint;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  exportAll(footprints: Set<MarkdownFootprint>): boolean[] {
    return [...footprints].map((footprint) => this.export(footprint))
  }

  export(footprint: MarkdownFootprint): boolean {
    const processedMd = this.files.get(footprint);
    if (processedMd) {
      processedMd.writeHTML(this.MD);
      return true;
    }
    return false;
  }  
};


