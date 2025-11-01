import { Hono } from "hono";
import { buildCsv, buildIcs } from "../lib/export";
import { getCourseRecord } from "../lib/storage";
import type { Env } from "../types";

export const exportRoute = new Hono<{ Bindings: Env }>();

exportRoute.get("/:courseId.:format", async (c) => {
	const courseId = c.req.param("courseId");
	const format = c.req.param("format")?.toLowerCase();
	if (!courseId || !format) {
		return c.json({ error: "Invalid export request" }, 400);
	}
	const record = await getCourseRecord(c.env, courseId);
	if (!record) {
		return c.json({ error: "Course not found" }, 404);
	}

	if (record.assignments.length === 0) {
		return c.json(
			{ error: "No assignments available to export for this course." },
			400,
		);
	}

	if (format === "ics") {
		const body = buildIcs(record);
		c.header("Content-Type", "text/calendar; charset=utf-8");
		c.header(
			"Content-Disposition",
			`attachment; filename="${courseId}.ics"`,
		);
		return c.body(body);
	}

	if (format === "csv") {
		const body = buildCsv(record.assignments);
		c.header("Content-Type", "text/csv; charset=utf-8");
		c.header(
			"Content-Disposition",
			`attachment; filename="${courseId}.csv"`,
		);
		return c.body(body);
	}

	return c.json({ error: "Unsupported export format" }, 400);
});
