/* eslint-disable @typescript-eslint/ban-ts-comment */
import MarkdownIt from 'markdown-it';
// @ts-ignore
import mdSub from 'markdown-it-sub';
// @ts-ignore
import mdSup from 'markdown-it-sup';

export default new MarkdownIt({
  html:         true,        // Enable HTML tags in source
  xhtmlOut:     true,        // Use '/' to close single tags (<br />).
                              // This is only for full CommonMark compatibility.
  breaks:       true,        // Convert '\n' in paragraphs into <br>

  // Enable some language-neutral replacement + quotes beautification
  // For the full list of replacements, see https://github.com/markdown-it/markdown-it/blob/master/lib/rules_core/replacements.js
  typographer:  false,
})
  .use(mdSub)
  .use(mdSup);

