import { FormEvent, useMemo, useRef, useState } from "react";

export type InputMode = "paste" | "upload";

export interface SyllabusFormValues {
	courseTag: string;
	inputMode: InputMode;
	syllabusText: string;
	syllabusFile: File | null;
}

interface SyllabusFormProps {
	isLoading: boolean;
	onSubmit: (values: SyllabusFormValues) => Promise<void> | void;
}

const DEFAULT_STATE: SyllabusFormValues = {
	courseTag: "",
	inputMode: "paste",
	syllabusText: "",
	syllabusFile: null,
};

export function SyllabusForm({ isLoading, onSubmit }: SyllabusFormProps) {
	const [values, setValues] = useState<SyllabusFormValues>(DEFAULT_STATE);
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	const isSubmitDisabled = useMemo(() => {
		if (values.inputMode === "paste") {
			return isLoading || !values.syllabusText.trim();
		}
		return isLoading || !values.syllabusFile;
	}, [isLoading, values.inputMode, values.syllabusFile, values.syllabusText]);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (isSubmitDisabled) {
			return;
		}
		await onSubmit(values);
		setValues((prev) => ({ ...DEFAULT_STATE, inputMode: prev.inputMode }));
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleModeChange = (mode: InputMode) => {
		setValues((prev) => ({
			...prev,
			inputMode: mode,
			// Clear the opposing input when toggling modes so we never submit stale data.
			syllabusText: mode === "paste" ? prev.syllabusText : "",
			syllabusFile: mode === "upload" ? prev.syllabusFile : null,
		}));
		if (mode === "paste" && fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	return (
		<form className="panel" onSubmit={handleSubmit}>
			<div className="panel-header">
				<h2>Upload or Paste Syllabus</h2>
				<p>We&apos;ll extract key deadlines with Workers AI.</p>
			</div>
			<label className="field">
				<span>Course tag (used as a key in KV)</span>
				<input
					type="text"
					name="courseTag"
					autoComplete="off"
					value={values.courseTag}
					placeholder="e.g. CS101-Fall-2025"
					onChange={(event) =>
						setValues((prev) => ({ ...prev, courseTag: event.target.value }))
					}
				/>
			</label>
			<div className="field">
				<span>Choose input method</span>
				<div className="segmented-control" role="group" aria-label="input mode">
					<button
						type="button"
						className={values.inputMode === "paste" ? "active" : ""}
						onClick={() => handleModeChange("paste")}
					>
						Paste text
					</button>
					<button
						type="button"
						className={values.inputMode === "upload" ? "active" : ""}
						onClick={() => handleModeChange("upload")}
					>
						Upload PDF
					</button>
				</div>
			</div>

			{values.inputMode === "paste" ? (
				<label className="field">
					<span>Syllabus text</span>
					<textarea
						name="syllabusText"
						rows={12}
						placeholder="Paste the syllabus text, including assignment descriptions and due dates."
						value={values.syllabusText}
						onChange={(event) =>
							setValues((prev) => ({
								...prev,
								syllabusText: event.target.value,
							}))
						}
					/>
				</label>
			) : (
				<label className="field">
					<span>Upload a PDF syllabus</span>
					<input
						ref={fileInputRef}
						type="file"
						name="syllabusFile"
						accept=".pdf,.txt,.doc,.docx"
						onChange={(event) => {
							const file = event.target.files?.[0] ?? null;
							setValues((prev) => ({ ...prev, syllabusFile: file }));
						}}
					/>
				</label>
			)}

			<button type="submit" className="primary" disabled={isSubmitDisabled}>
				{isLoading ? "Extracting…" : "Extract Deadlines"}
			</button>
		</form>
	);
}
