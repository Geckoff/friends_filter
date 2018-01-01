require("babel-polyfill");
var jsCookie = require('js-cookie');
var toastr = require('toastr');

let contentBlock = document.querySelector('.content');
let unlistedFriendsListNode = document.querySelector('#all-friends ul');
let listedFriendsListNode = document.querySelector('#picked-friends ul');

let columns = Columns();
let vkCore = VkCore();

toastr.options = {
  "closeButton": false,
  "debug": false,
  "newestOnTop": false,
  "progressBar": false,
  "positionClass": "toast-bottom-right",
  "preventDuplicates": false,
  "onclick": null,
  "showDuration": "300",
  "hideDuration": "300",
  "timeOut": "2000",
  "extendedTimeOut": "1000",
  "showEasing": "swing",
  "hideEasing": "linear",
  "showMethod": "fadeIn",
  "hideMethod": "fadeOut"
};

// click on authorization button
document.getElementById('auth-button').addEventListener('click', (e) => {
	document.getElementById('auth-button').classList.add('loading');
	document.getElementById('auth-button').setAttribute('disabled', true);
	vkStart(false);
});

// click on logout button
document.getElementById('logout').addEventListener('click', () => {
	vkLogout();
});

// click on add/remove button in list item
contentBlock.addEventListener('click', (e) => {
	if (e.target.classList[0] === 'add' || e.target.parentNode.parentNode.classList[0] === 'add' || e.target.parentNode.classList[0] === 'add' || e.target.classList[0] === 'remove' || e.target.parentNode.classList[0] === 'remove' || e.target.parentNode.parentNode.classList[0] === 'remove') {
		let elementToAdd = e.target.closest('li');
		let addRemove = elementToAdd.querySelector('span').classList[0];
		let userId = elementToAdd.dataset.id;
		columns.columnsLayout(addRemove, userId);
	 } 
});

// list item dnd
[unlistedFriendsListNode, listedFriendsListNode].forEach((ulList) => {
	ulList.addEventListener('dragstart', (e) => {
		if (e.target.tagName === 'LI') {	
			let id = e.target.dataset.id;
			let type = e.target.parentNode.parentNode.id;
			let transferObj = {
				id: id,
				type: type
			}
			let jsonTransferObj = JSON.stringify(transferObj);
			e.dataTransfer.setData('text/plain', jsonTransferObj);
		}
	});

	ulList.addEventListener('dragover', (e) => {
		e.preventDefault();
	});

	ulList.addEventListener('drop', (e) => {
		e.preventDefault();
		let dataObj = JSON.parse(e.dataTransfer.getData('text/plain'));
		let friendId = parseInt(dataObj.id);
		let listType = dataObj.type;
		let currentListType = e.currentTarget.parentNode.id;

		if (listType !== currentListType) {
			if (listType === 'all-friends') {
				columns.columnsLayout('add', friendId);
			} else {
				columns.columnsLayout('remove', friendId);
			}
		}		
	});	
});

// search fields
document.querySelector('.header-bottom').addEventListener('keyup', (e) => {
	if (e.target.id === 'search-all-friends') {
		columns.columnsLayout('allUsersSearch', e.target.value); 
	} else if (e.target.id ===  'search-picked-friends') {
		columns.columnsLayout('listedUsersSearch', e.target.value); 
	}	
});

// saving picked friends list
document.getElementById('savelist').addEventListener('click', () => {
	columns.saveToStorage();
	toastr.success('List has been saved');
});

// VK intialization
// @param {rigthAway} bool - whether in previous session VK logout was made (false), or VK connection was not terminated (true)

async function vkStart(rigthAway){  
    try {    		    
	    let response = await vkCore.vkInit();	    	
		jsCookie.set('vk_auth', 'true', { expires: 1 });	
	    columns.getInitialData(response); 

		await (async function(){
			new Promise((resolve, reject) => {
		     	columns.columnsLayout(); 
		     	resolve();   
		    });
		})();

		contentBlock.classList.add('loaded');	
		document.getElementById('auth-button').classList.remove('loading');
		document.getElementById('auth-button').removeAttribute('disabled');

		if (!rigthAway) {
			changeAuthorised(true);
		}

		addTransition();
	} catch(e) {
		document.getElementById('auth-button').classList.remove('loading');
		document.getElementById('auth-button').removeAttribute('disabled');
	}
}

// VK logout
async function vkLogout() {
	changeAuthorised(false);
	await vkCore.logout();
	jsCookie.set('vk_auth', 'false', { expires: 30 });
}

// design features helpers
function addTransition() {
	document.getElementById('filter').style.transitionDuration = '.3s';	
	document.getElementById('logo').style.transitionDuration = '.3s';	
}

function changeAuthorised(removeAdd) {
	let elemsToEdit = [
		document.getElementById('filter'),
		document.getElementById('logo'),
		document.body
	]
	elemsToEdit.forEach((elem) => {
		if (removeAdd) {
			elem.classList.add('authorized');	
		} else {
			elem.classList.remove('authorized');		
		}
	});
}

// script start
// vk_auth cookie determines if friends lists block should be loaded on page load or not.
// friends lists block loads right away if there was no logout in previous session 
if (jsCookie.get('vk_auth') === 'true') {
	changeAuthorised(true);
	vkStart(true);
} else {
	addTransition();	
}








function VkCore() {
	// VK core functions
	VK.init({
	    apiId: 6309277
	});

	function auth() {
	    return new Promise((resolve, reject) => {
	        VK.Auth.login((data) => {
	            if (data.session) {
	                resolve();
	            } else {
	                reject(new Error('AUTHENTICATION ERROR!'));
	            }
	        }, 2);
	    });
	}

	function logout() {
		return new Promise((resolve, reject) => {
	        VK.Auth.logout((data) => {
	            if (data.session === null) {
	                resolve();
	            } else {
	                reject(new Error('Something went wrong!'));
	            }
	        });
	    });
	}

	function callAPI(method, params) {
	    return new Promise((resolve, reject) => {
	        VK.api(method, params, (response) => {
	            if (response.error) {
	                reject(response.error);
	            } else {
	                resolve(response);
	            }
	        });
	    });
	}

	async function vkInit(){

	    await auth();    

	    let response = await callAPI('friends.get', {fields: 'photo_50', order: 'name'});
	    return response.response;        
	}

	return {
		vkInit,
		logout	
	}
}


function Columns() {

	var friendsListTemplate = require("./friends.handlebars");
	var cyrillicToTranslit = require('cyrillic-to-translit-js');

	let allFriendsArr = []; 			// array of full friends data
	let idsList = []; 					// all friends ids arr
	let listedIdsList = []; 			// listed friends ids arr
	let unlistedFriendsSearchTerm = '';
	let listedFriendsSearchTerm = '';

	function addListedId(id) {
		listedIdsList.push(parseInt(id));	
	}

	function removeListedId(id) {
		listedIdsList.splice(listedIdsList.indexOf(parseInt(id)), 1);
	}

	// helpers for building up friends lists
	function jsUcfirst(string) {
	    return string.charAt(0).toUpperCase() + string.slice(1);
	}

	function sortFriends(elemFn) {
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

	function sortFriendsBySearchTerm(searchTerm) {
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

	function getInitialData(initData) {
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
	function columnsLayout(changed = false, elem = undefined) {
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
		unlistedFriendsListNode.innerHTML = unlistedFriendsHtmlList;
		listedFriendsListNode.innerHTML = listedFriendsHtmlList;
	}

	function saveToStorage() {
		localStorage.data = JSON.stringify(listedIdsList);
	}

	return {
		columnsLayout,
		getInitialData,
		saveToStorage
	}
}