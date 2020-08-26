document.addEventListener('click', async e => {
    if (e.target.classList.contains('btn')) {
        e.target.setAttribute('disabled', 'disabled')
        var data = {type: e.target.name}
        if( e.target.name == 'history' && window.localStorage['repo']=='gitee'){
            window.alert('gitee不支持history')
            return
        }
        if (e.target.name == 'revision') {
            data.id = e.target.dataset.id;
            data.sha = e.target.dataset.version;
        }
        chrome.runtime.sendMessage(data, res => {
            e.target.removeAttribute('disabled')
        })
    }

    if (e.target.classList.contains('toggle')) {
        e.target.classList.toggle('active');
        if (e.target.classList.contains('active')) {
            window.localStorage[e.target.name] = "active";
        } else {
            window.localStorage[e.target.name] = "";
        }
        e.target.setAttribute('disabled', 'disabled')

        chrome.runtime.sendMessage({
            type: 'sync'
        }, res => {
            e.target.removeAttribute('disabled')
        });
        chrome.tabs.getCurrent(function (x) {
            console.log(x)
        })
    }
})


chrome.runtime.onMessage.addListener(message => {
    if (message.items && message.target) {
        console.log(message.items)
        removeTableRows(message.target + '>:not(:first-child)');
        // document.querySelector(message.target).innerHTML = message.html
        appendTableRows(message.target, message.items)
    }
})

function createTableRow(item) {
    let row = document.createElement('div');
    row.setAttribute('class', 'row')
    let version
    for (const key in item) {
        var cell = document.createElement('div');
        cell.setAttribute('class', 'cell');
        cell.setAttribute('data-title', key);
        if (key == 'version') {
            version = item[key];
            item[key] = item[key].substr(0, 6)
        }
        cell.textContent = item[key];
        row.appendChild(cell);
    }
    var cell = document.createElement('div');
    cell.setAttribute('class', 'cell');
    cell.setAttribute('data-title', 'revision');
    let btnRevision = document.createElement('button');
    btnRevision.setAttribute('class', 'btn color-warning');
    btnRevision.setAttribute('name', 'revision');
    btnRevision.setAttribute('data-id', item['id']);
    btnRevision.setAttribute('data-version', version);
    btnRevision.textContent = "revision"
    cell.appendChild(btnRevision)
    row.appendChild(cell);
    return row;
}

// '#historyDiv>.table'
function appendTableRows(el, items) {
    let dom = document.querySelector(el);
    for (let i = 0; i < items.length; i++) {
        dom.appendChild(createTableRow(items[i]))
    }
}

// '#historyDiv>.table>:not(:first-child)'
function removeTableRows(el) {
    let doms = document.querySelectorAll(el)
    doms.forEach((i) => {
        i.remove()
    });
}

;[].concat(...document.querySelectorAll('.toggle[name]')).forEach(i => {
    if (i.name in window.localStorage) window.localStorage[i.name] ? i.classList.add('active') : i.classList.remove('active')
  });
  