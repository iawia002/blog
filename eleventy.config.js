const pluginRss = require("@11ty/eleventy-plugin-rss");
const pluginSEO = require("eleventy-plugin-seo");
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const dayjs = require("dayjs");

module.exports = (eleventyConfig) => {
  eleventyConfig.setTemplateFormats([
    'md',
    'njk',
  ])

  eleventyConfig.addPlugin(pluginSEO, {
    title: "Xinzhao's Blog",
    author: 'Xinzhao Xu',
    description: "",
    url: 'https://xinzhao.me',
  });

  eleventyConfig.addPlugin(syntaxHighlight, {
    // Change which Eleventy template formats use syntax highlighters
    templateFormats: ["*"], // default

    // e.g. Use syntax highlighters in njk and md Eleventy templates (not liquid)
    // templateFormats: ["njk", "md"],

    // init callback lets you customize Prism
    init: function ({ Prism }) {

    },

    // Added in 3.0, set to true to always wrap lines in `<span class="highlight-line">`
    // The default (false) only wraps when line numbers are passed in.
    alwaysWrapLineHighlights: false,

    // Added in 3.0.2, set to false to opt-out of pre-highlight removal of leading
    // and trailing whitespace
    trim: true,

    // Added in 3.0.4, change the separator between lines (you may want "\n")
    lineSeparator: "<br>",
  });

  eleventyConfig.addNunjucksShortcode('formatDate', (date, format) => {
    if (!format) {
      return dayjs(date).format('YYYY-MM-DD')
    } else {
      return dayjs(date).format(format)
    }
  })

  const markdownIt = require("markdown-it");
  const options = {
    linkify: true,
    html: true
  }
  const markdownItLib = markdownIt(options).use(require('markdown-it-anchor')).use(require('markdown-it-table-of-contents'), {
    includeLevel: [1, 2, 3, 4],
    containerHeaderHtml: `<div class="toc-container-header">索引</div>`
  })
  eleventyConfig.setLibrary('md', markdownItLib)

  eleventyConfig.addPlugin(pluginRss);

  eleventyConfig.addPassthroughCopy("src/img");
  eleventyConfig.addPassthroughCopy("src/assets/index.css");
  eleventyConfig.addPassthroughCopy("src/assets/material.css");
  eleventyConfig.addPassthroughCopy("src/favicon.ico");
  // Eleventy will not add a watch for files or folders that are in .gitignore.
  eleventyConfig.setUseGitIgnore(false);

  eleventyConfig.addFilter("filterTagList", tags => {
    // should match the list in tags.njk
    return (tags || []).filter(tag => ["post"].indexOf(tag) === -1);
  })

  // Create an array of all tags
  eleventyConfig.addCollection("tagList", function (collection) {
    let tagSet = new Set();
    collection.getAll().forEach(item => {
      (item.data.tags || []).forEach(tag => tagSet.add(tag));
    });

    return [...tagSet];
  });
}
