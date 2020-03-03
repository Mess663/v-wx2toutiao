/**
 * @file wxml convert swan
 * @author yican
 */

const glob = require('glob');
const babylon = require('babylon');
const traverse = require('babel-traverse').default;
const generate = require('babel-generator').default;
const utils = require('./util/index');
const chalk = require('chalk');
const path = require('path');
const _ = require('lodash');

const blackList = [
    'components/adbanner/adbanner.js'
]

function isRequire(declaration) {
    return _.get(declaration, 'init.callee.name') === 'require' 
}

function replacePath(traverser, absPath, i) {
    const isImport = traverser.isImportDeclaration();
    const node = traverser.node
    const writePath = `src${absPath.split('src')[1]}`;
    if (isImport) {
        node.source.value = writePath
    } else {
        node.declarations[i].init.arguments[0].value = writePath
    }
    traverser.replaceWith(node)
}

let list = []
exports.transformApiContent = function transformViewContent(content, root, file, pathList) {
    const reg = /{[\s]*url:[\s]*['|"|`]([\w|/]+)/gmi
    content = content.replace(reg, function(naviExpress) {
        const reg = /\/([\w|/]+)/gmi
        return naviExpress.replace(reg, url => pathList[url] ? pathList[url] : url)
    })
    const result = babylon.parse(content, {
        sourceType: 'module',
        plugins: '*'
    });
    // 处理自定义组件log
    traverse(result, {
        enter(traverser) { 
            const isImport = traverser.isImportDeclaration();
            const isSomeRequire = traverser.isVariableDeclaration() && _.get(traverser, 'node.declarations').some(item => isRequire(item)) 

            if(isImport || isSomeRequire){
                const node = traverser.node
                const nowPath = file.split('/').slice(0, -1).join('/')

                if (isImport) {
                    setImport()
                } else {
                    node.declarations.forEach((item, index) => {
                        if (isRequire(item)) {
                            setImport(_.get(item, 'init.arguments[0].value'), index)
                        }
                        
                    })
                }
                
                function setImport(requireSrc = '', i = -1) {
                    const relPath = isImport ? node.source.value  : requireSrc 

                    // 排除alias路径和第三方包引用
                    if (relPath.indexOf('.') !== 0) {
                        const targetSrc = root.split('/').reverse()[0]
                        let testPath = (root+ '/'  + relPath).replace(`${targetSrc}/src`, targetSrc)
                        
                        // 因为分包都改进主包了，所以引用了分包的需要改路径
                        if (relPath.indexOf('src') === 0 && !utils.isExistsSync(testPath, 'js')) {
                            
                            testPath = testPath.replace(`/${targetSrc}/`, '/src/pages/')
                           
                            list.push(testPath.replace('src', targetSrc ))
                            replacePath(traverser, testPath, i)
                        } 
                        return
                    }

                    let importAbsPath = path.resolve(nowPath, relPath)
                    
                    // 排除路径本身没错的
                    if (!utils.isExistsSync(importAbsPath, 'js')) {
                        const rel = relPath.replace('../../../', '../../../../');
                        importAbsPath = path.resolve(nowPath, rel);

                        // 排除单纯因为移动，而多了一层的路径
                        if (!utils.isExistsSync(importAbsPath, 'js')) {
                            const handledRel = node.source.value.replace(/(\.\.\/)|(\.\/)/g, '');
                            importAbsPath = rel.includes('/pages/') ? root + '/pages/' + handledRel : root + '/' + handledRel
                            
                            // 排除在custom_component里引用pages里的js的情况
                            if (!utils.isExistsSync(importAbsPath, 'js')) {
                                console.log(importAbsPath)
                            }
                            
                        }

                        replacePath(traverser, importAbsPath, i)
                        list.push(importAbsPath)
                        
                    } else {
                        list.push(importAbsPath)
                    }
                }
            }
        },
    });
    
    const generateResult = generate(result, {});
    return generateResult.code;
};

/**
 * @param {Object} context 
 * @param {Array.<Object>} pathList 分包路径映射表
 */
exports.transformApi = function* transformApi(context, pathList) {
    if (!pathList || !pathList.length) {
        return Promise.resolve()
    }

    const end = utils.load('transforming config file')
    context.allLoading.push(end)

    // 过滤js文件
    const files = yield new Promise(resolve => {
        let filePath = context.dist;
        // 添加支持单一文件入口逻辑
        if (utils.isDirectory(filePath)) {
            filePath = filePath + '/**/*.js';
        }
        const extname = path.extname(filePath);
        if (extname === '.js') {
            glob(filePath, {ignore: '**/node_modules/**/*.js'}, function (err, res) {
                resolve(err ? [] : res);
            });
        } else {
            resolve([]);
        }
    });
    const api = require('../config/' + context.type + '/api');
    let content;
    // 遍历文件进行转换
    for (let i = 0; i < files.length; i++) {
        // 因为有些js文件格式有问题，做黑名单处理
        let isInBlack = false
        blackList.forEach(item => {
            if (files[i].includes(item)) {
                isInBlack = true
            }
        }) 
        if (isInBlack) continue

        content = yield utils.getContent(files[i]);
        const code = exports.transformApiContent(content, context.dist, files[i], pathList);
        yield utils.saveFile(files[i], code);
    }

    let errorPath = '' 
    if (!list.every(item => {
        const isExist = utils.isExistsSync(item, 'js')
        if (!isExist) errorPath = item
        return isExist
    })) {
        console.log(errorPath)
        console.log(chalk.red(`Error: 引用路径不正确<${errorPath}>`))
        return Promise.reject()
    } 
    

    end('👉    Successfully transform js file');
};
