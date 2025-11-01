import { CourseHistoryEntry } from "../types";

interface HistoryPanelProps {
	courses: CourseHistoryEntry[];
	activeCourseId: string | null;
	isLoading: boolean;
	onRefresh: () => Promise<void> | void;
	onSelect: (courseId: string) => void;
}

export function HistoryPanel({
	courses,
	activeCourseId,
	isLoading,
	onRefresh,
	onSelect,
}: HistoryPanelProps) {
	return (
		<aside className="panel history-panel">
			<div className="panel-header">
				<h2>Recent runs</h2>
				<button
					type="button"
					className="ghost"
					onClick={() => onRefresh()}
					disabled={isLoading}
				>
					{isLoading ? "Refreshing…" : "Refresh"}
				</button>
			</div>
			{courses.length === 0 ? (
				<p className="muted">No prior parses yet.</p>
			) : (
				<ul>
					{courses.map((course) => (
						<li key={course.courseId}>
							<button
								type="button"
								className={
									course.courseId === activeCourseId ? "active" : undefined
								}
								onClick={() => onSelect(course.courseId)}
							>
								<span className="tag">{course.courseTag || "Untitled"}</span>
								<time dateTime={course.createdAt}>
									{new Intl.DateTimeFormat(undefined, {
										month: "short",
										day: "numeric",
										hour: "numeric",
										minute: "2-digit",
									}).format(new Date(course.createdAt))}
								</time>
							</button>
						</li>
					))}
				</ul>
			)}
		</aside>
	);
}
