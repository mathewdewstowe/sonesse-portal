module.exports = function(eleventyConfig) {
  // Passthrough copy - static assets
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/css": "css" });
  eleventyConfig.addPassthroughCopy({ "src/js": "js" });
  eleventyConfig.addPassthroughCopy({ "src/_headers": "_headers" });
  eleventyConfig.addPassthroughCopy({ "src/_redirects": "_redirects" });
  eleventyConfig.addPassthroughCopy({ "src/_routes.json": "_routes.json" });
  // Portal is a standalone React SPA — copy as-is, never process as template
  eleventyConfig.ignores.add("src/portal/**");
  eleventyConfig.addPassthroughCopy({ "src/portal": "portal" });

  // Blog posts collection
  eleventyConfig.addCollection("blogPosts", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/blog/posts/*.njk").sort(function(a, b) {
      return a.date - b.date;
    });
  });

  // Date filter
  eleventyConfig.addFilter("date", function(dateObj, format) {
    var d = new Date(dateObj);
    var months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    var shortMonths = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    if (format === "MMMM d, yyyy") {
      return months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
    }
    if (format === "MMM d, yyyy") {
      return shortMonths[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
    }
    return d.toLocaleDateString();
  });

  return {
    dir: {
      input: "src",
      output: "public",
      includes: "_includes",
      data: "_data"
    },
    templateFormats: ["njk"],
    htmlTemplateEngine: false   // Don't process .html through Nunjucks — portal is a React SPA
  };
};
