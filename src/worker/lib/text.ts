const MAX_CHARACTERS = 15000;

export function normalizeSyllabusText(input: string): string {
	return collapseWhitespace(input).slice(0, MAX_CHARACTERS);
}

function collapseWhitespace(value: string): string {
	return value.replace(/\r\n/g, "\n").replace(/\s+\n/g, "\n").replace(/[ \t]+/g, " ").trim();
}

export function isLikelyPdf(fileName: string | null, mimeType: string | null): boolean {
	if (mimeType?.includes("pdf")) {
		return true;
	}
	return Boolean(fileName && fileName.toLowerCase().endsWith(".pdf"));
}

export function sanitizeCourseTag(input: string | null): string {
	return (
		input?.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\-]/g, "") ?? ""
	);
}
