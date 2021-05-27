import { readdirSync } from 'fs';
import {
	ArtifactCacheManager,
	CachedArtifactFile,
} from './artifactCacheManager';

export class ArtifactCacheExpiryManager {
	private cacheManager: ArtifactCacheManager;
	private expiry: Map<NodeJS.Timeout, CachedArtifactFile>;

	constructor(cacheManager: ArtifactCacheManager) {
		this.cacheManager = cacheManager;
		this.expiry = new Map();
	}

	async init() {
		await this.expireUnassociatedFiles();
		await this.refresh();
	}

	async expireUnassociatedFiles() {
		const files = readdirSync(`${process.cwd()}/artifactsCache`);
		files.forEach(async file => {
			const id = parseInt(file.substring(file.indexOf('-') + 1, file.indexOf('.')));
			const cachedArtifact = await this.cacheManager.getCachedArtifactFileById(
				id
			);
			if (!cachedArtifact) this.cacheManager.deleteCachedArtifactFileWithId(id);
		});
	}

	async refresh() {
		this.expiry.forEach((_, k) => {
			clearTimeout(k);
			this.expiry.delete(k);
		});
		const keys = await this.cacheManager.getAllCachedArtifacts();
		keys.forEach(async key => {
			const id = parseInt(key.substring(key.indexOf('@') + 1, key.length));
			const cachedArtifact = await this.cacheManager.getCachedArtifactFileById(
				id
			);
			if (!cachedArtifact) return;
			const expiryDate = new Date(cachedArtifact.expireAt * 1000);
			console.log(expiryDate.getTime());
			console.log(new Date().getTime());
			const timeDiff = expiryDate.getTime() - new Date().getTime();
			console.log(timeDiff);
			if (timeDiff < 0) return this.expire(cachedArtifact);
			const timeout = setTimeout(() => this.expire(cachedArtifact), timeDiff);
			this.expiry.set(timeout, cachedArtifact);
		});
	}

	async expire(cachedFile: CachedArtifactFile) {
		this.cacheManager.deleteCachedArtifactWithId(cachedFile.artifactId);
	}
}
