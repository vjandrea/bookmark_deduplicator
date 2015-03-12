/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* extension: Bookmarks Deduplicator
 * version: 1.0
 * created at: 2013-02-20
 * author: Christian Sdunek
 */

"use strict";

let ddb = require("deduplicateBookmarks");

// ----------------------------------
exports.main = function main () {
	let observer = {
		observe: function(sub, top, dat) {
			if(top == "addon-options-displayed" && dat == "bookmarkdeduplicator@foxhatdev") {
				let document = sub;
				let theactionbegin = document.getElementById("starttheaction");
				theactionbegin.addEventListener("command", function() {
					let dups = ddb.getDuplicates();
					if(dups.length > 0) {

						let titles = [];
						for(let i = 0; i < dups.length; ++i) {
							titles.push(dups[i].title);
						}

						let popup = Services.prompt.select(null, "Bookmark Deduplicator", "The following duplicate bookmarks will be removed.", titles.length, titles, {});
						if(popup === true) {
							let changes = ddb.deduplicate();
							Services.prompt.alert(null, "Bookmark Deduplicator", "Success! "+changes+" duplicate bookmarks removed.");
						}
						
					}
					else Services.prompt.alert(null, "Bookmark Deduplicator", "No duplicate bookmarks found!");
				});
			}
		}
	}

	Services.obs.addObserver(observer, "addon-options-displayed", false);
	registerShutdownCallback(function() {
		Services.obs.removeObserver(observer, "addon-options-displayed", false);
	});


}
