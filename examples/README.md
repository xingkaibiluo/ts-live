
## 启动 demo

如果想要快速启动 demo，可以按照以下步骤进行：

- 首先运行 `yarn` 安装依赖;
- 然后运行 `yarn start` 启动应用;


## 调试 packages

如果想启动 demo 并调试 `packages` 下的各个包，可以按照以下步骤进行:

- 首先把 `./examples/package.json` 的 `@ts-live/react-previewer` 依赖删除;
- 在 `ts-live` 根目录下运行 `lerna bootstrap` 安装依赖;
- 在 `ts-live` 根目录下运行 `npx gulp watch`;
- 然后进入 `./examples` 目录，运行 `yarn` 安装依赖;
- 如果还没有生成 types 文件，需要先在当前目录下执行 `dts-bundle` 生成 types 文件;
- 然后运行 `yarn start` 启动应用;