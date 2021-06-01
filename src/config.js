const { promises: fs } = require('fs');
const toml = require('@iarna/toml');
const path = require('path');
const core = require('@actions/core')

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

	core.debug(`base_dir: ${base_dir}`)
	core.debug(`includes: ${includes}`)
	core.debug(`excludes: ${excludes}`)

	return { includes, excludes, base_dir: path.join(workspace, base_dir) };
}

const getConfig = workspace => async configPath => {
	const p = path.join(workspace, configPath);

	core.debug(`config path: ${p}`)

	try {
		core.info(`Reading config file at ${p}`);
		const result = await fs.readFile(p);
		var content = result.toString();
	} catch (err) {
		throw new Error(`Unable to read the config file at ${configPath}: ${err.message}`);
	}

	try {
		let configRaw = toml.parse(content);

		let debug_config = JSON.stringify(configRaw)
		core.debug(`raw config: ${debug_config}`)

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