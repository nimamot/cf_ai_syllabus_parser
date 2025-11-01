// src/App.tsx

import { useCallback, useEffect, useState } from "react";
import { AssignmentTable } from "./components/AssignmentTable";
import { DownloadButtons } from "./components/DownloadButtons";
import { HistoryPanel } from "./components/HistoryPanel";
import {
	SyllabusForm,
	SyllabusFormValues,
} from "./components/SyllabusForm";
import {
	ApiError,
	Assignment,
	CourseHistoryEntry,
	CoursesResponse,
	ParseResponse,
} from "./types";
import "./App.css";

const UNTITLED_LABEL = "Untitled course";

function App() {
	const [assignments, setAssignments] = useState<Assignment[]>([]);
	const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
	const [activeCourseTag, setActiveCourseTag] = useState<string>("");
	const [history, setHistory] = useState<CourseHistoryEntry[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isHistoryLoading, setIsHistoryLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [info, setInfo] = useState<string | null>(null);

	const refreshHistory = useCallback(async () => {
		setIsHistoryLoading(true);
		try {
			const response = await fetch("/api/courses", { method: "GET" });
			if (!response.ok) {
				throw new Error(`Request failed: ${response.status}`);
			}
			const payload = (await response.json()) as CoursesResponse | ApiError;
			if ("error" in payload) {
				console.warn("History request returned an error", payload.error);
				setHistory([]);
				return;
			}
			setHistory(payload.courses ?? []);
		} catch (cause) {
			console.error("Failed to load parse history", cause);
		} finally {
			setIsHistoryLoading(false);
		}
	}, []);

	const loadCourse = useCallback(async (courseId: string) => {
		try {
			const response = await fetch(`/api/courses/${courseId}`, {
				method: "GET",
			});
			const payload = (await response.json()) as ParseResponse | ApiError;
			if (!response.ok || "error" in payload) {
				const message =
					payload && "error" in payload
						? payload.error
						: "Unable to load that course.";
				setError(message);
				return;
			}
			setAssignments(payload.assignments ?? []);
			setActiveCourseId(payload.courseId);
			setActiveCourseTag(payload.courseTag || UNTITLED_LABEL);
			setError(null);
			setInfo(null);
		} catch (cause) {
			console.error("Failed to load course", cause);
			setError("We couldn't load that course. Please try again.");
		}
	}, []);

	const handleSubmit = useCallback(
		async (values: SyllabusFormValues) => {
			setIsSubmitting(true);
			setError(null);
			setInfo(null);

			try {
				const formData = new FormData();
				const trimmedTag = values.courseTag.trim();
				if (trimmedTag) {
					formData.set("courseTag", trimmedTag);
				}
				if (values.inputMode === "paste") {
					formData.set("syllabusText", values.syllabusText);
				} else if (values.syllabusFile) {
					formData.set("syllabusFile", values.syllabusFile);
				}

				const response = await fetch("/api/parse", {
					method: "POST",
					body: formData,
				});
				const payload = (await response.json()) as ParseResponse | ApiError;
				if (!response.ok || "error" in payload) {
					const message =
						payload && "error" in payload
							? payload.error
							: "We couldn't extract deadlines from that syllabus.";
					setAssignments([]);
					setActiveCourseId(null);
					setActiveCourseTag("");
					setError(message);
					return;
				}

				setAssignments(payload.assignments ?? []);
				setActiveCourseId(payload.courseId);
				setActiveCourseTag(payload.courseTag || trimmedTag || UNTITLED_LABEL);
				setError(null);
				setInfo(
					`Captured ${payload.assignments.length} deadline${
						payload.assignments.length === 1 ? "" : "s"
					}.`,
				);
				await refreshHistory();
			} catch (cause) {
				console.error("Failed to process syllabus", cause);
				setError("We hit a snag extracting deadlines. Please try again.");
			} finally {
				setIsSubmitting(false);
			}
		},
		[refreshHistory],
	);

	const handleHistorySelect = useCallback(
		(courseId: string) => {
			void loadCourse(courseId);
		},
		[loadCourse],
	);

	useEffect(() => {
		void refreshHistory();
	}, [refreshHistory]);

	return (
		<div className="app-shell">
			<header className="app-header">
				<div>
					<h1>Cloudflare AI Syllabus Parser</h1>
					<p>
						Upload a syllabus, let Workers AI extract deadlines, and download a
						calendar-ready schedule.
					</p>
				</div>
				<div className="banner-stack">
					{error && <p className="error-banner">{error}</p>}
					{!error && info && <p className="info-banner">{info}</p>}
				</div>
			</header>
			<main className="app-main">
				<div className="main-columns">
					<div className="primary-column">
						<SyllabusForm isLoading={isSubmitting} onSubmit={handleSubmit} />
						<section className="panel">
							<div className="panel-header">
								<h2>Export</h2>
								<p>
									Download the structured deadlines as an .ics calendar or .csv
									file.
								</p>
							</div>
							<DownloadButtons
								courseId={activeCourseId}
								disabled={assignments.length === 0}
							/>
						</section>
					</div>
					<HistoryPanel
						courses={history}
						activeCourseId={activeCourseId}
						isLoading={isHistoryLoading}
						onRefresh={refreshHistory}
						onSelect={handleHistorySelect}
					/>
				</div>
				<AssignmentTable
					assignments={assignments}
					courseTag={activeCourseTag || (activeCourseId ? UNTITLED_LABEL : "")}
				/>
			</main>
		</div>
	);
}

export default App;
