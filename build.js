import { join, extname } from "node:path";
import esbuild from "esbuild";
import fg from "fast-glob";

function build() {
  return esbuild
    .build({
      entryPoints: ["src/server.js"],
      bundle: true,
      outdir: "dist",
      platform: "node",
      format: "esm",
      target: "es2020",
      external: ["itty-router", "undici"],
      plugins: [globPlugin({ template: custom })],
      logLevel: "info",
    })
    .catch(() => process.exit(1));
}

function globPlugin({ template = defaultTemplate } = {}) {
  return {
    name: "glob-plugin",
    setup(build) {
      build.onResolve({ filter: /\*/ }, (args) => {
        return {
          path: join(args.resolveDir, args.path),
          namespace: "glob",
          pluginData: {
            resolveDir: args.resolveDir,
          },
        };
      });
      build.onLoad({ filter: /.*/, namespace: "glob" }, async (args) => {
        const files = await fg(args.path);
        const contents = template(files);
        console.log(contents);
        return { contents, resolveDir: args.pluginData.resolveDir };
      });
    },
  };
}

function defaultTemplate(files) {
  let imports = "";
  let modules = "";
  files.forEach((path, i) => {
    imports += `import module${i} from "${path}";\n`;
    modules += `module${i}, `;
  });
  return imports + "\n" + `export default [${modules}];`;
}

function custom(files) {
  let imports = "";
  let modules = "";
  const routesPath = join(process.cwd(), "src", "pages");
  files.forEach((path, i) => {
    imports += `import * as module${i} from "${path}";\n`;
    const localPath = path
      .replace(routesPath, "")
      .replace(extname(path), "")
      .replace(routesPath, "")
      .replace(/\$/g, ":")
      .replace("index", "");
    modules += `["${localPath}", module${i}], `;
  });
  return imports + "\n" + `export default new Map([${modules}]);`;
}

build();
