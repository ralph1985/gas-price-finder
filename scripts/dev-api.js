import http from "node:http";
import handler from "../api/fuel-prices.js";

const PORT = 8787;

function readBody(request) {
  return new Promise((resolve) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk.toString();
    });
    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
}

function createResponse(res) {
  return {
    status(code) {
      res.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      res.setHeader(name, value);
      return this;
    },
    json(payload) {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(payload));
    },
  };
}

const server = http.createServer(async (req, res) => {
  if (req.url !== "/api/fuel-prices") {
    res.statusCode = 404;
    res.end("Not found");
    return;
  }

  const body = await readBody(req);
  const response = createResponse(res);
  await handler(
    {
      method: req.method,
      body,
      headers: req.headers,
    },
    response
  );
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API dev server on http://localhost:${PORT}`);
});
