### 333
# 小程序搬家工具
本工具基于wx2baidu工具修改而成（原仓库：[wx2swan](https://github.com/yican008/wx2swan)，这个源码可以从npm包里拿）

## Introduction:
> 这个工具依赖头条的[搬家工具](https://developer.toutiao.com/dev/cn/mini-app/develop/developer-instrument/development-assistance/one-key-move)，但头条的搬家工具的转换效果很差，需要扩展功能。更过分的是头条不开源，所以没法直接在其源码基础上修改。只能借助一个开源的[百度搬家工具](https://github.com/yican008/wx2swan)修改而来，在运行本工具时，会自动运行一遍头条的搬家工具。目前也没办法百分百将微信小程序转换为可运转的头条小程序，详见下文。

## 这个东西具体做了什么？
1. 利用头条搬家工具转换api和模版等差异；
2. 将分包全部归入主包（头条小程序不支持分包）；
3. 将ttml、ttss、js、json所涉及到的所有依赖路径进行调整；
4. 因为头条小程序ttml中使用include引入模版不会继承作用域，所以将inlude的源代码替换进来；

## 遗留了什么问题？
1. wxs头条不支持，所以需要手动修改；
2. component没有observe；
3. 头条小程序不支持nextTick，建议手动替换为setTimeout；

## Quick Start
1.安装
```
cd <project>
npm link
```
> 由于link是全局安装，所以mac可能会报错，命令前加上`sudo`即可

2.使用 
```js
  //wx2tt   微信小程序的目录   <可选: 生成swan的目录，默认为entryDir_swan>   <可选: 生成日志的目录, 默认为outputDir>
  wx2tt ./test/entryDir
  wx2tt ./test/entryDir ./test/outputDir
```

3. 支持单文件入口转换：

	```javascript
	wx2tt ./test/entryFile
	```

	```javascript
	wx2tt ./test/entryFile ./test/outputDir
	```

	```javascript
	wx2tt ./test/entryFile ./test/outputFile
	```


