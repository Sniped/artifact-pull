import { existsSync, unlink } from 'fs';
import { RedisClient } from 'redis';
import { promisify } from 'util';

export interface CachedArtifactFile {
	artifactId: number;
	filePath: string;
	expireAt: number;
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

	async deleteCachedArtifactWithId(id: number) {
		this.redisClient.del(`artifacts@${id}`);
		this.deleteCachedArtifactFileWithId(id);
	}

	async deleteCachedArtifactFileWithId(id: number) {
		const path = `${process.cwd()}/artifactsCache/artifact-${id}.zip`;
		if (existsSync(path)) {
			const unlinkAsync = promisify(unlink);
			await unlinkAsync(path);
		}
	}

	async addArtifactFileToCache(artifactFile: CachedArtifactFile) {
		const setAsync = promisify(this.redisClient.set).bind(this.redisClient);
		const expireAtAsync = promisify(this.redisClient.expireat).bind(
			this.redisClient
		);
		const key = `artifacts@${artifactFile.artifactId.toString()}`;
		await setAsync(key, JSON.stringify(artifactFile));
		await expireAtAsync(key, artifactFile.expireAt);
	}

	async getAllCachedArtifacts() {
		const keysAsync = promisify(this.redisClient.keys).bind(this.redisClient);
		const keys = await keysAsync('*artifacts*');
		return keys;
	}
}
