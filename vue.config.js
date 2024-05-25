const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
  transpileDependencies: true,
});
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

module.exports = {
  configureWebpack: (config) => {
    config.plugins.push(new NodePolyfillPlugin());
  },
  devServer: {
    client: {
      overlay: false,
    },
  },
};
