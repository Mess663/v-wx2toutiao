/**
 * @file 自定义组件配置
 * @description 自定义组件不支持的方法
 * @author zhengjiaqi01@baidu.com
 * 25/5/18
 */
module.exports = {
    // Component构造器中不支持的属性
    Component: {
        moved: null,
        relations: null
    },
    Behavior: {
        // Behavior 中不支持自定义组件的扩展
        // definitionFilter: null
    },
    // 自定义组件中this上不支持的属性和方法
    this: {
        getRelationNodes: null,
        selectComponent: {
            // 方法不允许被调用的作用域
            notAllowParents: ['onLaunch', 'onShow', 'onLoad']
        },
        selectAllComponents: {
            // 方法不允许被调用的作用域
            notAllowParents: ['onLaunch', 'onShow', 'onLoad']
        }
    },
    // 设置内置behaviors映射关系
    behaviors: {
        'wx://form-field': {
            mapping: 'swan://form-field'
        },
        'wx://component-export': {
            mapping: 'swan://component-export'
        }
    },
    json: {
        // 不支持抽象节点
        componentGenerics: null
    }
};
