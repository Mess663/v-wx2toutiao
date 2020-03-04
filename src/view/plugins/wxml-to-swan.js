/**
 * wxml to swan转换插件
 *
 * @file wxml to swan转换插件
 * @author yican, hiby
 */

'use strict';

const _ = require('lodash');
const utils = require('../../util');
const chalk = require('chalk');

module.exports = function wxmlToSwan(options = {}) {
    return transform;

    function transform(tree, file) {
        transformTree(tree, file);
    }

    function transformTree(tree, file) {
        if (_.isArray(tree)) {
            return tree.map(node => transformTree(node, file));
        }
        if (tree.type === 'tag') {
            const {name, children} = tree;
            
            if (name === 'import' || name === 'include') {
                tree = tranformImport(tree, file, options);
            }

            if (name === 'navigator' && options.pathList && options.pathList.length) {
                tree = tranformNavigator(tree, file, options)
            }

            tree.children = children.map(node => transformTree(node, file));

            tree = transformDirective(tree, file, options);
        }
        return tree;
    }
};
/**
 * 转换wxs to sjs
 *
 * @param {*} node
 * @param {*} file
 * @param {*} options
 * @returns {Object}
 */
function tranformWxs(node, file, options){
  const attribs = node.attribs;
  node.name="import-sjs"
  if (attribs && attribs.src) {
      let src = attribs.src.replace(/\.wxs$/i, '.sjs');
      return {
          ...node,
          attribs: {
              ...attribs,
              src: src
          }
      };
  }
  return node;
}


/**
 * 转换import和include标签
 *
 * @param {Object} node 节点对象
 * @param {VFile} file 虚拟文件
 * @param {Object} options 转换配置
 * @return {Object}
 */
function tranformImport(node, file, options) {
    const attribs = node.attribs;
    
    if (attribs && attribs.src) {
        let src = attribs.src.replace(/\.wxml$/i, '.ttml');
        // src中没有扩展名的添加默认扩展名.swan
        if (!/\w+\.\w+$/.test(src)) {
            src = src + '.ttml';
        }

        if (src.indexOf('../') === 0) {
            if (!src.includes('/components/') || !src.includes('/wxParse/')) {
                const abs = options.context.dist + '/' + src.replace(/\.\.\//g, '');
                if (!utils.isExistsSync(abs, 'ttml')) {
                    process.stdout.clearLine()
                    console.log(chalk.yellow(`\r[warn]引用文件不存在：${abs}`))
                } else {
                    src = utils.relativeDir(abs, options.path )
                }
            }
        }
        
        return {
            ...node,
            attribs: {
                ...attribs,
                src: src
            }
        };
    }
    return node;
}

/**
 * 转换import和include标签
 *
 * @param {Object} node 节点对象
 * @param {VFile} file 虚拟文件
 * @param {Object} options 转换配置
 * @return {Object}
 */
function tranformNavigator(node, file, options) {
    const attribs = node.attribs;
    if (attribs && attribs.url) {
        const [url, param=''] = attribs.url.split('?')
        const replaceUrl = options.pathList[url];
        if (replaceUrl) {
            attribs.url = param ? `${replaceUrl}?${param}` : replaceUrl
        }

        return {
            ...node,
            attribs: {
                ...attribs
            }
        };
    }
    return node;
}

/**
 * 转换标签上的directive
 *
 * @param {Object} node 节点对象
 * @param {VFile} file 虚拟文件
 * @param {Object} options 转换配置
 * @return {Object}
 */
function transformDirective(node, file, options) {
    const {attribs} = node;
    const re = 'tt:'
    if (!attribs) {
        return node;
    }

    Object
        .keys(attribs)
        .forEach(
            (key) => {
                if (!key.includes('wx:')) return;

                // 删除空wx:前缀
                const newKey = key.replace(/^wx:$/, '').replace(/^wx:/, re);
                const value = attribs[key];
                attribs[newKey] = value;
                delete attribs[key]
            },
            attribs
        );

    return {
        ...node,
        attribs: {
            ...attribs
        }
    };
}


