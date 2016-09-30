var fs = require("fs");

module.exports = function(opts) {
    var folder = opts.path;
    var reportJsonFile = opts.output;
    var ignoreList = [".DS_Store"];

    var handlers = {};
    var typeMap = {};
    var types = ["gif", "jpg", "png", "svg", "bmp"];
    types.forEach(function (type) {
        handlers[type] = require("./types/" + type);
    });
    types.forEach(function (type) {
        typeMap[type] = require("./types/" + type).detect;
    });
    var MaxBufferSize = 128 * 1024;

    var data = {};
    var counter = 0;
    var totalFiles = 0;

    getRecursiveFileCount(folder);

    function getRecursiveFileCount(folder) {
        try {
            var files = fs.readdirSync(folder);
            for (var i = 0; i < files.length; i++) {
                var stats = fs.statSync(folder + "/" + files[i]);
                if (stats.isDirectory()) getRecursiveFileCount(folder + "/" + files[i]);
                else {
                    if (ignoreList.indexOf(files[i]) > -1) continue;
                    totalFiles++;
                    var name = folder + "/" + files[i];

                    var dimensions = {"width": 0, "height": 0, "type": 'unknown'};
                    name = name.substring(folder.length + 1, name.length);
                    data[name] = {};
                    data[name]["size"] = stats.size;

                    if (types.indexOf(files[i].substring(files[i].lastIndexOf(".") + 1, files[i].length)) > -1) {
                        getFileDimensions(folder + "/" + files[i], data[name]);
                    }
                    else {
                        counter++;
                        if (counter == totalFiles) writeReport();
                    }
                }
            }
        }
        catch (e) {
            console.log("can't read directory - " + folder);
        }
    }

    function writeReport() {
        try {
            fs.writeFileSync(reportJsonFile, JSON.stringify(data));
        }
        catch (e) {
            console.log("can't write JSON file - " + reportJsonFile);
        }
    }

    function getFileDimensions(path, data) {
        asyncFileToBuffer(path, function (err, buffer) {
            var dimensions;
            try {
                dimensions = lookup(buffer, path);
            }
            catch (e) {
                err = e;
            }
            counter++;
            data["stats"] = dimensions;
            if (counter == totalFiles) writeReport();
        });
    }

    function asyncFileToBuffer(filepath, callback) {
        try {
            fs.open(filepath, "r", function (err, descriptor) {
                if (err) {
                    return callback(err);
                }
                var size = fs.fstatSync(descriptor).size;
                var bufferSize = Math.min(size, MaxBufferSize);
                var buffer = new Buffer(bufferSize);
                try {
                    fs.read(descriptor, buffer, 0, bufferSize, 0, function (err) {
                        if (err) {
                            return callback(err);
                        }
                        fs.close(descriptor, function (err) {
                            callback(err, buffer);
                        });
                    });
                }
                catch (e) {}
            });
        }
        catch (e) {}
    }

    function lookup(buffer, filepath) {
        var type = detector(buffer, filepath);
        if (type in handlers) {
            var size = handlers[type].calculate(buffer, filepath);
            if (size !== false) {
                size.type = type;
                return size;
            }
        }
        throw new TypeError("unsupported file type");
    }

    function detector(buffer, filepath) {
        var type, result;
        for (type in typeMap) {
            result = typeMap[type](buffer, filepath);
            if (result) {
                return type;
            }
        }
    }
}