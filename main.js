#!/usr/bin/env node

var _ = require('underscore')._;
var winston = require('winston');

var filesizereport = require('./report');

var optimist = require('optimist')
    .options('output', {
        alias: 'o'
        , 'default': './report.json'
        , describe: 'Output JSON file name.'
    })
    .options('path', {
        alias: 'p'
        , 'default': './'
        , describe: 'Folder path.'
    });

var argv = optimist.argv;
var opts = _.extend({}, argv);

winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
    colorize: true
    , level: argv.log
    , handleExceptions: false
});
winston.debug('Parsed arguments', argv);

opts.logger = winston;

filesizereport(opts, function(err, obj) {
    if (err) {
        winston.error(err);
        process.exit(0);
    }
});