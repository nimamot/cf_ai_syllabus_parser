import type { Assignment, CourseRecord } from "../types";

const PROD_ID = "-//cf-ai-syllabus-parser//Cloudflare Internship//EN";

export function buildIcs(record: CourseRecord): string {
	const lines = [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		`PRODID:${PROD_ID}`,
		"CALSCALE:GREGORIAN",
	];

	record.assignments.forEach((assignment, index) => {
		const date = normalizeDate(assignment.dueDate);
		if (!date) return;

		const uid = `${record.courseId}-${index}@cf-ai-syllabus-parser`;
		const summary = escapeText(assignment.title || "Untitled assignment");
		const description = escapeText(assignment.description ?? "");

		lines.push("BEGIN:VEVENT");
		lines.push(`UID:${uid}`);
		lines.push(`DTSTAMP:${formatDateAsUtc(new Date())}`);
		lines.push(`SUMMARY:${summary}`);
		lines.push(`DESCRIPTION:${description}`);
		lines.push(`DTSTART;VALUE=DATE:${date}`);
		lines.push(`DTEND;VALUE=DATE:${incrementDate(date)}`);
		lines.push("END:VEVENT");
	});

	lines.push("END:VCALENDAR");

	return lines.join("\r\n");
}

function normalizeDate(input: string): string | null {
	if (!input) return null;
	const match = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!match) return null;
	return `${match[1]}${match[2]}${match[3]}`;
}

function incrementDate(date: string): string {
	const year = Number.parseInt(date.slice(0, 4), 10);
	const month = Number.parseInt(date.slice(4, 6), 10) - 1;
	const day = Number.parseInt(date.slice(6, 8), 10);
	const dt = new Date(Date.UTC(year, month, day));
	dt.setUTCDate(dt.getUTCDate() + 1);
	return `${dt.getUTCFullYear()}${String(dt.getUTCMonth() + 1).padStart(
		2,
		"0",
	)}${String(dt.getUTCDate()).padStart(2, "0")}`;
}

function escapeText(value: string): string {
	return value
		.replace(/\\/g, "\\\\")
		.replace(/\r\n/g, "\\n")
		.replace(/\n/g, "\\n")
		.replace(/,|;/g, (match) => `\\${match}`);
}

function formatDateAsUtc(value: Date): string {
	return `${value.getUTCFullYear()}${String(value.getUTCMonth() + 1).padStart(
		2,
		"0",
	)}${String(value.getUTCDate()).padStart(2, "0")}T${String(
		value.getUTCHours(),
	).padStart(2, "0")}${String(value.getUTCMinutes()).padStart(2, "0")}${String(
		value.getUTCSeconds(),
	).padStart(2, "0")}Z`;
}

export function buildCsv(assignments: Assignment[]): string {
	const header = "title,due_date,description";
	const rows = assignments.map((assignment) =>
		[
			assignment.title,
			assignment.dueDate,
			assignment.description ?? "",
		].map(csvEscape).join(","),
	);
	return [header, ...rows].join("\n");
}

function csvEscape(value: string): string {
	const sanitized = value.replace(/\r?\n+/g, " ").trim();
	if (sanitized.includes(",") || sanitized.includes('"')) {
		return `"${sanitized.replace(/"/g, '""')}"`;
	}
	return sanitized;
}
