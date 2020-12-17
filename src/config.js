const { promises: fs } = require('fs');
const toml = require('@iarna/toml');
const path = require('path');

const getProfile = (workspace, data) => {
	const verify = (x) => {
		if (x == null) {
			return []
		} else if (Array.isArray(x)) {
			return x;
		} else {
			throw new Error(`Expecting array, got ${toml.stringify.value(x)}`);
		}
	};

	let base_dir = data.base_dir || '';
	let includes = verify(data.includes);
	let excludes = verify(data.excludes);

	return { includes, excludes, base_dir: path.join(workspace, base_dir) };
}

const getConfig = workspace => async configPath => {
	const p = path.join(workspace, configPath);
	try {
		console.log(`Reading config file at ${p}`);
		const result = await fs.readFile(p);
		var content = result.toString();
	} catch (err) {
		console.log(err);
		throw new Error(`Unable to read the config file at ${configPath}: ${err.message}`);
	}

	try {
		let configRaw = toml.parse(content);

		let result = [];
		for (const kind in configRaw) {
			let profile = getProfile(workspace, configRaw[kind]);
			result.push({ kind, ...profile })
		}

		return result;
	} catch (err) {
		throw new Error(`Parsing Error in ${configPath}: ${err.message}`);
	}
}

module.exports = { getConfig, getProfile };