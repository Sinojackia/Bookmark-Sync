var repo, token, description
var monitorBookmark = true
let folder = {
    '1': '1', // 书签工具栏
    '2': '2', // 其他书签
    'toolbar_____': '1', // 书签工具栏
    'unfiled_____': '2', // 其他书签
    'menu________': '2', // 书签菜单
    'mobile______': '2', // 移动书签
    'tags________': '2' // 标签
}

let folderPreserve = ['root________']

const browserActionReset = () => {
    chrome.browserAction.setTitle({
        title: chrome.i18n.getMessage('extDesc')
    })
    chrome.browserAction.setIcon({
        path: 'images/logo-16.png'
    })
    chrome.browserAction.setBadgeText({
        text: ''
    })
    chrome.browserAction.setBadgeBackgroundColor({
        color: 'blue'
    })
}

const browserActionSet = (info = {}) => {
    chrome.browserAction.setTitle({
        title: info.title || ''
    })
    if (info.path) {
        chrome.browserAction.setIcon({
            path: info.path
        })
    }
    chrome.browserAction.setBadgeText({
        text: info.text || ''
    })
    chrome.browserAction.setBadgeBackgroundColor({
        color: info.color || '#000'
    })
}

const getBookmark = () => {
    return new Promise(resolve => {
        chrome.bookmarks.search({}, tree => {
            let arr = []
            for (let i = 0; i < tree.length; i++) {
                let json = {
                    parentId: tree[i].parentId,
                    index: tree[i].index,
                    title: tree[i].title,
                    id: tree[i].id
                }
                if ('url' in tree[i]) json.url = tree[i].url
                arr.push(json)
            }
            resolve(arr)
        })
    })
}

const emptyBookmark = async () => {
    let bm = await getBookmark()
    for (let i = 0; i < bm.length; i++) {
        if (!folderPreserve.includes(bm[i].parentId)) {
            await new Promise(resolve => {
                try {
                    if (bm[i].url) {
                        chrome.bookmarks.remove(bm[i].id, result => {
                            resolve()
                        })
                    } else {
                        chrome.bookmarks.removeTree(bm[i].id, result => {
                            resolve()
                        })
                    }
                } catch (error) {
                    resolve()
                }
            })
        }
    }
}

const setBookmark = async bm => {
    if (navigator.userAgent.match(/Vivaldi/)) { // Vivaldi没有"其他书签"
        await new Promise(resolve => {
            chrome.bookmarks.create({
                parentId: '1',
                title: chrome.i18n.getMessage('otherBookmarks')
            }, result => {
                folder['2'] = result.id
                folder['unfiled_____'] = result.id
                resolve()
            })
        })
    } else {
        await new Promise(resolve => {
            chrome.bookmarks.getTree((result) => {
                let childrens = result[0].children
                for (const children of childrens) {
                    if (children.title == chrome.i18n.getMessage('otherBookmarks')) {
                        folder['2'] = children.id
                        folder['unfiled_____'] = result.id
                        break
                    }
                }
                resolve()
            })
        })
    }
    for (let i of ['menu', 'mobile', 'tags']) {
        await new Promise(resolve => {
            chrome.bookmarks.create({
                parentId: folder['2'],
                title: chrome.i18n.getMessage(i + 'Bookmarks')
            }, result => {
                folder[i + '________'] = result.id
                resolve()
            })
        })
    }

    for (let i = 0; i < bm.length; i++) {
        if (bm[i].parentId === 'root________') continue

        // 移除不接受的属性: id
        let id = bm[i].id
        delete bm[i].id

        // 替换真正的parentId
        console.log(bm[i].parentId, folder[bm[i].parentId])
        bm[i].parentId = folder[bm[i].parentId]

        if (bm[i].url && bm[i].url.match(/^about:/)) {
            bm[i].url = bm[i].url.replace(/^about:/, 'chrome:')
        }

        await new Promise(resolve => {
            chrome.bookmarks.create(bm[i], result => {
                if (!bm[i].url) folder[id] = result.id
                resolve()
            })
        })
    }
}

// 904f503d4f8ead9d9dc58c8bf9be673f
const getGiteeGistList = async () => {
    let res = await window.fetch(`https://gitee.com/api/v5/gists?access_token=${token}&page=1&per_page=99999`, {
        method: 'GET'
    })
    let list = await res.json()
    return list.filter(i => i.description === description)
}


const getGistList = async () => {
    let res = await window.fetch('https://api.github.com/gists', {
        method: 'GET',
        headers: {
            'Authorization': 'token ' + token
        }
    })
    let list = await res.json()
    return list.filter(i => i.description === description)
}

const editGiteeGist = async (content, id) => {
    let res = await window.fetch(`https://gitee.com/api/v5/gists/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json;charset=UTF-8'
        },
        body: JSON.stringify({
            description: description,
            access_token: token,
            files: {
                bookmarks: {
                    content: content
                }
            }
        })
    })
    let json = await res.json()
    return json
}

const editGist = async (content, id) => {
    let res = await window.fetch(`https://api.github.com/gists/${id}`, {
        method: 'PATCH',
        headers: {
            'Authorization': 'token ' + token
        },
        body: JSON.stringify({
            description: description,
            files: {
                bookmarks: {
                    content: content
                }
            }
        })
    })
    let json = await res.json()
    return json
}

const createGiteeGist = async content => {
    let res = await window.fetch('https://gitee.com/api/v5/gists', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=UTF-8'
        },
        body: JSON.stringify({
            description: description,
            access_token: token,
            files: {
                bookmarks: {
                    content: content
                }
            }
        })
    })
    let json = await res.json()
    return json
}


const createGist = async content => {
    let res = await window.fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
            'Authorization': 'token ' + token
        },
        body: JSON.stringify({
            description: description,
            files: {
                bookmarks: {
                    content: content
                }
            }
        })
    })
    let json = await res.json()
    return json
}

const getGiteeGistHistory = async id => {
    // todo gitee没用这个获取历史的接口 暂时使用commits接口用用

    let res = await window.fetch(`https://gitee.com/api/v5/gists/${id}/commits?access_token=${token}`, {
        method: 'GET'
    })
    let list = await res.json()
    return list
}


const getGistHistory = async id => {
    let res = await window.fetch(`https://api.github.com/gists/${id}/commits`, {
        method: 'GET',
        headers: {
            'Authorization': 'token ' + token
        }
    })
    let list = await res.json()
    return list
}


const getGiteeGistContent = async (id, sha = undefined) => {
    let res = await window.fetch(`https://gitee.com/api/v5/gists/${id}?access_token=${token}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json;charset=UTF-8'
        },
    })
    let json = await res.json()
    let content = json.files['bookmarks'].content
    content = JSON.parse(content)
    return content
}



const getGistContent = async (id, sha = undefined) => {
    let res = await window.fetch(`https://api.github.com/gists/${id}${sha ? '/' + sha : ''}`, {
        method: 'GET',
        headers: {
            'Authorization': 'token ' + token
        }
    })
    let json = await res.json()
    let content = json.files['bookmarks'].content
    content = JSON.parse(content)
    return content
}

const onBookmarkChanged = (id, info) => {
    if (monitorBookmark) {
        browserActionSet(SyncWarning);
    }
}

chrome.runtime.onMessage.addListener(async message => {
    token = window.localStorage.token
    description = window.localStorage.description || 'Bookmark Sync'
    monitorBookmark = false
    repo = window.localStorage.repo
    browserActionSet(SyncDoing)
    try {
        if (message.type === 'upload') {
            if (repo == 'gitee') {
                let list = await getGiteeGistList()
                let bookmarks = await getBookmark()
                bookmarks = JSON.stringify(bookmarks, null, 2)
                if (list.length) {
                    await editGiteeGist(bookmarks, list[0].id)
                } else {
                    await createGiteeGist(bookmarks)
                }
                return
            }
            let list = await getGistList()
            let bookmarks = await getBookmark()
            bookmarks = JSON.stringify(bookmarks, null, 2)
            if (list.length) {
                await editGist(bookmarks, list[0].id)
            } else {
                await createGist(bookmarks)
            }
            return
        }
        if (message.type === 'download') {
            if (repo == 'gitee') {
                let list = await getGiteeGistList()
                if (list.length) {
                    let content = await getGiteeGistContent(list[0].id)
                    await emptyBookmark()
                    await setBookmark(content)
                } else {
                    browserActionSet(SyncError)
                }
                return
            }
            let list = await getGistList()
            if (list.length) {
                let content = await getGistContent(list[0].id)
                await emptyBookmark()
                await setBookmark(content)
            } else {
                browserActionSet(SyncError)
            }
            monitorBookmark = true
            return

        }
        if (message.type === 'sync') {
            if (repo == 'gitee') {
                let list = await getGiteeGistList()
                if (list.length) {
                    let local = await getBookmark()
                    let upsteam = await getGiteeGistContent(list[0].id)
                    upsteam = upsteam.filter(i => !local.some(j => i.id === j.id))
                    await setBookmark(upsteam)
                } else {
                    browserActionSet(SyncError)
                }
                browserActionSet(SyncFinish)
                return
            }
            let list = await getGistList()
            if (list.length) {
                let local = await getBookmark()
                let upsteam = await getGistContent(list[0].id)
                upsteam = upsteam.filter(i => !local.some(j => i.id === j.id))
                await setBookmark(upsteam)
            } else {
                browserActionSet(SyncError)
            }
            browserActionSet(SyncFinish)
            return
        }

        if (message.type === 'history') {
            if (repo == 'gitee') {
                // gitee无法获取提交历史
                return
            }
            let list = await getGistList()
            if (list.length) {
                let history = await getGistHistory(list[0].id)
                let items = [];
                history.forEach(i => {
                    let id = i.url.split('/')[4]
                    items = items.concat({
                        id: id,
                        version: i.version,
                        committed_at: i.committed_at
                    });
                })
                let notifiyMessage = {}
                notifiyMessage.target = '#historyDiv>.table'
                notifiyMessage.items = items
                chrome.runtime.sendMessage(notifiyMessage);
            } else {
                browserActionSet(SyncError)
            }
            return

        }
        if (message.type === 'revision') {
            if (repo == 'gitee') {
                //todo 无法回滚
                return
            }
            let content = await getGistContent(message.id, message.sha)
            await emptyBookmark()
            await setBookmark(content)
        }
    } catch (e) {
        browserActionSet(SyncError)
    } finally {
        monitorBookmark = true
    }
})

chrome.bookmarks.onCreated.addListener(onBookmarkChanged)
chrome.bookmarks.onRemoved.addListener(onBookmarkChanged)
chrome.bookmarks.onChanged.addListener(onBookmarkChanged)
chrome.bookmarks.onMoved.addListener(onBookmarkChanged)


const SyncError = {
    title: chrome.i18n.getMessage('extDesc'),
    path: 'images/logo-error-16.png',
    text: '!!!'
}
const SyncWarning = {
    title: chrome.i18n.getMessage('extDesc'),
    path: 'images/logo-sync-off-16.png',
    text: 'changed',
    color: 'orange'
}
const SyncDoing = {
    title: chrome.i18n.getMessage('extDesc'),
    path: 'images/logo-success-16.png',
    text: '',
}
// auto sync activeed, but have bookmarks not sync
const SyncOff = {
    title: chrome.i18n.getMessage('extDesc'),
    path: 'images/logo-16.png',
    text: '',
}

const SyncFinish = {
    title: chrome.i18n.getMessage('extDesc'),
    path: 'images/logo-16.png',
    text: '',
}
