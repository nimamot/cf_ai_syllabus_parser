import type { CourseMetadata, CourseRecord, Env } from "../types";

const COURSE_PREFIX = "course:";
const META_PREFIX = "meta:";

function courseKey(courseId: string) {
	return `${COURSE_PREFIX}${courseId}`;
}

function metaKey(courseId: string) {
	return `${META_PREFIX}${courseId}`;
}

export async function saveCourseRecord(
	env: Env,
	record: CourseRecord,
): Promise<void> {
	const { courseId, courseTag, createdAt } = record;
	const metadata: CourseMetadata = { courseId, courseTag, createdAt };

	await Promise.all([
		env.SYLLABUS_KV.put(courseKey(courseId), JSON.stringify(record)),
		env.SYLLABUS_KV.put(metaKey(courseId), JSON.stringify(metadata)),
	]);
}

export async function getCourseRecord(
	env: Env,
	courseId: string,
): Promise<CourseRecord | null> {
	const raw = await env.SYLLABUS_KV.get(courseKey(courseId));
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw) as CourseRecord;
		if (!parsed || typeof parsed !== "object") {
			return null;
		}
		if (!Array.isArray(parsed.assignments)) {
			return null;
		}
		return parsed;
	} catch {
		return null;
	}
}

export async function listCourses(env: Env): Promise<CourseMetadata[]> {
	const list = await env.SYLLABUS_KV.list({ prefix: META_PREFIX });
	const items: CourseMetadata[] = [];

	for (const key of list.keys) {
		const raw = await env.SYLLABUS_KV.get(key.name);
		if (!raw) continue;
		try {
			const metadata = JSON.parse(raw) as CourseMetadata;
			if (metadata?.courseId) {
				items.push(metadata);
			}
		} catch {
			continue;
		}
	}

	return items.sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
	);
}
