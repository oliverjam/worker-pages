import { createServer } from "node:http";
import itty from "itty-router";
import { Request, Response } from "node-fetch";
import routes from "pages/**/*";

const router = itty.Router();

router.all("*", ({ method, url }) => console.log(`${method} ${url}`));

for (const [path, module] of routes) {
  if (module.render) {
    router.get(path, ({ params }) => {
      const loaderProps = module.loader?.({ params });
      return new Response(module.render({ ...loaderProps }), {
        headers: { "content-type": "text/html" },
      });
    });
  }
  if (module.action) {
    router.post(path, (request) => {
      return new Response(module.action({ request }), {
        headers: { "content-type": "text/html" },
      });
    });
  }
  router.all(path, () => {
    return new Response("", { status: 415 });
  });
}

router.all("*", () => {
  return new Response("Not found", {
    status: 404,
    headers: { "content-type": "text/html" },
  });
});

async function handler(nodeReq, nodeRes) {
  const request = await convertRequest(nodeReq);
  const response = await router.handle(request);
  nodeRes.writeHead(response.status, Object.fromEntries(response.headers));
  nodeRes.end(response.body);
}

const server = createServer(handler);

server.listen(3000, () => console.log(`http://localhost:3000`));

async function convertRequest(req) {
  const { headers, method } = req;
  const url = `http://${req.headers.host}${req.url}`;
  let body = null;
  if (method !== "GET" && method !== "HEAD") {
    body = await new Request(url, {
      method,
      headers,
      body: req,
    }).buffer();
  }
  return new Request(url, {
    method,
    headers,
    body,
  });
}
