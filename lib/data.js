const fs = require('fs');
const path = require('path');

var lib = {};

lib.baseDir = path.join(__dirname, '/../.data/');

/**
 * Create new file in case it not exists yet
 * @return: None
 * @required_params:
 *  - dir - folder name
 *  - fname - file name
 *  - data - the file content
 * @optional_params: None
 */
lib.create = (dir, fname, data, callback) => {
    fs.open(lib.baseDir+dir+'/'+fname+'.json', 'wx', (err, fileDescriptior) => {
        if(!err && fileDescriptior) {
            var strData = JSON.stringify(data);
            fs.writeFile(fileDescriptior, strData, (err) => {
                if(!err) {
                    fs.close(fileDescriptior, (err) => {
                        if(!err) {
                            callback(false);
                        } else {
                            callback("Error closing new file");
                        }
                    });
                } else {
                    callback('Could not write the data into the file');
                }
            });
        } else {
            callback('Could not create new file it may already exist');
        }
    });
};

/**
 * read the existing file
 * @return: the file content
 * @required_params: 
 *  - dir - folder name
 *  - fname - filename
 * @optional_params: None
 */
lib.read = (dir, fname, callback) => {
    fs.readFile(lib.baseDir+dir+'/'+fname+'.json', 'utf8', (err, data) => {
        if(!err) callback(err, JSON.parse(data));
        else callback(err, {"error": "cannot read the file"});
    });
};

/**
 * update the content of the existing file
 * @return: None
 * @required_params:
 *  - dir - folder name
 *  - fname - filename
 *  - data - the file content
 * @optional_params: None
 */
lib.update = (dir, fname, data, callback) => {
    fs.open(lib.baseDir+dir+'/'+fname+'.json', 'r+', (err, fileDescriptor) => {
        if(!err && fileDescriptor) {
            fs.truncate(fileDescriptor, (err) => {
                if(!err) {
                    var strData = JSON.stringify(data);
                    fs.writeFile(fileDescriptor, strData, (err) => {
                        if(!err) {
                            fs.close(fileDescriptor, (err) => {
                                if(!err) callback(false);
                                else callback("Cannot close the file");
                            });
                        } else {
                            callback("Eror writing data to file");
                        }
                    });
                } else {
                    callback("Erro truncating file");
                }
            });
        } else {
            callback('Could not open file for updating, it may not existy yet');
        }
    });
};

/**
 * delete the existing file
 * @return: None
 * @required_params: 
 *  - dir - folder name
 *  - fname - filename
 * @optional_params: None
 */
lib.delete = (dir, fname, callback) => {
    fs.unlink(lib.baseDir+dir+'/'+fname+'.json', (err) => {
        if(!err) callback(false);
        else callback("Cannot delete the file");
    });
};

module.exports = lib;