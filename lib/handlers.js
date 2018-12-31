const _data = require('./data');
const helpers = require('./helpers');

var handlers = {};

/**
 * Hello world handler
 * @return: None
 * @required_params: None
 * @optional_params: None
 */
handlers.hello = (data, callback) => {
    callback(200, {"msg": "Hello! From the other side"});
};

/**
 * Default handler 
 * @return: None
 * @required_params: None
 * @optional_params: None
 */
handlers.notFound = (data, callback) => {
    callback(404, {"msg": "Something goes wrong"});
};

/**
 * High level wrapper for users's handlers
 * @return: None
 * @required_params: None
 * @optional_params: None
 */
handlers.users = (data, callback) => {
    var acceptableMethods = ["post", "get", "put", "delete"];
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    } else {
        handlers.notFound(data, callback);
    }
};

/**
 * High levvel wrapper for token's handlers
 * @return: None
 * @required_params: None
 * @optional_params: None
 */
handlers.tokens = (data, callback) => {
    var acceptableMethods = ["post", "get", "put", "delete"];
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    } else {
        handlers.notFound(data, callback);
    }
};

handlers._tokens ={};
/**
 * Function to verify passed token
 * @return: true in case of valid token and false otherwise
 * @required_params:
 *  - token - token which should be verified
 *  - phone - the phone number supposed to correspond to the token
 * @optional_params: None
 */
handlers._tokens.verifyToken = (token, phone, callback) => {
    _data.read('tokens', token, (err, data) => {
        if(!err) {
            if(data.phone == phone && data.expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
};

handlers._users = {};

/**
 * Get the user information
 * @return: user info
 * @required_params:
 *  - phone - the user's phone number
 *  - token - security token
 * @optional_params: None
 */
handlers._users.get = (data, callback) => {
    var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? 
            data.queryStringObject.phone.trim() :  false;
    if(phone) {
        var token = typeof(data.queryStringObject.token) == 'string' ? data.queryStringObject.token : false;
        console.log(token);
        handlers._tokens.verifyToken(token, phone, (isVaild) => {
            if(isVaild) {
                _data.read('users', phone, (err, data) => {
                    if(!err) {
                        delete data.hashedPassword;
                        callback(200, data);
                    } else {
                        callback(404);
                    }
                });
            } else {
                callback(403, {'error': 'Incorrect token'});
            }
        });
   } else {
        callback(400, {"error": 'Missing required fields'});
    }
};

/**
 * Create new user
 * @return: 200OK in case of success or error code otherwise
 * @required_params:
 *  - firstName - user first name
 *  - lastName - the user last name
 *  - phone - the user phone number
 *  - password - the password
 *  - tos - some parameter
 * @optional_params: None
 */
handlers._users.post = (data, callback) => {
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    var tos = typeof(data.payload.tos) == 'boolean' && data.payload.tos == true ?  true : false;

    if(firstName && lastName && phone && password && tos) {
        _data.read('users', phone, (err, data) => {
            if(err) {
                var hashedPassword = helpers.hash(password);
                var userObject = {
                    'firstName': firstName,
                    'lastName': lastName,
                    'phone': phone,
                    'hashedPassword': hashedPassword,
                    'tos': tos
                };
                _data.create('users', phone, userObject, (err) => {
                    if(!err) callback(200);
                    else {
                        console.log(err);
                        callback(500, {"error": "Could not create new user"});
                    }
                });
            } else {
                callback(400, {"error": "A user with that phone number already exists"});
            }
        });
    } else {
        callback(400, {"error": "Missing required fields"});
    }
};

/**
 * Update the existing user info
 * @return: 200 OK in case of siuccess or error code otherwise
 * @required_params:
 *  - phone - the user phone number
 *  - token - security token
 * @optional_params: at least one should be specified
 *  - firstName - user first name
 *  - lastName - the user last name
 *  - password - the password
 *  - tos - some parameter
 */

handlers._users.put = (data, callback) => {
    var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? 
        data.queryStringObject.phone.trim() :  false;
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if(phone) {
        var token = typeof(data.queryStringObject.token) == 'string' ? data.queryStringObject.token : false;
        handlers._tokens.verifyToken(token, phone, (isVaild) => {
            if(isVaild) {
                if(firstName || lastName || password) {
                    _data.read('users', phone, (err, data) => {
                        if(!err && data) {
                            if(firstName) data.firstName = firstName;
                            if(lastName) data.lastName = lastName;
                            if(password) data.hashedPassword = helpers.hash(password);
                            _data.update('users', phone, data, (err) => {
                                if(!err) {
                                    callback(200);
                                } else {
                                    console.log(err);
                                    callback(500, {"error": "Could not update the user"});
                                }
                            });
                        } else {
                            callback(400, {"error": "The specified user does not exist"});
                        }
                    });
                } else {
                    callback(400, {"error": "Missing fields to update"});
                }
            } else {
                callback(403, {'error': 'Incorrect token'});
            }
        });
 
   } else {
        callback(400, {"error": "Missing required fields"});
    }
};

/**
 * 
 * Delete the user recoird
 * @return: 200 OK or error code otherwise
 * @required_params:
 *  - phone - the phone number
 *  - token - security token
 * @optional_params: None
 */
handlers._users.delete = (data, callback) => {
     var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? 
            data.queryStringObject.phone.trim() :  false;
    if(phone) {
        var token = typeof(data.queryStringObject.token) == 'string' ? data.queryStringObject.token : false;
        handlers._tokens.verifyToken(token, phone, (isVaild) => {
            if(isVaild) {
                _data.read('users', phone, (err, data) => {
                    if(!err) {
                        _data.delete('users', phone, (err) => {
                            if(!err) {
                                callback(200);
                            } else {
                                callback(500, {"error": "Could not delete the specified user"});
                            }
                        });
                    } else {
                        callback(404);
                    }
                });
            } else {
                callback(403, {'error': 'Incorrect token'});
            }
        });
    } else {
        callback(400, {"error": 'Missing required fields'});
    }
   
};

/**
 *  Get the token info
 * @return: token object
 * @required_params:
 *  - id - token id
 * @optional_params: None
 */
handlers._tokens.get = (data, callback) => {
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 10 ? 
            data.queryStringObject.id.trim() :  false;
    if(id) {
        _data.read('tokes', id, (err, data) => {
            if(!err) {
                callback(200, data);
            } else {
                callback(404);
            }
        });
    } else {
        callback(400, {"error": 'Missing required fields'});
    }

}

/**
 * Create the new token
 * @return: the new token
 * @required_params:
 *  - phone - the user'sphone number
 *  - password - the password corresponds to the user
 * @optional_params: None
 */
handlers._tokens.post = (data, callback) => {
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? 
        data.payload.phone.trim() :  false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if(phone && password) {
        _data.read('users', phone, (err, data) => {
            if(!err) {
                var hashedPassword = helpers.hash(password);
                if(hashedPassword == data.hashedPassword) {
                    var tokenID = helpers.createRandomString(20);
                    var expires = Date.now() + 1000 * 60 * 60;
                    var tokenObj = {
                        "phone": phone,
                        "id": tokenID,
                        "expires": expires
                    };
                    _data.create('tokens', tokenID, tokenObj, (err) => {
                        if(!err) {
                            callback(200, tokenObj);
                        } else {
                            callback(500, {'error': 'could not create token, maybe it already exist'});
                        }
                    });
                } else {
                    callback(400, {"error": "Password doesnt match"});
                }
            } else {
                callback(400, {"error": "Could notspecified user"});
            }
        });
    } else {
        callback(400, {"error": "Missing required fields"});
    }
}

/**
 * Update the new token
 * @return: 200 OK in case of succes or error otherwise
 * @required_params:
 *  - id - the token id
 *  - extend - boolean param specify should be the token extended or not
 * @optional_params: None
 */
handlers._tokens.put = (data, callback) => {
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length > 0 ? 
            data.queryStringObject.id.trim() :  false;
    var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ?  true : false;

    if(id && extend) {
        _data.read('tokens', id, (err, data) => {
            if(!err) {
                if(data.expires > Date.now()) {
                    data.expires = Date.now() + 1000 * 60 * 60;
                    _data.update('tokens', id, data, (err) => {
                        if(!err) {
                            callback(200);
                        } else {
                            callback(400, {'error': 'Could not update token\'s data'});
                        }
                    });
                } else {
                    callback(400, {'error': 'Token is expired and could not be extended'});
                }
            } else callback(400, {'error': 'Specified token does not exist'});
        });
    } else {
        callback(400, {"error": "Missing required fields or one of them is incorrect"});
    }
}

/**
 * Delete the token
 * @return: 200 ok in case of siccess or error otherwise
 * @required_params:
 *  - id - the token id
 * @optional_params: None
 */
handlers._tokens.delete = (data, callback) => {
     var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length > 0 ? 
            data.queryStringObject.id.trim() :  false;
    if(id) {
        _data.read('tokens', id, (err, data) => {
            if(!err) {
                _data.delete('tokens', id, (err) => {
                    if(!err) {
                        callback(200);
                    } else {
                        callback(500, {"error": "Could not delete the specified token"});
                    }
                });
            } else {
                callback(404);
            }
        });
    } else {
        callback(400, {"error": 'Missing required fields'});
    }
 
}

module.exports = handlers;