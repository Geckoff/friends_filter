
// VK core functions
VK.init({
    apiId: 6309277
});

let auth = function() {
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

let logout = function() {
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

let callAPI = function(method, params) {
    return new Promise((resolve, reject) => {
        params.v = '5.69';

        VK.api(method, params, (response) => {
            if (response.error) {
                reject(response.error);
            } else {
                resolve(response);
            }
        });
    });
}

let vkInit = async function(){
    await auth();    
    let response = await callAPI('friends.get', {fields: 'photo_50', order: 'name'});
    return response.response;        
}

export {
    vkInit,
    logout  
}
