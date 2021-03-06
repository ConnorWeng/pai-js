# 构建依赖 #

- git bash
- unzip

# 配置 #

构建前可以通过设置环境变量配置服务器信息:

```shell
export PAI_HOST=xxx.xxx.xxx.xxx  # 默认127.0.0.1
export PAI_PORT=xxxx             # 默认9898
```

# 构建 #

在git bash中执行:

- npm install: 安装所有项目依赖(无需联外网，自动从gitlab下载)
- npm test: 运行所有测试(需联外网，更新chrome driver)
- npm run build: 构建
- npm run serv: 启服务器

# 使用 #

通过`npm run serv`将服务器起来后，在网站引入构建后的js，并执行一条语句，即可开启采集。服务器根目录下的`message.log`就是采集到的行为日志。

## 普通网站 ##

```html
<script type="text/javascript" src="http://127.0.0.1:9898/dist/pai.min.js"/>
<script>
var pai = new _pai(<网站的session id, 不传也可以>);
</script>
```

## CTP网站 ##

修改com.icbc.ctp.view.tags.IncludeTag类，将doEndTag方法修改如下:

```java
public int doEndTag() throws JspException {
    try {
        initParam();
        write("<script type='text/javascript' src='http://127.0.0.1:9898/dist/pai.min.js'></script><script>var pai = new _pai('" + String.valueOf(ExprUtil.getInstance().getString(getContext(), IChannel.SESSION_ID)) + "');</script>" + evaluate());
    } catch (Exception e) {
        log(e);
    }
    return EVAL_PAGE;
}
```

# 注入测试 #

在console中分两行执行：

```javascript
var bodyjs = document.createElement('script');bodyjs.type = "text/javascript";bodyjs.src = "http://107.252.77.230:9898/dist/pai-inject.js";document.body.appendChild(bodyjs);
```
```javascript
var pai = new _pai();
```
