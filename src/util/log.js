/**
 * @file 转换日志
 * @description 记录转换日志相关方法
 * @author zhengjiaqi01@baidu.com
 * 2018/09/20
 */
const utils = require('./index');
const chalk = require('chalk');

let errorCount = 1;
const logStore = {
    info: [],
    warning: [],
    error: []
};


const logFnMap = {
    info(log) {
        logStore.info.push(log);
    },
    warning(log) {
        logStore.warning.push(log);
    },
    error(log) {
        logStore.error.push(log);
    }
};


exports.logger = function (log, level) {
    handleErrorLog(log, level);
    handleWarningLog(log, level);
    logFnMap[level](log);
};

function handleErrorLog(log, level) {
    if (level !== 'error') {
        return;
    }
    console.log(chalk.keyword('orange')(` 💔  ${errorCount++}  ${chalk.redBright('[ERROR]:')} ${log.file}:----row:${log.row}-column:${log.column}:`));
    console.log(chalk.redBright(`      ${log.message}`));
    console.log('--------------------------------------------------------');
}

function handleWarningLog(log, level) {
    if (level !== 'warning') {
        return;
    }
    console.log(chalk.keyword('orange')(` ⚠️     ${chalk.yellow('[WARNING]:')} ${log.file}:----row:${log.row}-column:${log.column}:`));
    console.log(chalk.yellow(`      ${log.message}`));
    console.log('--------------------------------------------------------');
}

exports.saveLog = function (path) {
    Object.keys(logStore).forEach(level => {
        const logs = logStore[level];
        utils.saveLog(`${path}/log/${level}.json`, JSON.stringify(logs, null, 4));
    });
};
