import * as chokidar from 'chokidar';
import * as fsExtra from 'fs-extra';
import { exit } from 'process';

import config from './config';
import {
  assertExportFSTree,
} from './utils/folder_structure';
import {
  fixRelativeLinkReferences, includeOtherMarkdownFiles, wrapMarkdownInLayout,
} from './processor/mappers';
import MD from './utils/markdowner';
import { markdownFiles, toHtmlDomain } from './utils/paths';
import Processor from './processor';

const {
  htmlPath,
  markdownPath,
  shouldWatch,
} = config;

if (!htmlPath || !markdownFiles) {
  console.error('Nothing to do. Check .env.example and create a proper .env file.');
  exit(1);
}

const processor = new Processor(MD, [
  includeOtherMarkdownFiles,
  wrapMarkdownInLayout,
  fixRelativeLinkReferences, // keep this at the end of the pipeline, so it doesn't mess up with other plugins
]);

if (!shouldWatch) {
  // delete everything
  assertExportFSTree();
  const processed = processor.processAll(markdownFiles);
  const success = processor.exportAll(processed);
  success.forEach((val, index) => {
    if (!val) {
      console.error(`Failed at ${markdownFiles[index]}`);
    }
  });
} else {
  // watch everything for changes, generate on the fly
  //* This will fire for the discovery of the files themselves too
  chokidar.watch(markdownPath, {
    persistent: true,
    ignoreInitial: false,
    usePolling: false,
  }).on('all', (event, path) => {
    if (event === 'unlink') {
      const htmlFilePath = toHtmlDomain(path);
      if (fsExtra.pathExistsSync(htmlFilePath)) {
        // TODO linked resources in the md are not deleted
        //! postpone this to some other day, it is not a priority
        fsExtra.unlinkSync(htmlFilePath);
      }
      return;
    }

    const footprint = processor.process(path);
    let success = false;
    if (footprint) {
      success = processor.export(footprint);
    }
    if (!success) {
      console.error(`Failed at ${path}`);
    }
  });
}
