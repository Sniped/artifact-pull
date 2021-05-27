import { RedisClient } from 'redis';
import { promisify } from 'util';

interface CachedArtifactFile {
	artifactId: number;
	filePath: string;
}

export class ArtifactCacheManager {
	private redisClient: RedisClient;

	constructor(redisClient: RedisClient) {
		this.redisClient = redisClient;
	}

	async getCachedArtifactFileById(id: number) {
		const getAsync = promisify(this.redisClient.get).bind(this.redisClient);
		const file = await getAsync(`artifacts@${id.toString()}`);
		return file ? (JSON.parse(file) as CachedArtifactFile) : null;
	}

	async addArtifactFileToCache(artifactFile: CachedArtifactFile) {
		const setAsync = promisify(this.redisClient.set).bind(this.redisClient);
		await setAsync(
			`artifacts@${artifactFile.artifactId.toString()}`,
			JSON.stringify(artifactFile)
		);
	}
}
