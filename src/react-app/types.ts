export interface Assignment {
	title: string;
	dueDate: string;
	description?: string;
}

export interface CourseHistoryEntry {
	courseId: string;
	courseTag: string;
	createdAt: string;
}

export interface ParseResponse {
	courseId: string;
	courseTag: string;
	assignments: Assignment[];
	createdAt: string;
}

export interface CoursesResponse {
	courses: CourseHistoryEntry[];
}

export interface ApiError {
	error: string;
}
