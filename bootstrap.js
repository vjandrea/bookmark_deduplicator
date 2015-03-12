/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 /*
	created at: 2012-12-28
	author: Christian Sdunek 
 */

"use strict";

const {
	classes: 	Cc,
	interfaces: Ci,
	utils: 		Cu,
	results: 	Cr,
	manager: 	Cm
} = Components;

let {
	Services,
	atob,
	btoa,
	File
} = Cu.import("resource://gre/modules/Services.jsm", null);

let startupParams;
let startupReason;
let isRunning = false;
let onShutdown = [];

function startup(params, reason) {

	/* load manifest in versions < 10 */
	if (Services.vc.compare(Services.appinfo.platformVersion, "10.0") < 0) {
		Components.manager.addBootstrappedManifestLocation(params.installPath);
	}

	startupParams = params;
	startupReason = reason;

	require("main").main();
}

function shutdown(params, reason) {

	/* remove manifest in versions < 10 */
	if (Services.vc.compare(Services.appinfo.platformVersion, "10.0") < 0) {
		Components.manager.removeBootstrappedManifestLocation(params.installPath);
	}

	for(let i = 0; i < onShutdown.length; ++i) {
		onShutdown[i](reason);
	}


	let windowNames = ["RandomBookmark"];
	for (let i = 0; i < windowNames.length; i++)
	{
		let enumerator = Services.wm.getEnumerator(windowNames[i]);
		while (enumerator.hasMoreElements())
		{
			let window = enumerator.getNext().QueryInterface(Ci.nsIDOMWindow);
			window.setTimeout("window.close();", 1);
			try
			{
				window.close();
			} catch(e) {}
		}
	}

	if(reason!=APP_SHUTDOWN) {
		for(let i = 0;i < require.modules.length;++i) {
			try {
				Cu.unload(require.modules[i]);
			} catch(e){}
		}
	}

	/* kill remaining compartments */
	if(reason==ADDON_UNINSTALL || reason == ADDON_DISABLE) {
		for (let key in require.scopes)
		{
			for(let kkey in require.scopes[key]) {
				if(kkey=="exports") {
					for(let ekey in require.scopes[key][kkey]) {
						try {
							require.scopes[key][kkey][ekey] = null;
						} catch(e){}
						delete require.scopes[key][kkey][ekey];
					}
				}
				try{
					require.scopes[key][kkey] = null;
				} catch(e){}
				delete require.scopes[key][kkey];
			}
			require.scopes[key] = null;
			delete require.scopes[key];
		}
		require.scopes = null;
		delete require.scopes;
	}

	startupParams = null;
	startupReason = null;
	isRunning = null;
	onShutdown = null;
}

function install(params, reason) {

}

function uninstall(params, reason) {

}

function data(path) {
	return startupParams.resourceURI.spec + path;
}

function registerShutdownCallback(callback) {
	onShutdown.push(callback);
}

function require(module, imports) {
	let url = data("lib/"+ module + ".js");

	require.modules.push(url);

	let scope = {
		/* core components */
		Cc: Cc,
		Ci: Ci,
		Cu: Cu,
		Cr: Cr,
		Cm: Cm,

		/* services */
		Services: Services,
		File: File,

		/* data */
		startupReason:startupReason,

		/* additional functions */
		require: require,
		data: data,
		registerShutdownCallback: registerShutdownCallback,

		/* return value container */
		exports: {},
		imports: imports
	};


	Services.scriptloader.loadSubScript(url, scope);
	//Cu.import(url, scope);

	require.scopes[module] = scope;

	return scope.exports;
}
require.modules = [];
require.scopes = {};
