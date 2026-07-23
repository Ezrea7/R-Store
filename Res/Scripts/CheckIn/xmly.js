/********************************
XMLY CheckIn

脚本名称：喜马拉雅签到
脚本兼容：Surge, QuantumultX
脚本作者：@ClydeTime
更新日期：2023-11-02
脚本来源：https://raw.githubusercontent.com/ClydeTime/Surge/main/Script/Task/xmly.js
脚本说明：
- 后台退出手机喜马拉雅客户端的情况下,重新打开APP进入主页
- 如通知成功获取cookie,则可以使用此签到脚本.
- 获取Cookie后, 请将Cookie脚本禁用并移除主机名,以免产生不必要的MITM.
- 脚本将在每天上午8点35执行,您可以修改执行时间.

------------------ Surge 配置 -----------------

[MITM]
hostname = xmc.ximalaya.com

[Script]
喜马拉雅-Cookie = type=http-request,pattern=^https?:\/\/xmc\.ximalaya\.com\/xmlymain-login-web\/login\/,requires-body=0,max-size=0,script-path=https://raw.githubusercontent.com/Ezrea7/R-Store/main/Res/Scripts/CheckIn/xmly.js

喜马拉雅-签到 = type=cron,cronexp=35 8 * * *,script-path=https://raw.githubusercontent.com/Ezrea7/R-Store/main/Res/Scripts/CheckIn/xmly.js,timeout=15,wake-system=1

-------------- Quantumult X 配置 --------------

[mitm]
hostname = xmc.ximalaya.com

[rewrite_local]
# 喜马拉雅-Cookie
^https?:\/\/xmc\.ximalaya\.com\/xmlymain-login-web\/login\/ url script-request-header https://raw.githubusercontent.com/Ezrea7/R-Store/main/Res/Scripts/CheckIn/xmly.js

[task_local]
# 喜马拉雅-签到
35 8 * * * https://raw.githubusercontent.com/Ezrea7/R-Store/main/Res/Scripts/CheckIn/xmly.js, tag=喜马拉雅-签到, img-url=https://raw.githubusercontent.com/Ezrea7/R-Store/main/Res/Icon/App/xmly.png, enabled=true

********************************/

const format = (ts, fmt = 'yyyy-MM-dd HH:mm:ss') => {
  return $.time(fmt, ts)
}

const urlencode = (str) => {
  str = (str + '').toString()
  return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28'). replace(/\)/g, '%29').replace(/\*/g, '%2A').replace(/%20/g, '+')
}

const inspect = (key) => {
    if (typeof config[key]["num"] == 'undefined' || format(new Date().toDateString()) > config[key]["time"]){
        config[key]["num"] = 0
        $.setdata(JSON.stringify(config[key]), name + `_${key}`)
    }
    if (typeof config[key]["time"] == 'undefined'){
        config[key]["time"] = format(startTime)
        $.setdata(JSON.stringify(config[key]), name + `_${key}`)
    }
}

const check = (key, num) =>
  !config.hasOwnProperty(key) ||
  !config[key].hasOwnProperty("time") ||
  !(config[key]["num"] > num) ||
  format(new Date().toDateString()) > config[key].time

const $ = new Env('喜马拉雅')
const name = 'xmly'
const zh_name = "喜马拉雅"
const startTime = $.time('yyyy-MM-dd HH:mm:ss')
const config = {
  cookie: {},
  headers: {}
}

!(async () => {
    if (typeof $request != "undefined") {
        $.log("- 正在获取cookie, 请稍后")
        getCookie()
    } else { 
       await main()
    }
})()
	.catch((e) => $.logErr(e))
	.finally(() => $.done())

function getCookie() {
    if ("object" == typeof $request) {
        const headers = JSON.stringify($request.headers)
        if (headers) $.setdata(headers, name + "_headers")
        $.setdata("", name + "_watch")
        $.setdata("", name + "_spec")
        //$.setdata("", name + "_gene")
        $.msg(zh_name, "", "- 喜马拉雅获取cookie成功")
    }
}

async function main() {
    config.headers = $.getjson(name + "_headers", {})
    config.watch = $.getjson(name + "_watch", {})
    config.spec = $.getjson(name + "_spec", {})
    //config.gene = $.getjson(name + "_gene", {})
    config.xm_cookie = `${typeof config['headers']['Cookie']=='undefined' ? config['headers']['cookie'] : config['headers']['Cookie']}`
    let sign_flag = await xmlySign()
    
    if (sign_flag) {
        let watch_message = ""
        //let gene_message = ""
        let spec_message = ""

        inspect("watch")

        if (check("watch", 5)) {
            let exec_times = 6 - config.watch.num
            $.log("### 看广告任务进行中")
            for (let i=0; i<exec_times; i++) {
                let token = await adVideoGetToken()
                if (token != "null") {
                    await adVideoFinish(token)
                } else {
                    $.log("- 获取token失败,无法完成观看任务")
                }  
            }
            if (config.watch.num == 6) {
                watch_message = `🟢 今日视频任务已全部完成`
            } else {
                watch_message = `🟡 今日视频任务尚未完成`
            }
        } else {
            watch_message = `🟢 今日视频任务已全部完成`
        }
        $.log(watch_message)

/*         inspect("gene")

        if (check("gene", 6)) {
            let gene_flag = true
            let exec_times = 7 - config.gene.num
            if (exec_times != 0) {
                $.log("### 通用任务进行中")
                let listSet = [101, 143, 176, 177, 180, 260, 264]    //任务列表分别为「逛福利列表, 浏览会员频道, 哈利波特互动页, 逛官方商城, 今日热点, 支付宝消费金, 答题赢积分, 浏览会员商品页(失效249), 123狂欢节(失效227), 高德领水果(失效224), 双十一特惠-(任务结束216), 年货节问卷(225), 点评(217), 百度(104)」
                for (let i=0; i<exec_times; i++) {
                    await takeGeneralTask(listSet[i])
                    let temp_flag = await handInGeneralTask(listSet[i])
                    if (temp_flag == false) {
                        gene_flag = false
                    }  
                }
            }

            if (gene_flag) {
                config.gene.num = 7
                config.gene.time = format(startTime)
                $.setdata(JSON.stringify(config.gene), name + "_gene")
                gene_message = `🟢 今日通用任务已全部完成`
            } else {
                config.gene.num = 0
                config.gene.time = format(startTime)
                $.setdata(JSON.stringify(config.gene), name + "_gene")
                gene_message = `🟡 今日通用任务尚未全部完成,请查看日志`
            }   
        } else {
            gene_message = `🟢 今日通用任务已全部完成`
        }
        $.log(gene_message) */

        inspect("spec")

        if (check("spec", 5)) {
            await share()
            await voiceAdd()
            await voiceDelete()
            await giveDynamicsLike()
            await cancelDynamicsLike()
            await giveVoiceLike()
            await cancelVoiceLike()
            await userAdd()
            await userDelete()
            /* let actCode = await jumpDzdp()
            if (actCode != "") {
                await dzdpComplete(actCode)
            } */
            let uid = await getUid()
            let content = urlencode(await wyy())
            let commentId = await createComment(uid, content)
            if (commentId != 0) {
                await deleteComment(commentId)
            }else {
                $.log("- 评论失败,无法删除评论")
                $.log("- 遇到此种情况,没有很好的解决办法,建议手动评论并交还任务")
            }

            await flushTaskRecords()
            $.log("### 特殊任务统一交还中")
            config.spec.num = 0
            config.spec.time = format(startTime)
            $.setdata(JSON.stringify(config.spec), name + "_spec")

            let listset = [96, 168, 169, 170, 171, 336]     //任务列表分别为「分享声音, 收藏声音, 动态点赞, 声音点赞, 关注用户, 声音评论(172变更336), 大众点评(217已失效)」
            for (let i=0; i<listset.length; i++) {
               await handInGeneralTask(listset[i])
            }

            if (config.spec.num == 6) {
                spec_message = `🟢 今日特殊任务已全部完成`
            } else {
                spec_message = `🟡 今日特殊任务尚未全部完成,请查看日志`
            }
        } else {
            spec_message = `🟢 今日特殊任务已全部完成`   
        }
        $.log(spec_message)
        let message = `🟢【恭喜】签到状态:签到成功 \n` + `${watch_message}\n` + `${spec_message}\n` + "- 其中特殊任务完成进度以app内完成度为准"
        $.msg(zh_name, "", message)
    } else {
        let message = `🔴【抱歉】签到状态:签到失败 \n` + "请重新获取cookie"
        $.log(message)
        $.msg(zh_name, "", message)
    }
}

async function xmlySign(){
    $.log("### 签到任务进行中")
    let headers = {
        "Cookie": config.xm_cookie,
        "Content-Type": "application/json"
    }
    let body = `{"aid":87}`
    let myRequest = {
        url: "http://hybrid.ximalaya.com/web-activity/signIn/v2/signIn?v=new",
        headers: headers,
        body: body
    }
    return await $.http.post(myRequest).then(
       (response) => {
            body = JSON.parse(response.body)
            if (body.ret == 0) {
                $.log("- 签到成功")
                return true
            } else {
                $.log("- 签到失败")
                $.log("- 请重新获取cookie")
                return false
            }
        },(reason) => {
            $.log("- 签到失败")
            return false
        }
    )
}

async function flushTaskRecords(){
    let headers = {
        "Cookie": config.xm_cookie,
        'Content-Type' : `application/json`
    }
    let body = `{"aid":112}`
    let myRequest = {
        url: `http://m.ximalaya.com/web-activity/task/v2/taskRecords?tag=pc`,
        headers: headers,
        body: body
    }
    return await $.http.post(myRequest).then(
       (response) => {
            body = JSON.parse(response.body)
            if (body.ret == 0) {
                $.log("- 刷新列表成功")
                return true
            } else {
                $.log("- !!!刷新列表失败")
                return false
            }
        },(reason) => {
            $.log("- !!!刷新列表失败")
            return false
        }
    )
}

async function share(){
    let headers = {
        "Cookie": config.xm_cookie
    }
    let myRequest = {
        url: `https://mobile.ximalaya.com/thirdparty-share/share/content?srcId=422711158&srcType=7&subType=1098&tpName=weixin`,
        headers: headers
    }
    return await $.http.get(myRequest).then(
       (response) => {
            body = JSON.parse(response.body)
            if (body.ret == 0) {
                $.log("- 分享成功")
                return true
            } else {
                $.log("- !!!分享失败")
                return false
            }
        },(reason) => {
            $.log("- !!!分享失败")
            return false
        }
    )
}

async function getUid(){
    let headers = {
        "Cookie": config.xm_cookie
    }
    let myRequest = {
        url: `https://passport.ximalaya.com/user-http-app/v1/nickname/info`,
        headers: headers
    }
    let uid = 0
    return await $.http.get(myRequest).then(
       (response) => {
            body = JSON.parse(response.body)
            if (body.ret == 0) {
                uid = body.data.uid
                $.log("- 获取uid成功")
                return uid
            } else {
                $.log("- !!!获取uid失败")
                return uid
            }
        },(reason) => {
            $.log("- !!!获取uid失败")
            return uid
        }
    )
}

async function wyy(){
    return await $.http.get({
            url: `https://keai.icu/apiwyy/api`
        }).then(
       (response) => {
            body = JSON.parse(response.body)
            let content = body.content
            return content
        },(reason) => {
            $.log("- 获取评论失败")
            let content = "真不错呀"
            return content
        }
    )
}

async function voiceAdd(){
    let headers = {
        "Cookie": config.xm_cookie,
        'Content-Type': `application/json`
    }
    let body = `{"relatedId":423641159,"businessType":100}`
    let myRequest = {
        url: `https://mobile.ximalaya.com/general-relation-service/track/collect/add/1667873518984`,
        headers: headers,
        body: body
    }
    return await $.http.post(myRequest).then(
       (response) => {
            body = JSON.parse(response.body)
            if (body.ret == 0) {
                $.log("- 收藏声音成功")
                return true
            } else if (body.ret == 103) {
                $.log("- !!!此声音已收藏, 无法再次收藏")
                return false
            } else {
                $.log("- !!!未知收藏状况")
                return false
            }
        },(reason) => {
            $.log("- !!!收藏声音失败")
            return false
        }
    )
}

async function voiceDelete(){
    let headers = {
        "Cookie": config.xm_cookie,
        'Content-Type': `application/json`
    }
    let body = `{"relatedId":423641159,"businessType":100}`
    let myRequest = {
        url: `https://mobile.ximalaya.com/general-relation-service/track/collect/delete/ts-1667873513996`,
        headers: headers,
        body: body
    }
    return await $.http.post(myRequest).then(
       (response) => {
            body = JSON.parse(response.body)
            if (body.ret == 0) {
                $.log("- 删除收藏声音成功")
                return true
            } else if (body.ret == 112) {
                $.log("- !!!此声音未收藏, 无法删除")
                return false
            } else {
                $.log("- !!!未知收藏状况")
                return false
            }
        },(reason) => {
            $.log("- !!!删除收藏声音失败")
            return false
        }
    )
}

async function userAdd(){
    let headers = {
        "Cookie": config.xm_cookie,
        'Content-Type': `application/x-www-form-urlencoded`
    }
    let body = `bizType=11&isFollow=1&toUid=2342717`
    let myRequest = {
        url: `https://mobile.ximalaya.com/mobile/follow`,
        headers: headers,
        body: body
    }
    return await $.http.post(myRequest).then(
       (response) => {
            body = JSON.parse(response.body)
            if (body.ret == 0) {
                $.log("- 关注用户成功")
                return true
            } else if (body.ret == 3002) {
                $.log("- !!!此用户已关注过")
                return false
            } else if (body.ret == 3001) {
                $.log("- !!!关注频率过高,无法关注")
                $.log("- 遇到此种情况,没有很好的解决办法,建议手动关注并交还任务")
                return false
            } else {
                $.log("- !!!未知关注状况")
                $.log(JSON.stringify(body))
                return false
            }
        },(reason) => {
            $.log("- !!!关注用户失败")
            return false
        }
    )
}

async function userDelete(){
    let headers = {
        "Cookie": config.xm_cookie,
        'Content-Type': `application/x-www-form-urlencoded`
    }
    let body = `bizType=13&isFollow=0&toUid=2342717`
    let myRequest = {
        url: `https://mobile.ximalaya.com/mobile/follow`,
        headers: headers,
        body: body
    }
    return await $.http.post(myRequest).then(
       (response) => {
            body = JSON.parse(response.body)
            if (body.ret == 0) {
                $.log("- 取关用户成功")
                return true
            } else {
                $.log("- !!!未知关注状况")
                return false
            }
        },(reason) => {
            $.log("- !!!取关用户失败")
            return false
        }
    )
}

async function giveVoiceLike(){
    let headers = {
        "Cookie": config.xm_cookie,
        'Content-Type': `application/x-www-form-urlencoded`
    }
    let body = `favorite=1&trackId=423641159`
    let myRequest = {
        url: `https://mobile.ximalaya.com/favourite-business/favorite/track`,
        headers: headers,
        body: body
    }
    return await $.http.post(myRequest).then(
       (response) => {
            body = JSON.parse(response.body)
            if (body.ret == 0) {
                $.log("- 点赞声音成功")
                return true
            } else if (body.ret == 111) {
                $.log("- !!!此声音已点赞过")
                return false
            } else {
                $.log("- !!!未知声音点赞状况")
                return false
            }
        },(reason) => {
            $.log("- !!!点赞声音失败")
            return false
        }
    )
}

async function cancelVoiceLike(){
    let headers = {
        "Cookie": config.xm_cookie,
        'Content-Type': `application/x-www-form-urlencoded`
    }
    let body = `favorite=0&trackId=423641159`
    let myRequest = {
        url: `https://mobile.ximalaya.com/favourite-business/favorite/track`,
        headers: headers,
        body: body
    }
    return await $.http.post(myRequest).then(
       (response) => {
            body = JSON.parse(response.body)
            if (body.ret == 0) {
                $.log("- 取消声音点赞成功")
                return true
            }else if (body.ret == -1) {
                $.log("- !!!此声音尚未点赞, 无法取消")
                return false
            } else {
                $.log("- !!!未知声音点赞状况")
                return false
            }
        },(reason) => {
            $.log("- !!!取消声音点赞失败")
            return false
        }
    )
}

async function giveDynamicsLike(){
    let headers = {
        "Cookie": config.xm_cookie,
        'Content-Type': `application/json`
    }
    let body = `{"feedId":217014623}`
    let myRequest = {
        url: `https://mobile.ximalaya.com/chaos/v2/feed/praise/create`,
        headers: headers,
        body: body
    }
    return await $.http.post(myRequest).then(
       (response) => {
            body = JSON.parse(response.body)
            if (body.ret == 0) {
                $.log("- 点赞动态成功")
                return true
            } else {
                $.log("- !!!未知动态点赞状况")
                return false
            }
        },(reason) => {
            $.log("- !!!点赞动态失败")
            return false
        }
    )
}

async function cancelDynamicsLike(){
    let headers = {
        "Cookie": config.xm_cookie,
        'Content-Type': `application/json`
    }
    let body = `{"feedId":217014623}`
    let myRequest = {
        url: `https://mobile.ximalaya.com/chaos/v2/feed/praise/delete`,
        headers: headers,
        body: body
    }
    return await $.http.post(myRequest).then(
       (response) => {
            body = JSON.parse(response.body)
            if (body.ret == 0) {
                $.log("- 取消动态点赞成功")
                return true
            } else {
                $.log("- !!!未知动态点赞状况")
                return false
            }
        },(reason) => {
            $.log("- !!!取消动态点赞失败")
            return false
        }
    )
}

async function createComment(uid, content){
    let headers = {
        "Cookie": config.xm_cookie,
        'Content-Type' : `application/x-www-form-urlencoded`
    }
    let body = `content=${content}&source=0&synchaos=1&timeStampType=1&trackId=424771991&uid=${uid}`
    let myRequest = {
        url: "https://mobile.ximalaya.com/comment-mobile/v1/create",
        headers: headers,
        body: body
    }
    let commentId = 0
    return await $.http.post(myRequest).then(
       (response) => {
            body = JSON.parse(response.body)
            if (body.ret == 0) {
                $.log("- 评论成功")
                commentId = body.id
            } else if (body.ret == 801){
                $.log("- !!!请勿发送相同内容")
            }else if (body.ret == 805){
                $.log("- !!!发送内容频繁")
            } else {
                $.log("- !!!评论失败")
            }
            return commentId
        },(reason) => {
            $.log("- !!!评论失败")
            return commentId
        }
    )
}

async function deleteComment(commentId){
    let headers = {
        "Cookie": config.xm_cookie,
        'Content-Type' : `application/x-www-form-urlencoded`
    }
    let body = `commentId=${commentId}&trackId=424771991`
    let myRequest = {
        url: "https://mobile.ximalaya.com/comment-mobile/delete",
        headers: headers,
        body: body
    }
    return await $.http.post(myRequest).then(
       (response) => {
            body = JSON.parse(response.body)
            if (body.ret == 0) {
                $.log("- 删除评论成功")
                return true
            } else {
                $.log("- !!!未知评论状态")
                return false
            }
        },(reason) => {
            $.log("- !!!删除评论失败")
            return false
        }
    )
}

async function jumpDzdp(){
    let headers = {
        "Cookie": config.xm_cookie
    }
    let body = ``
    let myRequest = {
        url: "http://m.ximalaya.com/web-activity/task/v2/genGuideLink?aid=112&taskId=217",
        headers: headers,
        body: body
    }
    return await $.http.get(myRequest).then(
       (response) => {
            body = JSON.parse(response.body)
            if (body.ret == 0) {
                $.log("- 获取跳转链接成功")
                let link = body.data.h5Link
                let key = /.*actCode=(.*?)&titleBar/.exec(link)[1]
                return key
            } else {
                $.log("- !!!未知跳转状态")
                return ""
            }
        },(reason) => {
            $.log("- !!!获取跳转链接失败")
            return ""
        }
    )
}

async function dzdpComplete(actCode){
    let headers = {
        'Content-Type' : `application/json`
    }
    let body = `{"thirdAppName":"xmly_exchange_dzdp","paramInfo":"{\\"taskId\\":\\"exchange_dzdp\\",\\"actCode\\":${actCode}}"}`;
    let myRequest = {
        url: "https://m.dianping.com/faaslocal/h5applink/api/pointmallapplink/thirdAppTaskComplete",
        headers: headers,
        body: body
    }
    return await $.http.post(myRequest).then(
       (response) => {
            body = JSON.parse(response.body)
            if (body.code == 200) {
                $.log("- 跳转任务完成")
                return true
            } else {
                $.log("- !!!未知完成状态")
                return false
            }
        },(reason) => {
            $.log("- !!!跳转任务失败")
            return false
        }
    )
}

async function adVideoGetToken(){
    let headers = {
        "Cookie": config.xm_cookie,
        'Content-Type': `application/json`
    }
    let body = `{"aid":112,"taskId":252}`
    let myRequest = {
        url: `http://m.ximalaya.com/web-activity/task/v2/genTaskToken`,
        headers: headers,
        body: body
    }
    return await $.http.post(myRequest).then(
       (response) => {
            body = JSON.parse(response.body)
            if (body.ret == 0) {
                let token = body.data.token
                return token
            } else {
                $.log("- !!!token获取失败")
                let token = "null"
                return token
            }
        },(reason) => {
            $.log("- !!!token获取失败")
            let token = "null"
            return token
        }
    )
}

async function adVideoFinish(token){
    let headers = {
        "Cookie": config.xm_cookie,
        'Content-Type': `application/json`
    }
    let body = `{"aid":112,"taskId":252,"token":"${token}","progress":1}`
    let myRequest = {
        url: `http://m.ximalaya.com/web-activity/task/v2/incrTaskProgress`,
        headers: headers,
        body: body
    }
    return await $.http.post(myRequest).then(
       (response) => {
            body = JSON.parse(response.body)
            if (body.ret == 0) {
                if (body.data.status == 0) {
                    $.log("- 本条视频广告观看已完成, 获得50点奖励")
                    config.watch.num += 1
                    config.watch.time = format(startTime)
                    $.setdata(JSON.stringify(config.watch), name + "_watch")
                    return true
                } else if (body.data.status == -1) {
                    $.log("### 今日观看广告任务已全部完成 ✅ ")
                    config.watch.num = 6
                    config.watch.time = format(startTime)
                    $.setdata(JSON.stringify(config.watch), name + "_watch")
                    return true
                } else {
                    $.log("- !!!未知完成状态")
                    $.log(JSON.stringify(body.data))
                    return false
                }
            } else {
                $.log("- !!!观看广告任务交还失败")
                return false
            }
        },(reason) => {
            $.log("- !!!观看广告任务交还失败")
            return false
        }
    )
}

async function takeGeneralTask(taskId){
    let headers = {
        "Cookie": config.xm_cookie,
        'Content-Type': `application/json`
    }
    let body = `{"aid":112,"taskId":${taskId}}`
    let myRequest = {
        url: `http://hybrid.ximalaya.com/web-activity/task/v2/refreshClientTask`,
        headers: headers,
        body: body
    }
    return await $.http.post(myRequest).then(
       (response) => {
            body = JSON.parse(response.body)
            if (body.ret == 0) {
                if (body.data.ret == 0) {
                    return true
                } else if (body.data.ret == -1) {
                    $.log("- 此项通用任务今日已接取")
                    return true
                } else {
                    $.log("- !!!未知接取状态")
                    return false
                }
            } else {
                $.log("- !!!通用任务接取失败")
                return false
            }
        },(reason) => {
            $.log("- !!!通用任务接取失败")
            return false
        }
    )
}

async function handInGeneralTask(taskId){  
    let headers = {
        "Cookie": config.xm_cookie,
        'Content-Type': `application/json`
    }
    let body = `{"aid":112,"taskId":${taskId}}`
    let myRequest = {
        url: `http://m.ximalaya.com/web-activity/task/v2/drawTaskAward`,
        headers: headers,
        body: body
    }
    return await $.http.post(myRequest).then(
       (response) => {
            body = JSON.parse(response.body)
            if (body.ret == 0) {
                if (body.data.status == 0) { 
                    if ((taskId > 167 && taskId < 173) || taskId == 96 || taskId == 336) {
                        config.spec.num += 1
                        config.spec.time = format(startTime)
                        $.setdata(JSON.stringify(config.spec), name + "_spec")
                        $.log("- 交还特殊任务成功, 获得奖励点数")
                    } /* else {
                        config.gene.num += 1
                        config.gene.time = format(startTime)
                        $.setdata(JSON.stringify(config.gene), name + "_gene")
                        $.log("- 交还通用任务成功, 获得10点奖励")
                    } */
                    return true
                } else if (body.data.status == 1) {
                    if ((taskId > 167 && taskId < 173) || taskId == 96 || taskId == 336) {
                        config.spec.num += 1
                        config.spec.time = format(startTime)
                        $.setdata(JSON.stringify(config.spec), name + "_spec")
                        $.log("- 此项特殊任务今日已交还")
                    } /* else {
                        config.gene.num += 1
                        config.gene.time = format(startTime)
                        $.setdata(JSON.stringify(config.gene), name + "_gene")
                        $.log("- 此项通用任务今日已交还")
                    } */
                    return true
                } else if (body.data.status == -1) {
                    $.log("--- !!!此任务尚未完成,不能交还")
                    return false
                } else {
                    $.log("--- !!!未知交还状态")
                    $.log(JSON.stringify(body.data))
                    return false
                }
            } else {
                $.log("--- !!!交还任务失败")
                return false
            }
        },(reason) => {
            $.log("--- !!!交还通用任务失败")
            return false
        }
    )
}

/***************** Env *****************/
// prettier-ignore
// https://github.com/chavyleung/scripts/blob/master/Env.min.js


function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.encoding="utf-8",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}isShadowrocket(){return"undefined"!=typeof $rocket}isStash(){return"undefined"!=typeof $environment&&$environment["stash-version"]}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,n]=i.split("@"),a={url:`http://${n}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(a,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),n=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(n);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){if(t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,i)});else if(this.isQuanX())this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t&&t.error||"UndefinedError"));else if(this.isNode()){let s=require("iconv-lite");this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:i,statusCode:r,headers:o,rawBody:n}=t,a=s.decode(n,this.encoding);e(null,{status:i,statusCode:r,headers:o,rawBody:n,body:a},a)},t=>{const{message:i,response:r}=t;e(i,r,r&&s.decode(r.rawBody,this.encoding))})}}post(t,e=(()=>{})){const s=t.method?t.method.toLocaleLowerCase():"post";if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient[s](t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,i)});else if(this.isQuanX())t.method=s,this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t&&t.error||"UndefinedError"));else if(this.isNode()){let i=require("iconv-lite");this.initGotEnv(t);const{url:r,...o}=t;this.got[s](r,o).then(t=>{const{statusCode:s,statusCode:r,headers:o,rawBody:n}=t,a=i.decode(n,this.encoding);e(null,{status:s,statusCode:r,headers:o,rawBody:n,body:a},a)},t=>{const{message:s,response:r}=t;e(s,r,r&&i.decode(r.rawBody,this.encoding))})}}time(t,e=null){const s=e?new Date(e):new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in i)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?i[e]:("00"+i[e]).substr((""+i[e]).length)));return t}queryStr(t){let e="";for(const s in t){let i=t[s];null!=i&&""!==i&&("object"==typeof i&&(i=JSON.stringify(i)),e+=`${s}=${i}&`)}return e=e.substring(0,e.length-1),e}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl,i=t["update-pasteboard"]||t.updatePasteboard;return{"open-url":e,"media-url":s,"update-pasteboard":i}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};if(!this.isMute){if(this.isSurge()||this.isLoon()){$notification.post(e,s,i,o(r))}else if(this.isQuanX()){$notify(e,s,i,o(r))}}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`❗️${this.name}, 错误!`,t.stack):this.log("",`❗️${this.name}, 错误!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),this.isSurge()||this.isQuanX()||this.isLoon()?$done(t):this.isNode()&&process.exit(1)}}(t,e)}