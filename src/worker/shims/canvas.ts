export const createCanvas = () => {
	throw new Error("Canvas API is not available in this environment.");
};

export class Image {}

export default {
	createCanvas,
	Image,
};
