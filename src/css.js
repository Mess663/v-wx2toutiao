/**
 * @file wxss convert css
 * @author yican
 */

const glob = require('glob');
const utils = require('./util/index');
const chalk = require('chalk');
const path = require('path');

function getCssImport(p) {
    return `@import "${p}"`
}

const pathList = []
const a = ['/community_pages/pages/content/activity_info/activity_info.less']

exports.transformCssContent = function transformCssContent(content, root, f) {
    const reg = /@import ["|']([^"|^']*)["|']/g
    
    return content.replace(reg, function(word) {
        const cssPath = word.match(/["|']([^"|^']*)["|']/)[1]

        // if (f.includes('dealer_pages/pages/enquiry/enquiry.less')) {
        //     console.log(cssPath)
        //     console.log(cssPath.indexOf('../../') !== 0 && 
        //     cssPath.indexOf('./../../') !== 0)
        // }
        
        if (
            cssPath.indexOf('../../') !== 0 && 
            cssPath.indexOf('./../../') !== 0
        ) {
            return word;
        }
        
        const absPath = root + '/' + cssPath.replace(/[.]+\//g, '')

        if (!utils.isExistsSync(absPath, 'less')) return word
        
        pathList.push(absPath)

        return getCssImport('src/' + absPath.split('/src/')[1])
    })
};

exports.transformCss = function* transformCss(form) {
    const end = utils.load('transforming config file')
    form.allLoading.push(end)

    const allPromise = ['less', 'sass', 'wxss', 'ttss'].map((item) => {
        return new Promise(resolve => {
            let filePath = form.dist;
            // 添加支持单一文件入口逻辑
            if (utils.isDirectory(filePath)) {
                filePath = filePath + `/pages/**/*.${item}`;
            }
            const extname = path.extname(filePath);
            if (extname === `.${item}`) {
                glob(filePath, function (err, res) {
                    resolve(err ? [] : res);
                });
            } else {
                resolve([]);
            }
        })
    }, [])

    const files = yield Promise.all(allPromise).then(
        (allFiles) => allFiles.reduce((all, list) => {
            return all.concat(list)
        }, [])
    )
    
    let content;
    
    for (let i = 0; i < files.length; i++) {
        content = yield utils.getContent(files[i]);
        content = exports.transformCssContent(content, form.dist, files[i]);
        
        yield utils.saveFile(files[i], content);
    }
    
    let errorPath = ''
    if (![...new Set(pathList)].every(item => {
        const isExist = utils.isExistsSync(item, 'less');
        if (!isExist) errorPath = item
        return isExist
    })) {
        console.log(chalk.red(`Error: 路径错误<${errorPath}>`));
    }
    
    end('👉    Successfully transform wxss file');
};
