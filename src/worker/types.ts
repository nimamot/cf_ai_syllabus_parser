export interface Assignment {
	title: string;
	dueDate: string;
	description?: string;
}

export interface CourseRecord {
	courseId: string;
	courseTag: string;
	createdAt: string;
	assignments: Assignment[];
}

export interface CourseMetadata {
	courseId: string;
	courseTag: string;
	createdAt: string;
}

export type AiBinding = {
	run<ModelInput extends Record<string, unknown>, ModelResult = unknown>(
		model: string,
		input: ModelInput,
	): Promise<ModelResult>;
};

export interface Env {
	AI: AiBinding;
	SYLLABUS_KV: KVNamespace;
}
