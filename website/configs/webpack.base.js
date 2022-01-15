const { merge } = require("webpack-merge");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");

module.exports = (config) =>
  merge(
    {
      resolve: {
        extensions: [".js", ".jsx", ".ts", ".tsx"],
      },
      module: {
        rules: [
          {
            test: [/\.jsx?$/, /\.tsx?$/],
            use: ["babel-loader"],
            exclude: /node_modules/,
          },
          {
            test: /\.css$/,
            use: ["style-loader", "css-loader"],
          },
        ],
      },
      entry: "./src/index.tsx",
      plugins: [
        new HtmlWebpackPlugin({ template: "./src/index.html" }),
        new MonacoWebpackPlugin({
          languages: ["html"],
        }),
      ],
    },
    config
  );
