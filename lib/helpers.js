const crypto = require('crypto');
const config = require('./config');

var helpers = {};
/**
 * Simple hash function
 * @return: hashed string
 * @required_params:
 *  - str - the string which should be hashed
 * @optional_params: None
 */
helpers.hash = (str) => {
    if(typeof(str) == 'string' && str.length > 0) {
        var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
        return hash;
    } else {
        return false;
    }
};

/**
 * JSON to Object parser
 * @return: internal object
 * @required_params:
 *  - str - stringified json
 * @optional_params: None
 */
helpers.parseJsonToObject = (str) => {
    try {
        var obj = JSON.parse(str);
        return obj;
    } catch {
        return {};
    }
};

/**
 * The pseudo-random string generator
 * @return: string
 * @required_params:
 *  - length - the length of string
 * @optional_params: None
 */
helpers.createRandomString = (length) => {
    length = typeof(length) == 'number' && length > 0 ? length : 10;
    var posChars = 'abcdefgijklmnopqrstuwvwxyz01234567890';
    var str = '';
    for(i = 1; i <= length; i++) {
        str += posChars.charAt(Math.floor(Math.random() * posChars.length));
    }
    return str;
};

module.exports = helpers;