/**
 * @file wxml convert swan
 * @author yican
 */

const path = require('path');
const co = require('co');
const chalk = require('chalk');
const json = require('./src/config');
const api = require('./src/api');
const view = require('./src/view');
const utils = require('./src/util/index');
const css = require('./src/css')
const log = require('./src/util/log');
const { exec } = require('child_process');

// 输出当前目录（不一定是代码所在的目录）下的文件和文件夹
function execWx2tt(context, from, to) {
    const end = utils.load('execing wx-to-tt transform tool')
    context.allLoading.push(end)
    return new Promise((res, rej) => {
        exec(`npx wx2tt ${from} ${to}`, (err, stdout, stderr) => {
            if(err) {
                rej(stderr)
            } else {
                end('👉    Successfully exec wx-to-tt transform tool')
                res(stdout)
            }
        })
    })
}

module.exports = function wxmp2swan(pathObj, cb) {
    // 指定转换目录
    pathObj.dist = pathObj.dist || getDefaultDist(pathObj.src);
    let defultLog = pathObj.dist || pathObj.src;
    // dist为文件路径时默认日志目录为此文件目录
    if (!utils.isDirectory(defultLog)) {
        defultLog = path.dirname(defultLog);
    }
    pathObj.log = pathObj.log || defultLog;
    pathObj.type = pathObj.type || 'wxmp2swan';
    const context = {
        ...pathObj,
        allLoading: [],
        logs: [],
        // 可以放一些全局共享的数据
        data: {
            // 重命名组件数据存储
            //  : {file: {[oldName]: newName}}
            //
        }
    };
    console.log(chalk.yellow('📦   Transforming workspace files...'));
    co(function* () {      
        yield utils.deleteDir(pathObj.dist)  
        yield execWx2tt(context, pathObj.src, pathObj.dist)
        // 移动分包，拿到分包映射列表
        const pathList = yield utils.moveSubPackage(context);
        yield json.transformConfig(context);
        yield api.transformApi(context, pathList);
        yield css.transformCss(context); 
        yield view.transformView(context, pathList);
    }).then(function () {
        cb && cb(null);
        console.log(chalk.green('🎉    转换成功，完成以下工作：'));
        console.log(chalk.green('      1、利用头条官方搬家工具转换api和模版等差异；'));
        console.log(chalk.green('      2、将分包全部归入主包（头条小程序不支持分包），生成wx2ttMap.json路径映射表；'));
        console.log(chalk.green('      3、将ttml、ttss、js、json所涉及到到所有路径进行调整；'));
        console.log(chalk.green('      3、因为头条小程序ttml中使用include引入模版不会继承作用域，所以将inlude的源代码替换进来；')); 
    }).catch(function (e) {
        context.allLoading.forEach(fn => fn())
        cb && cb(e);
        console.log(chalk.red('\r🚀     run error: ', e));
    });
};

function getDefaultDist(dist) {
    let res = '';
    if (utils.isDirectory(dist)) {
        res = path.join(path.dirname(dist), path.basename(dist) + '_swan');
    } else {
        res = path.join(path.dirname(dist) + '_swan', path.basename(dist));
    }
    return res;
}
