/**
 * @file wxml convert swan
 * @author yican, hiby
 */

'use strict';

const _ = require('lodash');
const glob = require('glob');
const path = require('path');
const chalk = require('chalk');
const unified = require('unified');

const parse = require('./plugins/parse');
const stringify = require('./plugins/stringify');
const wxmlToSwan = require('./plugins/wxml-to-swan');
const utils = require('../util');
const getHtmlParser = require('./util').getHtmlParser;

/**
 * 转换一个视图文件
 *
 * @param {string} path 文件路径
 * @param {string} contents 文件内容
 * @param {Object} context 上下文
 * @return {Promise.<VFile>}
 */
module.exports.transformViewContent = function (path, contents, context, pathList) {
    return unified()
        .use(parse)
        .use(wxmlToSwan, {context, path, pathList})
        .use(stringify)
        .use(function({path}) {
            this.Compiler = function(_, vf) {
                return getInjectInclude(path, vf.contents)
            }
        }, {path})
        .process(utils.toVFile(path, contents));
};

/**
 * 转换视图
 *
 * @param {Object} context 转换上下文
 * @param {Array.<Object>} pathList 分包路径映射表
 */
module.exports.transformView = function* transformView(context, pathList) {
    const end = utils.load('transforming config file')
    context.allLoading.push(end)
    const xmlFiles = yield new Promise(resolve => {
        let filePath = context.dist;
        // 添加支持单一文件入口逻辑
        if (utils.isDirectory(filePath)) {
            filePath = filePath + '/**/*.xml';
        }
        const extname = path.extname(filePath);
        if (extname === '.xml') {
            glob(filePath, function (err, res) {
                resolve(err ? [] : res);
            });
        } else {
            resolve([]);
        }
    });

    const ttmlFiles = yield new Promise(resolve => {
        let filePath = context.dist;
        // 添加支持单一文件入口逻辑
        if (utils.isDirectory(filePath)) {
            filePath = filePath + '/**/*.ttml';
        }
        const extname = path.extname(filePath);
        if (extname === '.ttml') {
            glob(filePath, function (err, res) {
                resolve(err ? [] : res);
            });
        } else {
            resolve([]);
        }
    });

    const files = xmlFiles.concat(ttmlFiles)

    for (let i = 0; i < files.length; i++) {
        const content = yield utils.getContent(files[i]);
       
        const result = yield exports.transformViewContent(
            files[i], 
            content, 
            context, 
            pathList
        );

        yield utils.saveFile(files[i], result);
    }

    end('👉    Successfully transform wxml file');
};

/**
 * 将include引用注入进代码里（因为头条小程序的include不能传入data）
 * 
 * @param {string} content 
 * @returns {string}
 */
function getInjectInclude(file, content) {
    return content.replace(/<include(([\s\S])*?)\/>/g, (html) => {
        const includeUrl = html.match(/"([\s\S]+)"/)[1] || ''
        let url = path.resolve(file.split('/').slice(0, -1).join('/'), includeUrl)
        let isExist = false
        let ext = ''

        if (utils.isExistsSync(url, 'ttml')) {
            isExist = true;
            ext = 'ttml'
        } else if (utils.isExistsSync(url, 'xml')) {
            isExist = true;
            ext = 'xml'
        }

        url = path.extname(url) ? url : url + '.' + ext
        
        if (isExist) {
            const inject = utils.getContentSync(url)

            // 递归，防止include嵌套
            return getInjectInclude(file, inject)
        }

        return html
    })
}

