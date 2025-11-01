import { Assignment } from "../types";

interface AssignmentTableProps {
	assignments: Assignment[];
	courseTag?: string;
}

export function AssignmentTable({
	assignments,
	courseTag,
}: AssignmentTableProps) {
	if (assignments.length === 0) {
		return (
			<section className="panel">
				<div className="panel-header">
					<h2>No deadlines yet</h2>
					<p>Submit a syllabus to see extracted assignments.</p>
				</div>
			</section>
		);
	}

	return (
		<section className="panel">
			<div className="panel-header">
				<h2>Extracted deadlines</h2>
				{courseTag && <p>Course: {courseTag}</p>}
			</div>
			<div className="table-wrapper">
				<table>
					<thead>
						<tr>
							<th scope="col">Title</th>
							<th scope="col">Due date</th>
							<th scope="col">Description</th>
						</tr>
					</thead>
					<tbody>
						{assignments.map((assignment) => {
							const dueDate = assignment.dueDate
								? new Intl.DateTimeFormat(undefined, {
										year: "numeric",
										month: "short",
										day: "numeric",
									}).format(new Date(assignment.dueDate))
								: "—";

							return (
								<tr key={`${assignment.title}-${assignment.dueDate}`}>
									<td>{assignment.title || "Untitled"}</td>
									<td>{dueDate}</td>
									<td>{assignment.description || "—"}</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</section>
	);
}
