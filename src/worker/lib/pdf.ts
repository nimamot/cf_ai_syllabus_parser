// @ts-ignore - pdfjs-dist does not provide full type coverage for ESM usage
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";

(GlobalWorkerOptions as unknown as { disableWorker?: boolean }).disableWorker = true;
GlobalWorkerOptions.workerSrc = "pdf.worker.js";

export async function extractTextFromPdf(data: ArrayBuffer): Promise<string> {
	const params = {
		data: data instanceof Uint8Array ? data : new Uint8Array(data),
		useSystemFonts: true,
		isEvalSupported: false,
		disableFontFace: true,
		disableWorker: true,
	};

	const task = getDocument(params as any);

	const doc = await task.promise;
	try {
		const lines: string[] = [];
		for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
			const page = await doc.getPage(pageNumber);
			const content = await page.getTextContent();
			const textContent = content.items as Array<{ str?: string }> | undefined;
			const text =
				textContent
					?.map((item) => (item?.str ? item.str : ""))
					.filter((value) => Boolean(value?.trim()))
					.join(" ") ?? "";
			if (text.trim().length > 0) {
				lines.push(text);
			}
		}
		return lines.join("\n");
	} finally {
		await doc.cleanup();
		task.destroy();
	}
}
