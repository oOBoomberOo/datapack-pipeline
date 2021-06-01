const core = require('@actions/core');
const { getOctokit } = require('@actions/github');
const { promisify } = require('util');
const { promises: fs } = require('fs');

const { getConfig } = require('./config');
const profile = require('./profile');
const github = require('./github');

async function main() {
	const workspace = process.env.GITHUB_WORKSPACE;

	let configPath = core.getInput('config', { required: true });
	let config = await getConfig(workspace)(configPath);

	if (process.env.GITHUB_TOKEN == null) {
		throw new Error(`GITHUB_TOKEN is required but got ${process.env.GITHUB_TOKEN}`);
	}

	const githubSession = getOctokit(process.env.GITHUB_TOKEN);

	const name = github.getName(githubSession);
	core.info(`Get name: ${name}`);
	const version = github.getVersion();
	core.info(`Get version: ${version}`);

	const { uploadUrl } = await github.createRelease(githubSession, version);

	for await (const processed of config.map(profile.process)) {
		const archived = await profile.archive(processed);
		const displayName = profile.displayName(name, archived.kind, version);

		const data = archived.zip.toBuffer();

		await github.uploadAsset(githubSession, uploadUrl, displayName, data, 'application/zip');
		core.info(`Uploaded asset: ${displayName}`);
	}

	core.setOutput('upload_url', uploadUrl);
}

main()
	.catch(core.setFailed);
