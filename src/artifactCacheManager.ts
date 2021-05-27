interface CachedArtifactFile {
	artifactId: number;
	filePath: string;
}

export class ArtifactCacheManager {
	private cache: Map<number, CachedArtifactFile>;

	constructor() {
		this.cache = new Map();
	}

	getCachedArtifactFileById(id: number) {
		return this.cache.get(id);
	}

	addArtifactFileToCache(artifactId: number, filePath: string) {
		this.cache.set(artifactId, { artifactId, filePath });
	}
}
