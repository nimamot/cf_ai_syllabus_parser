import { MouseEvent } from "react";

interface DownloadButtonsProps {
	courseId: string | null;
	disabled?: boolean;
}

export function DownloadButtons({
	courseId,
	disabled = false,
}: DownloadButtonsProps) {
	const usableCourseId = !disabled && courseId ? courseId : null;
	const icsHref = usableCourseId ? `/api/export/${usableCourseId}.ics` : undefined;
	const csvHref = usableCourseId ? `/api/export/${usableCourseId}.csv` : undefined;

	const preventNavigation =
		(href?: string) => (event: MouseEvent<HTMLAnchorElement>) => {
			if (!href) {
				event.preventDefault();
			}
		};

	return (
		<div className="download-buttons">
			<a
				className={!icsHref ? "disabled" : ""}
				aria-disabled={!icsHref}
				href={icsHref}
				onClick={preventNavigation(icsHref)}
				download
			>
				Download .ics
			</a>
			<a
				className={!csvHref ? "disabled" : ""}
				aria-disabled={!csvHref}
				href={csvHref}
				onClick={preventNavigation(csvHref)}
				download
			>
				Download .csv
			</a>
		</div>
	);
}
