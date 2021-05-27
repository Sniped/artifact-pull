import express from 'express';
import { Octokit } from 'octokit';
import { createClient } from 'redis';
import { ArtifactCacheManager } from './artifact/artifactCacheManager';
import { ArtifactManager } from './artifact/artifactManager';

const dotenv = require('dotenv');
dotenv.config();

const app = express();

const octokit = new Octokit({
	auth: process.env.ACCESS_TOKEN || '',
});

const redisClient = createClient();

const artifactManager = new ArtifactManager(
	octokit,
	new ArtifactCacheManager(redisClient)
);

app.get('/artifacts/:id', async (req, res) => {
	if (!req.params.id || parseInt(req.params.id) == NaN)
		return res.sendStatus(400);
	const artifact = await artifactManager.getArtifactById(
		parseInt(req.params.id)
	);
	const path = await artifactManager.fetchArtifactFile(artifact);
	res.download(path);
});

app.get('/artifacts', async (_, res) => {
	const artifact = await artifactManager.getLatestArtifact();
	const path = await artifactManager.fetchArtifactFile(artifact);
	res.download(path);
});

app.listen(3000, () => console.log('Listening on port 3000'));
