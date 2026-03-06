module.exports = function(eleventyConfig) {
  // Passthrough copy - preserve all existing static assets
  eleventyConfig.addPassthroughCopy({ "src/wp-content": "wp-content" });
  eleventyConfig.addPassthroughCopy({ "src/wp-includes": "wp-includes" });
  eleventyConfig.addPassthroughCopy({ "src/_headers": "_headers" });
  eleventyConfig.addPassthroughCopy({ "src/_redirects": "_redirects" });

  return {
    dir: {
      input: "src",
      output: "public",
      includes: "_includes",
      data: "_data"
    },
    templateFormats: ["njk"],
    htmlTemplateEngine: "njk"
  };
};
