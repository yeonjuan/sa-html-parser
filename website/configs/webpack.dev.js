const extendsBase = require("./webpack.base");

module.exports = extendsBase({
  mode: "development",
  entry: [
    "react-hot-loader/patch",
    "webpack-dev-server/client?https://localhost.com:3000",
    "./src/index.tsx",
  ],
  devServer: {
    hot: "only",
    historyApiFallback: true,
    port: 3000,
    open: true,
    hot: true,
  },
  devtool: "cheap-module-source-map",
});
