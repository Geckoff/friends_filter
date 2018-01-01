import Columns from './modules/columns.js';
import VkCore from './modules/vkcore.js';
require("babel-polyfill");

const jsCookie = require('js-cookie'),
      toastr = require('toastr'),

	  contentBlock = document.querySelector('.content'),
 	  unlistedFriendsListNode = document.querySelector('#all-friends ul'),
	  listedFriendsListNode = document.querySelector('#picked-friends ul'),
	  friendsListsNodes = [unlistedFriendsListNode, listedFriendsListNode],

 	  columns = Columns(),
  	  vkCore = VkCore();

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
		columns.columnsLayout(friendsListsNodes, addRemove, userId);
	 } 
}); 
 
// list item dnd
friendsListsNodes.forEach((ulList) => {
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
				columns.columnsLayout(friendsListsNodes, 'add', friendId);
			} else {
				columns.columnsLayout(friendsListsNodes, 'remove', friendId);
			}
		}		
	});	
});

// search fields
document.querySelector('.header-bottom').addEventListener('keyup', (e) => {
	if (e.target.id === 'search-all-friends') {
		columns.columnsLayout(friendsListsNodes, 'allUsersSearch', e.target.value); 
	} else if (e.target.id ===  'search-picked-friends') {
		columns.columnsLayout(friendsListsNodes, 'listedUsersSearch', e.target.value); 
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
		     	columns.columnsLayout(friendsListsNodes); 
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