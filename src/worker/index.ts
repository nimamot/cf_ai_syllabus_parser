import { Hono } from "hono";
import { coursesRoute } from "./routes/courses";
import { exportRoute } from "./routes/export";
import { parseRoute } from "./routes/parse";

const app = new Hono<{ Bindings: Env }>();

app.get("/api/health", (c) =>
	c.json({ ok: true, timestamp: new Date().toISOString() }),
);

app.route("/api/parse", parseRoute);
app.route("/api/courses", coursesRoute);
app.route("/api/export", exportRoute);

export default app;
