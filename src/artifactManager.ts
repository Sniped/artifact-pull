import { Endpoints } from '@octokit/types';
import { writeFile } from 'fs';
import { Octokit } from 'octokit';
import { promisify } from 'util';
import { ArtifactCacheManager } from './artifactCacheManager';
import { REPO_NAME, REPO_OWNER } from './constants';
import { arrayBufferToBuffer } from './functions';

export class ArtifactManager {
	octokit: Octokit;
	artifactCacheManager: ArtifactCacheManager;

	constructor(octokit: Octokit, artifactCacheManager: ArtifactCacheManager) {
		this.octokit = octokit;
		this.artifactCacheManager = artifactCacheManager;
	}

	async getArtifactById(id: number) {
		const artifact = await this.octokit.rest.actions.getArtifact({
			owner: REPO_OWNER,
			repo: REPO_NAME,
			artifact_id: id,
		});
		if (artifact.status != 200)
			throw new Error(`GitHub returned status code ${artifact.status}`);
		return artifact.data;
	}

	async getLatestArtifact() {
		const artifacts = await this.octokit.rest.actions.listArtifactsForRepo({
			owner: REPO_OWNER,
			repo: REPO_NAME,
		});
		if (artifacts.status != 200)
			throw new Error(`GitHub returned status code ${artifacts.status}`);
		artifacts.data.artifacts.sort(
			(a, b) =>
				new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
		);
		return artifacts.data.artifacts[0];
	}

	async fetchArtifactFile(
		artifact: Endpoints['GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}']['response']['data']
	) {
		const cachedFile = this.artifactCacheManager.getCachedArtifactFileById(
			artifact.id
		);
		if (cachedFile) return cachedFile.filePath;
		const res = await this.octokit.rest.actions.downloadArtifact({
			owner: REPO_OWNER,
			repo: REPO_NAME,
			artifact_id: artifact.id,
			archive_format: 'zip',
		});
		const path = `${process.cwd()}/artifactsCache/artifact-${artifact.id}.zip`;
		const asyncWriteFile = promisify(writeFile);
		const arrayBuffer = res.data as ArrayBuffer;
		await asyncWriteFile(path, arrayBufferToBuffer(arrayBuffer));
		this.artifactCacheManager.addArtifactFileToCache(artifact.id, path);
		return path;
	}
}
