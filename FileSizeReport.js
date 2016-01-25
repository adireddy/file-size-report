module.exports = function(opts) {
    var fs = require('fs');

    var _folder = opts.path;
    var _reportJsonFile = opts.output;
    var _data = {};

    _getRecursiveFileCount(_folder);

    try {
        fs.writeFileSync(_reportJsonFile, JSON.stringify(_data));
    }
    catch (e) {
        console.log("can't write JSON file - " + _reportJsonFile);
    }

    function _getRecursiveFileCount(folder) {
        try {
            var files = fs.readdirSync(folder);
            for (var i = 0; i < files.length; i++) {
                var stats = fs.statSync(folder + "/" + files[i]);
                if (stats.isDirectory()) _getRecursiveFileCount(folder + "/" + files[i]);
                else _data[folder + "/" + files[i]] = stats.size;
            }
        }
        catch (e) {
            console.log("can't read directory - " + _folder);
        }
    }
}