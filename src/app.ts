import * as chokidar from 'chokidar';
import * as fsExtra from 'fs-extra';
import { exit } from 'process';

import config from './config';
import {
  assertExportFSTree,
  convertMarkdownToHTML,
  convertIndividualMarkdownToHTML
} from './processor/convertor';
import {
  fixRelativeLinkReferences,
} from './processor/mappers';
import MD from './utils/markdowner';
import { markdownFiles, toHtmlDomain } from './utils/paths';

const transformationPipeline = [
  fixRelativeLinkReferences,
];

const {
  htmlPath,
  markdownPath,
  shouldWatch,
} = config;

if (!htmlPath || !markdownFiles) {
  console.error('Nothing to do. Check .env.example and create a proper .env file.');
  exit(1);
}

if (!shouldWatch) {
  // delete everything
  assertExportFSTree();
  // generate from current identified files
  convertMarkdownToHTML(MD, transformationPipeline);
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

    convertIndividualMarkdownToHTML(path, MD, transformationPipeline);
  });
}
