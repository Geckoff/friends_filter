export default function () {
	const friendsListTemplate = require("../friends.handlebars"),
	 	  cyrillicToTranslit = require('cyrillic-to-translit-js');

	let allFriendsArr = [],	// array of full friends data
		idsList = [], 		// all friends ids arr
		listedIdsList = [], // listed friends ids arr
		unlistedFriendsSearchTerm = '',
		listedFriendsSearchTerm = '';

	let addListedId = function(id) {
		listedIdsList.push(parseInt(id));	
	}

	let removeListedId = function(id) {
		listedIdsList.splice(listedIdsList.indexOf(parseInt(id)), 1);
	}

	// helpers for building up friends lists
	let jsUcfirst = function(string) {
	    return string.charAt(0).toUpperCase() + string.slice(1);
	}

	let sortFriends = function(elemFn) {
		return (item1, item2) => {
			if (elemFn(item1) > elemFn(item2)) {
				return 1;	
			} 
			if (elemFn(item1) < elemFn(item2)) {
				return -1;	
			} 
			return 0;	
		}
	}

	let sortFriendsBySearchTerm = function(searchTerm) {
		searchTerm = searchTerm.toLowerCase();
		return (item) => {
			let fullName = `${item.first_name} ${item.last_name}`;

			fullName = fullName.toLowerCase();
			if (fullName.indexOf(searchTerm) !== -1 || searchTerm.length === 0) {
				return true;
			}
			return false;
		}
	}

	let getInitialData = function(initData) {
		listedIdsList = localStorage.data ? JSON.parse(localStorage.data) : [];
		allFriendsArr = initData
		    .map((item) => {
		    	item.first_name = jsUcfirst(cyrillicToTranslit().transform(item.first_name));	
		    	item.last_name = jsUcfirst(cyrillicToTranslit().transform(item.last_name));	
		    	return item;
		    })
		    .sort(sortFriends(elem => elem.last_name));

		idsList = allFriendsArr.map((item) => {
			return item.uid;
		});
	}

	// Function builds up both lists and fires each time friends adding, removing or search occures 
	let columnsLayout = function(friendsListsNodes, changed = false, elem = undefined) {
		if (changed == 'add') {
			addListedId(elem);		
		} else if (changed === 'remove') {
			removeListedId(elem);	
		} else if (changed == 'allUsersSearch') {
			unlistedFriendsSearchTerm = elem;
		} else if (changed == 'listedUsersSearch') {
			listedFriendsSearchTerm = elem;
		} 

		let listedFriendsArr = [];
	    let unlistedFriendsArr = [];  

	    // building up 2 arrays: list of listed and unlisted friends, 
		allFriendsArr.forEach((item) => {
			if (listedIdsList.indexOf(item.uid) !== -1) {
				item.draggable = false;
				item.moveClass = 'remove';
				listedFriendsArr.push(item);	
			} else {
				item.draggable = true;
				item.moveClass = 'add';
				unlistedFriendsArr.push(item);	
			}
		});

		// sorting listed friends according to order of ids in saved ids list
		listedFriendsArr.sort(sortFriends(elem => listedIdsList.indexOf(elem.uid)));

		// filtering lists according to search terms
		unlistedFriendsArr = unlistedFriendsArr.filter(sortFriendsBySearchTerm(unlistedFriendsSearchTerm));
		listedFriendsArr = listedFriendsArr.filter(sortFriendsBySearchTerm(listedFriendsSearchTerm));
	  	
	  	// building up lists html using handlebars template
		let unlistedFriendsHtmlList = friendsListTemplate({
			friends: unlistedFriendsArr
		});
		let listedFriendsHtmlList = friendsListTemplate({
			friends: listedFriendsArr
		});	

		// appending lists to the page
		friendsListsNodes[0].innerHTML = unlistedFriendsHtmlList;
		friendsListsNodes[1].innerHTML = listedFriendsHtmlList;
	}

	let saveToStorage = function() {
		localStorage.data = JSON.stringify(listedIdsList);
	}

	return {
		columnsLayout,
		getInitialData,
		saveToStorage
	}
}