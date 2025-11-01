const SYSTEM_PROMPT = `
You are a scheduling assistant that extracts coursework deadlines from syllabi.

For every assignment, project, exam, quiz, or milestone in the provided syllabus text:
- Determine a concise title (<= 80 characters).
- Determine the due date as a calendar date in the format YYYY-MM-DD. If the syllabus gives only a month or week, convert it to an approximate calendar date using the document's context (e.g., "Week 5 (Sept 30)" -> 2025-09-30). If no specific day can be determined, exclude that item.
- Include a short description (<= 280 characters) summarising the requirement or deliverable.

Return **ONLY** valid JSON. The top-level structure must be an array of objects, with keys:
[
  { "title": string, "due_date": "YYYY-MM-DD", "description": string }
]

Do not include any prose before or after the JSON. Do not wrap the JSON in markdown fences. Exclude entries without concrete dates.`.trim();

export function buildMessages(
	syllabusText: string,
	context: { courseTag?: string },
) {
	const courseTagLine = context.courseTag
		? `Course tag: ${context.courseTag}\n`
		: "";

	const userContent = `${courseTagLine}Syllabus content:\n"""${syllabusText}"""`;

	return [
		{ role: "system", content: SYSTEM_PROMPT },
		{ role: "user", content: userContent },
	] as const;
}
