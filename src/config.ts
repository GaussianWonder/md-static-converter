export default {
  markdownPath: process.env.MARKDOWN_PATH ?? '',
  htmlPath: process.env.HTML_PATH ?? '',
  shouldWatch: process.env.WATCH === 'true' ? true : false,
};
