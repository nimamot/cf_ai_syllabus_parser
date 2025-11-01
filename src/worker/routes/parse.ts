import { Hono } from "hono";
import { extractTextFromPdf } from "../lib/pdf";
import { buildMessages } from "../lib/prompt";
import {
	isLikelyPdf,
	normalizeSyllabusText,
	sanitizeCourseTag,
} from "../lib/text";
import { saveCourseRecord } from "../lib/storage";
import type { Assignment, CourseRecord, Env } from "../types";

const MODEL_NAME = "@cf/meta/llama-3.1-8b-instruct";
const textDecoder = new TextDecoder();

export const parseRoute = new Hono<{ Bindings: Env }>();

parseRoute.post("/", async (c) => {
	const formData = await c.req.formData();

	const courseTag = sanitizeCourseTag(formData.get("courseTag") as string | null);
	const textField =
		typeof formData.get("syllabusText") === "string"
			? (formData.get("syllabusText") as string)
			: "";
	const fileField = formData.get("syllabusFile");

	let syllabusText = textField;

	if (fileField instanceof File && fileField.size > 0) {
		const arrayBuffer = await fileField.arrayBuffer();
		if (isLikelyPdf(fileField.name ?? null, fileField.type ?? null)) {
			try {
				syllabusText = await extractTextFromPdf(arrayBuffer);
			} catch (error) {
				const message =
					error instanceof Error ? error.message : String(error);
				console.error("Failed to parse PDF", error);
				return c.json(
					{
						error: `Unable to read the uploaded PDF. Try pasting the text instead. (${message})`,
					},
					400,
				);
			}
		} else {
			syllabusText = textDecoder.decode(arrayBuffer);
		}
	}

	if (!syllabusText.trim()) {
		return c.json(
			{ error: "Provide a syllabus file or paste its text to continue." },
			400,
		);
	}

	const normalized = normalizeSyllabusText(syllabusText);

	const messages = buildMessages(normalized, { courseTag });
	let aiRaw: unknown;
	try {
		aiRaw = await c.env.AI.run(MODEL_NAME, {
			messages,
			max_output_tokens: 1200,
			temperature: 0.1,
		});
	} catch (error) {
		console.error("AI call failed", error);
		const details =
			error instanceof Error
				? error.message
				: typeof error === "string"
					? error
					: JSON.stringify(error);
		return c.json(
			{
				error: `Workers AI is unavailable right now. Please try again. (${details})`,
			},
			502,
		);
	}

	const aiText = extractModelText(aiRaw);

	if (!aiText) {
		return c.json(
			{
				error:
					"The model did not return any data. Try simplifying the syllabus text.",
			},
			502,
		);
	}

	let assignments: Assignment[];
	try {
		assignments = parseAssignments(aiText);
	} catch (error) {
		console.error("Failed to parse AI output", aiText, error);
		return c.json(
			{
				error:
					"Could not interpret the AI output. Please tweak the syllabus input and retry.",
			},
			502,
		);
	}

	if (assignments.length === 0) {
		return c.json(
			{
				error:
					"No deadlines were detected. Double-check the syllabus content and try again.",
			},
			200,
		);
	}

	const courseId =
		((globalThis as unknown as {
			crypto?: { randomUUID?: () => string };
		}).crypto?.randomUUID?.() as string | undefined) ??
		`course-${Date.now().toString(36)}`;

	const record: CourseRecord = {
		courseId,
		courseTag: courseTag || "untitled-course",
		createdAt: new Date().toISOString(),
		assignments,
	};

	await saveCourseRecord(c.env, record);

	return c.json(record);
});

function extractModelText(result: unknown): string {
	if (!result) return "";
	if (typeof result === "string") return result;

	if (typeof result === "object") {
		const response = (result as { response?: unknown }).response;
		if (typeof response === "string") return response;

		const outputText = (result as { output_text?: unknown }).output_text;
		if (typeof outputText === "string") return outputText;

		const resultField = (result as { result?: unknown }).result;
		if (typeof resultField === "string") return resultField;
		if (typeof resultField === "object" && resultField !== null) {
			const maybeOutput = (resultField as { output_text?: unknown }).output_text;
			if (typeof maybeOutput === "string") return maybeOutput;

			const choices = (resultField as { choices?: unknown }).choices;
			if (Array.isArray(choices) && choices.length > 0) {
				const message = choices[0]?.message;
				if (message && typeof message === "object") {
					const content = (message as { content?: unknown }).content;
					if (typeof content === "string") return content;
					if (Array.isArray(content) && content.length > 0) {
						const text = content[0];
						if (typeof text === "string") return text;
						if (text && typeof text === "object") {
							const innerText = (text as { text?: unknown }).text;
							if (typeof innerText === "string") return innerText;
						}
					}
				}
			}
		}
	}

	return "";
}

function parseAssignments(raw: string): Assignment[] {
	const jsonPayload = extractJsonPayload(raw);
	let parsed: unknown;
	try {
		parsed = JSON.parse(jsonPayload);
	} catch (error) {
		throw new Error("Invalid JSON output", { cause: error });
	}
	if (!Array.isArray(parsed)) {
		throw new Error("Expected an array of assignments");
	}

	const assignments: Assignment[] = [];

	for (const item of parsed) {
		if (!item || typeof item !== "object") {
			continue;
		}
		const title = String((item as Record<string, unknown>).title ?? "").trim();
		const dueDate = String(
			(item as Record<string, unknown>).due_date ??
				(item as Record<string, unknown>).dueDate ??
				"",
		).trim();
		const description = String(
			(item as Record<string, unknown>).description ?? "",
		).trim();
		if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
			continue;
		}
		assignments.push({
			title,
			dueDate,
			description,
		});
	}

	return assignments;
}

function extractJsonPayload(raw: string): string {
	const trimmed = raw.trim();

	const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
	if (fenced) {
		return fenced[1].trim();
	}

	const arrayMatch = trimmed.match(/\[[\s\S]*\]/);
	if (arrayMatch) {
		return arrayMatch[0].trim();
	}

	return trimmed;
}
