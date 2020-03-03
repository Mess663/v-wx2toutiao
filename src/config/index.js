/**
 * @file transform json
 * @author hiby
 */

'use strict';

const _ = require('lodash');
const glob = require('glob');
const chalk = require('chalk');

const utils = require('../util');
const componentConf = require('../../config/wxmp2swan/component');
const log = require('../util/log');
const path = require('path');
const fs = require('fs')

/**
 * 转换配置
 *
 * @param {Object} context 转换上下文
 */
module.exports.transformConfig = function* transformConfig(context) {
    const end = utils.load('transforming config file')
    context.allLoading.push(end)
    const files = yield new Promise(resolve => {
        let filePath = context.dist + '/pages';
        // 添加支持单一文件入口逻辑
        try {
            if (utils.isDirectory(filePath)) {
                filePath = filePath + '/**/*.json';
            }
        } catch (error) {
            resolve()
            console.log(chalk.red('👉 没有找到对应的JSON文件，自动进入下一步'))
            return;
        }
        
        const extname = path.extname(filePath);
        if (extname === '.json') {
            glob(filePath, function (err, res) {
                resolve(err ? [] : res);
            });
        } else {
            resolve([]);
        }
    });
    const WritePromises = []
    const root = context.dist[context.dist.length-1] === '/' ? context.dist : context.dist + '/';
 
    files.forEach(jsonPath => {
        const jsonObj = require(jsonPath);
        const components = jsonObj.usingComponents
        if (components) {
            Object.keys(components).forEach(key => {
                const jsonAb = jsonPath.split('/').slice(0, -1).join('/')
                const relPath = components[key]
                // component的绝对路径
                const absolutePath = path.resolve(jsonAb, relPath)

                // 通过绝对路径看是否存在
                if (relPath.indexOf('.') === 0 && !utils.isExistsSync(absolutePath, 'json')) {
                    // 不存在则路径错误，通过当前文件路径和公共组件位置重组出相对路径
                    let componentType = ''
                    if (relPath.includes('/custom_components/')) {
                        componentType = 'custom_components'
                    } else if (relPath.includes('../../../components/')) {
                        componentType = 'components'
                    }
                    
                    const abs = (root + componentType + (relPath.split(componentType)[1]))
                    if (!utils.isExistsSync(abs, 'json')) {
                        process.stdout.clearLine()
                        console.log(chalk.yellow(`\r[warn]引用文件不存在：${abs} 引用处：src/${jsonPath.split('/src/')[1]}`))
                    }
                    
                    jsonObj.usingComponents[key] = utils.relativeDir(abs, jsonPath)
                }
            })
        }
        WritePromises.push(utils.saveFile(jsonPath, JSON.stringify(jsonObj)))
    })
    yield Promise.all(WritePromises)

    end('👉    Successfully transform config file');
};

/**
 * 自定义组件中不支持的属性打印error日志
 *
 * @param {string} json 自定义组件json配置
 * @param {string} path 文件路径
 */
function componentLog(json, path) {
    // 处理自定义组件json中不支持的属性
    Object.keys(componentConf.json).forEach(attr => {
        const confValue = componentConf.json[attr];
        if (confValue === null && json[attr]) {
            log.logger({
                type: 'Compsonent json',
                file: path,
                message: `自定义组件---json[${attr}]: ${'不支持的属性'}`
            }, 'error');
        }
    });
}
