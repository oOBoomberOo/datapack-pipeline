const core = require('@actions/core');
const AdmZip = require('adm-zip');
const glob = require('glob-promise');
const minimatch = require('minimatch');
const { promises: fs } = require('fs');
const path = require('path');

module.exports.archive = async profile => {
	let zip = new AdmZip();

	for (const relativeFile of profile.files) {
		const absolutePath = path.join(profile.base_dir, relativeFile);
		const stat = await fs.stat(absolutePath);
		let parent = path.dirname(relativeFile);

		if (parent === '.') {
			parent = '';
		}

		if (stat.isFile()) {
			zip.addLocalFile(absolutePath, parent);
		}
	}

	return { zip, kind: profile.kind };
};

module.exports.process = async profile => {
	const { includes, excludes, ...rest } = profile;

	const createMinimatch = pattern => path => minimatch(path, pattern);
	const excludeMatchers = excludes.map(createMinimatch);

	const matchFiles = x => glob(x, { nonull: false, cwd: profile.base_dir });

	let debug_dir = await fs.readdir('.')
	core.debug(`content: ${debug_dir}`)

	const matches = includes.map(matchFiles);
	const files = await Promise.all(matches);

	const flattenFiles = files.flat();

	const isExcluded = path => excludeMatchers.some(match => match(path));
	const fileList = flattenFiles.filter(path => !isExcluded(path));

	return { files: fileList, ...rest };
};

module.exports.displayName = (name, kind, version) => {
	return `${name}-${kind}-${version}.zip`
		.trim()
		.replace(/\s+/g, '_');
};
