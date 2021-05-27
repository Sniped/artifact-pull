import express from 'express';
import { Octokit } from 'octokit';
import { createClient } from 'redis';
import { ArtifactCacheExpiryManager } from './artifact/artifactCacheExpiryManager';
import { ArtifactCacheManager } from './artifact/artifactCacheManager';
import { ArtifactManager } from './artifact/artifactManager';

const dotenv = require('dotenv');
dotenv.config();

const app = express();

const octokit = new Octokit({
	auth: process.env.ACCESS_TOKEN || '',
});

const redisClient = createClient();

const artifactCacheManager = new ArtifactCacheManager(redisClient);

const artifactCacheExpiryManager = new ArtifactCacheExpiryManager(
	artifactCacheManager
);

const artifactManager = new ArtifactManager(
	octokit,
	artifactCacheManager,
	artifactCacheExpiryManager
);

artifactManager.artifactCacheExpiryManager.init();

app.get('/artifacts/:repoOwner/:repoName/:id', async (req, res) => {
	if (
		!req.params.id ||
		parseInt(req.params.id) == NaN ||
		!req.params.repoOwner ||
		!req.params.repoName
	)
		return res.sendStatus(400);
	const artifact = await artifactManager.getArtifactById(
		{
			owner: req.params.repoOwner,
			name: req.params.repoName,
		},
		parseInt(req.params.id)
	);
	const path = await artifactManager.fetchArtifactFile(artifact, {
		owner: req.params.repoOwner,
		name: req.params.repoName,
	});
	res.download(path);
});

app.get('/artifacts/:repoOwner/:repoName', async (req, res) => {
	if (!req.params.repoOwner || !req.params.repoName) return res.status(400);
	const artifact = await artifactManager.getLatestArtifact({
		owner: req.params.repoOwner,
		name: req.params.repoName,
	});
	const path = await artifactManager.fetchArtifactFile(artifact, {
		owner: req.params.repoOwner,
		name: req.params.repoName,
	});
	res.download(path);
});

app.listen(3000, () => console.log('Listening on port 3000'));
