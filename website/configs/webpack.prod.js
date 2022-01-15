const path = require("path");
const extendsBase = require("./webpack.base");

module.exports = extendsBase({
  mode: "production",
  output: {
    filename: "bundle.[contenthash].min.js",
    path: path.resolve(__dirname, "../dist"),
    publicPath: "/",
  },
});
