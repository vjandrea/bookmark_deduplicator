/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* extension: Bookmarks Deduplicator
 * version: 1.0
 * created at: 2013-02-20
 * author: Christian Sdunek
 */

"use strict";

var bookmarksService = Cc["@mozilla.org/browser/nav-bookmarks-service;1"].getService(Ci.nsINavBookmarksService);
var historyService = Cc["@mozilla.org/browser/nav-history-service;1"].getService(Ci.nsINavHistoryService);

let existingBookmarks = {};
let duplicateBookmarks = [];

function deduplicate() {
    if(duplicateBookmarks.length < 1) {
        getDuplicates();
    }
    let changedCount = 0;
    for(let i = 0; i < duplicateBookmarks.length; ++i) {
        bookmarksService.removeItem(duplicateBookmarks[i].itemId);
        ++changedCount;
    }
    return changedCount;
}
exports.deduplicate = deduplicate;


function getDuplicates() {
    duplicateBookmarks = [];

    let rootNode = getResultNode([bookmarksService.toolbarFolder]);
    rootNode.containerOpen = true;
    getChilds(rootNode);  
    rootNode.containerOpen = false;

    let rootNode = getResultNode([bookmarksService.unfiledBookmarksFolder]);
    rootNode.containerOpen = true;
    getChilds(rootNode);  
    rootNode.containerOpen = false;

    let rootNode = getResultNode([bookmarksService.bookmarksMenuFolder]);
    rootNode.containerOpen = true;
    getChilds(rootNode);  
    rootNode.containerOpen = false;

    existingBookmarks = [];
    return duplicateBookmarks;
}
exports.getDuplicates = getDuplicates;

/**
 * @return
 * the node to a given folder id
 */
function getResultNode(folders){
    let options = historyService.getNewQueryOptions();
    let query = historyService.getNewQuery();    
    
    query.setFolders(folders,1);
    
    let result = historyService.executeQuery(query,options);
    let resultNode = result.root;
    
    return resultNode;
}

/**
 * @return 
 * childs to a given root, recursively
 */
function getChilds(rootNode){
	let rootNodeChild = null;
    let childs = new Array();
    
    for (let i = 0; i < rootNode.childCount; i++) {
		rootNodeChild = rootNode.getChild(i);
        
        /* if node is a bookmark */
        if(rootNodeChild.type == 0){

        	// delete the bookmark if one with the same uri exists

        	if(existingBookmarks[rootNodeChild.uri] === true) {
                duplicateBookmarks.push(rootNodeChild);
        	}
        	else {
        		existingBookmarks[rootNodeChild.uri] = true;
        	}
        }
        /* if node is a folder */
        else {
            let resultNode = getResultNode([rootNodeChild.itemId]);
            resultNode.containerOpen = true;
            childs = childs.concat(getChilds(resultNode));
            resultNode.containerOpen = false;
        }
    }
    return childs;
}
