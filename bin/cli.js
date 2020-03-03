#!/usr/bin/env node

/**
 * @file wxml convert swan
 * @author yican
 */
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));
const pkg = require('../package.json');
const wxmp2swan = require('../index');
const chalk = require('chalk');

const usage = `Usage:
        ${chalk.cyan('iyourcarWx2tt')} ${chalk.green('<entry-directory>')}
        ${chalk.cyan('iyourcarWx2tt')} ${chalk.green('<entry-directory>')} ${chalk.green('[output-directory]')} ${chalk.green('[log-directory]')}
        or:
        ${chalk.cyan('iyourcarWx2tt')} ${chalk.green('<entry-file>')}
        ${chalk.cyan('iyourcarWx2tt')} ${chalk.green('<entry-file>')} ${chalk.green('{output-directory | output-file}')} ${chalk.green('[log-directory]')}

    For example:w
        ${chalk.cyan('iyourcarWx2tt')} ${chalk.green('./test/demo')}
        ${chalk.cyan('iyourcarWx2tt')} ${chalk.green('./test/demo')} ${chalk.green('./test/swanDemo')}
        or:
        ${chalk.cyan('iyourcarWx2tt')} ${chalk.green('./test/demo.js')}
        ${chalk.cyan('iyourcarWx2tt')} ${chalk.green('./test/demo.js')} ${chalk.green('./test')}
        ${chalk.cyan('iyourcarWx2tt')} ${chalk.green('./test/demo.wxml')} ${chalk.green('./test/rename-demo.swan')}`;

if (argv.V || argv.version) {
    console.log(chalk.green(pkg.version));
    process.exit(0);
}
if (argv.h || argv.help) {
    const helpOptions = `
    ${usage}

        Only ${chalk.green('<entry-directory>')} and ${chalk.green('<entry-file>')} is required

    Options:
        -V, --version                            output the version number
        -h, --help                               output usage information
    `;
    console.log(helpOptions);
    process.exit(0);
}
if (argv._.length < 1) {
    console.log(`
    Please specify the entry directory or file:

    ${usage}

    Run ${chalk.cyan('iyourcarWx2tt --help')} to see all options.
    `);

    process.exit(1);
}
else {
    const fromPath = path.resolve(argv._[0]);
    const toPath = argv._[1] ? path.resolve(argv._[1]) : null;
    const logPath = argv._[2] ? path.resolve(argv._[2]) : null;

    wxmp2swan({type: 'wxmp2swan', src: fromPath, dist: toPath, log: logPath}, function (err, logs) {
        if (err) {
            console.log('err: ', err);
        }
    });
}
