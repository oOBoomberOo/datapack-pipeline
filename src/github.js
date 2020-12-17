const core = require('@actions/core');
const { context, getOctokit } = require('@actions/github');

function displayName(s) {
	return s.replace('refs/tags/', '')
}

async function createRelease(github, version) {
	const { owner, repo } = context.repo;

	const body = getInput('body');
		
	const releaseName = getInput('release_name') || version;
	const release = displayName(releaseName);

	const draft = getBool('draft');
	const prerelease = getBool('prerelease');
	const commitish = getInput('commitish') || context.sha;

	console.log(
`Creating a release on ${owner}/${repo}
  1. tag_name = ${version}
  2. name = ${release}
  3. body = ${body}
  4. draft = ${draft}
  5. prerelease = ${prerelease}
  6. commitish = ${commitish} \
`)

	const response = await github.repos.createRelease({
		owner,
		repo,
		tag_name: version,
		name: release,
		body,
		draft,
		prerelease,
		target_commitish: commitish
	});

	const { id: releaseId, html_url: htmlUrl, upload_url: uploadUrl } = response.data;
	return { releaseId, htmlUrl, uploadUrl };
}

async function uploadAsset(github, uploadUrl, assetName, fileContent, contentType) {
	const headers = { 'content-type': contentType };

	const response = await github.repos.uploadReleaseAsset({
		url: uploadUrl,
		headers: headers,
		name: assetName,
		data: fileContent,
	});

	return response.data;
}

function getVersion() {
	const tagName = getInput('tag_name', true);
	return displayName(tagName);
}

function getName() {
	const name = getInput('name');

	if (name != null && name !== '') {
		return name;
	}

	return context.repo.repo;
}

/// Helper function

function getInput(field, required = false) {
	return core.getInput(field, { required });
}

function getBool(field, required = false) {
	return getInput(field, required) === 'true';
}

module.exports = { createRelease, uploadAsset, displayName, getVersion, getName };