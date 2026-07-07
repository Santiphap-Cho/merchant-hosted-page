import { app } from "./app.js";

const port = Number(process.env.API_PORT) || 3001;

const server = app.listen(port, () => {
  console.log(`ThaiMark API running on http://localhost:${port}`);
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${port} is already in use. Stop the other process or change API_PORT in .env`,
    );
    process.exit(1);
  }
  throw err;
});
