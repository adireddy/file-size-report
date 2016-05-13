module.exports = function(opts) {
    var fs = require("fs");
    var _folder = opts.path;
    var _reportJsonFile = opts.output;

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

    var _data = {};
    var _counter = 0;
    var _totalFiles = 0;

    _getRecursiveFileCount(_folder);

    function _getRecursiveFileCount(folder) {
        try {
            var files = fs.readdirSync(folder);
            for (var i = 0; i < files.length; i++) {
                var stats = fs.statSync(folder + "/" + files[i]);
                if (stats.isDirectory()) _getRecursiveFileCount(folder + "/" + files[i]);
                else {
                    _totalFiles++;
                    var name = folder + "/" + files[i];
                    var dimensions = {"width": 0, "height": 0, "type": 'unknown'};
                    name = name.substring(_folder.length + 1, name.length);
                    _data[name] = {};
                    _data[name]["size"] = stats.size;

                    if (types.indexOf(files[i].substring(files[i].lastIndexOf(".") + 1, files[i].length)) > -1) {
                        _getFileDimensions(folder + "/" + files[i], _data[name]);
                    }
                    else {
                        _counter++;
                    }
                }
            }
        }
        catch (e) {
            console.log("can't read directory - " + _folder);
        }
    }

    function _writeReport() {
        try {
            fs.writeFileSync(_reportJsonFile, JSON.stringify(_data));
        }
        catch (e) {
            console.log("can't write JSON file - " + _reportJsonFile);
        }
    }

    function _getFileDimensions(path, data) {
        _asyncFileToBuffer(path, function (err, buffer) {
            var dimensions;
            try {
                dimensions = _lookup(buffer, path);
            }
            catch (e) {
                err = e;
            }
            _counter++;
            data["stats"] = dimensions;
            if (_counter == _totalFiles) _writeReport();
        });
    }

    function _asyncFileToBuffer(filepath, callback) {
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

    function _lookup(buffer, filepath) {
        var type = _detector(buffer, filepath);
        if (type in handlers) {
            var size = handlers[type].calculate(buffer, filepath);
            if (size !== false) {
                size.type = type;
                return size;
            }
        }
        throw new TypeError("unsupported file type");
    }

    function _detector(buffer, filepath) {
        var type, result;
        for (type in typeMap) {
            result = typeMap[type](buffer, filepath);
            if (result) {
                return type;
            }
        }
    }
}