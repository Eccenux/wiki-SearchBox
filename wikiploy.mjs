/**
 * Deploy as a gadget.
 */
import {DeployConfig, WikiployLite} from 'wikiploy';
import {version, info} from './version.mjs';
import { build_js } from './build.mjs';

import * as botpass from './bot.config.mjs';
const ployBot = new WikiployLite(botpass);

// custom summary
ployBot.summary = () => {
	return `v${version}: ${info}`;
}

(async () => {
	// build
	await build_js();

	// deploy
	const configs = [];
	configs.push(new DeployConfig({
		src: 'SearchBox.dev.js',
		dst: 'MediaWiki:Gadget-searchbox.js',
	}));
	configs.push(new DeployConfig({
		src: 'SearchBox.css',
		dst: 'MediaWiki:Gadget-searchbox.css',
	}));
	// +dev
	configs.push(new DeployConfig({
		src: 'SearchBox.dev.js',
	}));
	configs.push(new DeployConfig({
		src: 'SearchBox.css',
	}));
	await ployBot.deploy(configs);
})().catch(err => {
	console.error(err);
	process.exit(1);
});