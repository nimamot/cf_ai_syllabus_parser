import { Hono } from "hono";
import { getCourseRecord, listCourses } from "../lib/storage";
import type { Env } from "../types";

export const coursesRoute = new Hono<{ Bindings: Env }>();

coursesRoute.get("/", async (c) => {
	const courses = await listCourses(c.env);
	return c.json({ courses });
});

coursesRoute.get("/:courseId", async (c) => {
	const courseId = c.req.param("courseId");
	const record = await getCourseRecord(c.env, courseId);
	if (!record) {
		return c.json({ error: "Course not found" }, 404);
	}
	return c.json(record);
});
