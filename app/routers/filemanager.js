var path = require('path'),
    archiver = require('archiver'),
    multer = require('multer'),
    fs = require('fs-extra');

const contentRootPath = `${__base}public/`;

var filemanager = {
    ReadDirectories:function (file,req) {
        var cwd = {};
        var directoryList = [];
        function stats(file) {
            return new Promise((resolve, reject) => {
                fs.stat(file, (err, cwd) => {
                    if (err) {
                        return reject(err);
                    }
                    cwd.name = path.basename(contentRootPath + req.body.path + file);
                    cwd.size = (cwd.size);
                    cwd.isFile = cwd.isFile();
                    cwd.dateModified = cwd.ctime;
                    cwd.dateCreated = cwd.mtime;
                    cwd.filterPath = req.body.data.length > 0 ? filemanager.getRelativePath(contentRootPath, contentRootPath + req.body.path, req) : "";
                    cwd.type = path.extname(contentRootPath + req.body.path + file);
                    if (fs.lstatSync(file).isDirectory()) {
                        fs.readdirSync(file).forEach(function (items) {
                            if (fs.statSync(path.join(file, items)).isDirectory()) {
                                directoryList.push(items[i]);
                            }
                            if (directoryList.length > 0) {
                                cwd.hasChild = true;
                            } else {
                                cwd.hasChild = false;
                                directoryList = [];
                            }
                        });
                    } else {
                        cwd.hasChild = false;
                        dir = [];
                    }
                    directoryList = [];
                    resolve(cwd);
                });
            });
        }
        var promiseList = [];
        for (var i = 0; i < file.length; i++) {
            promiseList.push(stats(path.join(contentRootPath + req.body.path, file[i])));
        }
        return Promise.all(promiseList);
    }
,
    fromDir:function (startPath, filter, contentRootPath) {
        if (!fs.existsSync(startPath)) {
            return;
        }
        var files = fs.readdirSync(startPath);
        for (var i = 0; i < files.length; i++) {
            var filename = path.join(startPath, files[i]);
            var stat = fs.lstatSync(filename);
            if (stat.isDirectory()) {
                filemanager.fromDir(filename, filter, contentRootPath); //recurse
            }
            else if (files[i].indexOf(filter) >= 0) {
                var cwd = {};
                var stats = fs.statSync(filename);
                cwd.name = path.basename(filename);
                cwd.size = stats.size;
                cwd.isFile = stats.isFile();
                cwd.dateModified = stats.mtime;
                cwd.dateCreated = stats.ctime;
                cwd.type = path.extname(filename);
                cwd.filterPath = filename.substr((contentRootPath.length), filename.length).replace(files[i], "");
                if (fs.lstatSync(filename).isFile()) {
                    cwd.hasChild = false;
                }
                if (fs.lstatSync(filename).isDirectory()) {
                    var statsRead = fs.readdirSync(filename);
                    cwd.hasChild = statsRead.length > 0;
                }
                fileList.push(cwd);
            }
        }
    },
    GetFiles: function (req, res) {
        return new Promise((resolve, reject) => {
            fs.readdir(contentRootPath + req.body.path, function (err, files) {
                //handling error
                if (err) {
                    console.log(err);
                    reject(err);

                } else
                    resolve(files);
            });
        });
    },
    /**
     * 
     * function to check for exising folder or file
     */
    checkForDuplicates: function (directory, name, isFile) {
        var filenames = fs.readdirSync(directory);
        if (filenames.indexOf(name) == -1) {
            return false;
        } else {
            for (var i = 0; i < filenames.length; i++) {
                if (filenames[i] === name) {
                    if (!isFile && fs.lstatSync(directory + "/" + filenames[i]).isDirectory()) {
                        return true;
                    } else if (isFile && !fs.lstatSync(directory + "/" + filenames[i]).isDirectory()) {
                        return true;
                    } else {
                        return false;
                    }
                }
            }
        }
    },
    /**
     * function to rename the folder
     */
    renameFolder: function (req, res) {
        var oldDirectoryPath = path.join(contentRootPath + req.body.path, req.body.name);
        var newDirectoryPath = path.join(contentRootPath + req.body.path, req.body.newName);
        if (checkForDuplicates(contentRootPath + req.body.path, req.body.newName, req.body.data[0].isFile)) {
            var errorMsg = new Error();
            errorMsg.message = "A file or folder with the name " + req.body.name + " already exists.";
            errorMsg.code = "400";
            response = { error: errorMsg };

            response = JSON.stringify(response);
            res.setHeader('Content-Type', 'application/json');
            res.json(response);
        } else {
            fs.renameSync(oldDirectoryPath, newDirectoryPath);
            (async () => {
                await FileManagerDirectoryContent(req, res, newDirectoryPath).then(data => {
                    response = { files: data };
                    response = JSON.stringify(response);
                    res.setHeader('Content-Type', 'application/json');
                    res.json(response);
                });
            })();
        }
    },
    /**
     * function to delete the folder
     */
    deleteFolder: function (req, res) {
        var deleteFolderRecursive = function (path) {
            if (fs.existsSync(path)) {
                fs.readdirSync(path).forEach(function (file, index) {
                    var curPath = path + "/" + file;
                    if (fs.lstatSync(curPath).isDirectory()) { // recurse
                        deleteFolderRecursive(curPath);
                    } else { // delete file
                        fs.unlinkSync(curPath);
                    }
                });
                fs.rmdirSync(path);
            }
        };
        var promiseList = [];
        for (var i = 0; i < req.body.names.length; i++) {
            var newDirectoryPath = path.join(contentRootPath + req.body.path, req.body.names[i]);

            promiseList.push(FileManagerDirectoryContent(req, res, newDirectoryPath));
        }
        Promise.all(promiseList).then(data => {
            data.forEach(function (files) {
                if (fs.lstatSync(path.join(contentRootPath + req.body.path, files.name)).isFile()) {
                    fs.unlinkSync(path.join(contentRootPath + req.body.path, files.name));

                } else {
                    deleteFolderRecursive(path.join(contentRootPath + req.body.path, files.name));
                }
            });
            response = { files: data };
            response = JSON.stringify(response);
            res.setHeader('Content-Type', 'application/json');
            res.json(response);
        });
    },
    /**
     * function to create the folder
     */
    createFolder: function (req, res, filepath) {
        var newDirectoryPath = path.join(contentRootPath + req.body.path, req.body.name);
        if (fs.existsSync(newDirectoryPath)) {
            var errorMsg = new Error();
            errorMsg.message = "A file or folder with the name " + req.body.name + " already exists.";
            errorMsg.code = "400";
            response = { error: errorMsg };

            response = JSON.stringify(response);
            res.setHeader('Content-Type', 'application/json');
            res.json(response);
        } else {
            fs.mkdirSync(newDirectoryPath);
            (async () => {
                await FileManagerDirectoryContent(req, res, newDirectoryPath).then(data => {
                    response = { files: data };
                    response = JSON.stringify(response);
                    res.setHeader('Content-Type', 'application/json');
                    res.json(response);
                });
            })();
        }
    },
    /**
     * function to get the file details like path, name and size
     */
    fileDetails: function (req, res, filepath) {
        return new Promise((resolve, reject) => {
            var cwd = {};
            fs.stat(filepath, function (err, stats) {
                cwd.name = path.basename(filepath);
                cwd.size = filemanager.getSize(stats.size);
                cwd.isFile = stats.isFile();
                cwd.modified = stats.ctime;
                cwd.created = stats.mtime;
                cwd.type = path.extname(filepath);
                cwd.location = filepath.substr(filepath.indexOf(req.body.path), filepath.length - 1);
                resolve(cwd);
            });
        });
    },

    /** 
     * function to get the folder size
     */
    getFolderSize: function (req, res, directory, sizeValue) {
        size = sizeValue;
        var filenames = fs.readdirSync(directory);
        for (var i = 0; i < filenames.length; i++) {
            if (fs.lstatSync(directory + "/" + filenames[i]).isDirectory()) {
                filemanager.getFolderSize(req, res, directory + "/" + filenames[i], size);
            } else {
                const stats = fs.statSync(directory + "/" + filenames[i]);
                size = size + stats.size;
            }
        }
    },

    /**
     * function to get the size in kb, MB
     */
    getSize: function (size) {
        var hz;
        if (size < 1024) hz = size + ' B';
        else if (size < 1024 * 1024) hz = (size / 1024).toFixed(2) + ' KB';
        else if (size < 1024 * 1024 * 1024) hz = (size / 1024 / 1024).toFixed(2) + ' MB';
        else hz = (size / 1024 / 1024 / 1024).toFixed(2) + ' GB';
        return hz;
    },
    getFileDetails: function (req, res, filterPath) {
        var isNamesAvailable = req.body.names.length > 0 ? true : false;
        if (req.body.names.length == 0 && req.body.data != 0) {
            var nameValues = [];
            req.body.data.forEach(function (item) {
                nameValues.push(item.name);
            });
            req.body.names = nameValues;
        }
        if (req.body.names.length == 1) {
            filemanager.fileDetails(req, res, filterPath + (isNamesAvailable ? req.body.names[0] : "")).then(data => {
                if (!data.isFile) {
                    filemanager.getFolderSize(req, res, filterPath + (isNamesAvailable ? req.body.names[0] : ""), 0);
                    data.size = filemanager.getSize(size);
                    size = 0;
                }
                response = { details: data };
                response = JSON.stringify(response);
                res.setHeader('Content-Type', 'application/json');
                res.json(response);
            });
        } else {
            req.body.names.forEach(function (item) {
                if (fs.lstatSync(filterPath + item).isDirectory()) {
                    filemanager.getFolderSize(req, res, filterPath + item, size);
                } else {
                    const stats = fs.statSync(filterPath + item);
                    size = size + stats.size;
                }
            });
            filemanager.fileDetails(req, res, filterPath + req.body.names[0]).then(data => {
                data.name = req.body.names.join(", ");
                data.multipleFiles = true;
                data.size = filemanager.getSize(size);
                size = 0;
                response = { details: data };
                response.details.location = filterPath.substr(filterPath.indexOf(":") + 1, filterPath.length - 1);
                response = JSON.stringify(response);
                res.setHeader('Content-Type', 'application/json');
                res.json(response);
            });
        }
    },

    copyFolder: function (source, dest) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }
        files = fs.readdirSync(source);
        files.forEach(function (file) {
            var curSource = path.join(source, file);
            if (fs.lstatSync(curSource).isDirectory()) {
                filemanager.copyFolder(curSource, path.join(dest, file)); source
            } else {
                fs.copyFileSync(path.join(source, file), path.join(dest, file), (err) => {
                    if (err) throw err;
                });
            }
        });
    },
    /**
     * function copyfile and folder
     */
    CopyFiles: function (req, res, contentRootPath) {
        var fileList = [];
        req.body.data.forEach(function (item) {
            if (item.isFile) {
                fs.copyFileSync(path.join(contentRootPath + req.body.path + req.path + item.name), path.join(contentRootPath + req.body.targetPath + item.name), (err) => {
                    if (err) throw err;
                });
            }
            else {
                var fromPath = contentRootPath + req.body.path + req.path + item.name;
                var toPath = contentRootPath + req.body.targetPath + item.name;
                copyFolder(fromPath, toPath)
            }
            var list = item;
            list.filterPath = req.body.targetPath;
            fileList.push(list);
        });
        response = { files: fileList };
        response = JSON.stringify(response);
        res.setHeader('Content-Type', 'application/json');
        res.json(response);
    },

    MoveFolder: function (source, dest) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }
        files = fs.readdirSync(source);
        files.forEach(function (file) {
            var curSource = path.join(source, file);
            if (fs.lstatSync(curSource).isDirectory()) {
                MoveFolder(curSource, path.join(dest, file));
                fs.rmdirSync(curSource);
            } else {
                fs.copyFileSync(path.join(source, file), path.join(dest, file), (err) => {
                    if (err) throw err;
                });
                fs.unlinkSync(path.join(source, file), function (err) {
                    if (err) throw err;
                });
            }
        });
    },
    /**
     * function move files and folder
     */
    MoveFiles: function (req, res, contentRootPath) {
        var fileList = [];
        req.body.data.forEach(function (item) {
            if (item.isFile) {
                var source = fs.createReadStream(path.join(contentRootPath + req.body.path + req.path + item.name));
                var desti = fs.createWriteStream(path.join(contentRootPath + req.body.targetPath + item.name));
                source.pipe(desti);
                source.on('end', function () {
                    fs.unlinkSync(path.join(contentRootPath + req.body.path + req.path + item.name), function (err) {
                        if (err) throw err;
                    });
                });
            }
            else {
                var fromPath = contentRootPath + req.body.path + req.path + item.name;
                var toPath = contentRootPath + req.body.targetPath + item.name;
                MoveFolder(fromPath, toPath);
                fs.rmdirSync(fromPath);
            }
            var list = item;
            list.filterPath = req.body.targetPath;
            fileList.push(list);
        });
        response = { files: fileList };
        response = JSON.stringify(response);
        res.setHeader('Content-Type', 'application/json');
        res.json(response);
    },

    getRelativePath: function (rootDirectory, fullPath) {
        if (rootDirectory.substring(rootDirectory.length - 1) == "/") {
            if (fullPath.indexOf(rootDirectory) >= 0) {
                return fullPath.substring(rootDirectory.length - 1);
            }
        }
        else if (fullPath.indexOf(rootDirectory + "/") >= 0) {
            return "/" + fullPath.substring(rootDirectory.length + 1);
        }
    },
    /**
     * returns the current working directories
     */
    FileManagerDirectoryContent: function (req, res, filepath) {
        var contentRootPath;
        if (req.path == "/") {
            contentRootPath = filepath;
        } else {
            contentRootPath = filepath.substring(0, (filepath.indexOf(req.body.path)));
        }

        return new Promise((resolve, reject) => {
            var cwd = {};
            fs.stat(filepath, function (err, stats) {
                cwd.name = path.basename(filepath);
                cwd.size = filemanager.getSize(stats.size);
                cwd.isFile = stats.isFile();
                cwd.dateModified = stats.ctime;
                cwd.dateCreated = stats.mtime;
                cwd.type = path.extname(filepath);
                cwd.filterPath = req.body.data.length > 0 ? filemanager.getRelativePath(contentRootPath, contentRootPath + req.body.path.substring(0, req.body.path.indexOf(req.body.data[0].name))) : "";
                if (fs.lstatSync(filepath).isFile()) {
                    cwd.hasChild = false;
                    resolve(cwd);
                }
            });
            if (fs.lstatSync(filepath).isDirectory()) {
                fs.readdir(filepath, function (err, stats) {
                    stats.forEach(stat => {
                        if (fs.lstatSync(filepath + stat).isDirectory()) {
                            cwd.hasChild = true
                        } else {
                            cwd.hasChild = false;
                        }
                        if (cwd.hasChild) return;
                    });
                    resolve(cwd);
                });
            }
        });
    }

};

module.exports = filemanager;