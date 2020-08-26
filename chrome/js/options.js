;[].concat(...document.querySelectorAll('input[name]')).forEach(i => {
  if (i.name in window.localStorage) i.value = window.localStorage[i.name]
})

;[].concat(...document.querySelectorAll('select[name]')).forEach(i => {
  if (i.name in window.localStorage) {
    for (option of i.options) {
      if (option.value == window.localStorage[i.name]) {
        option.selected = true;
        return
      }
    }
    return
  }
  window.localStorage[i.name] = i.value;
})


document.body.addEventListener('keyup', e => {
  if (e.target.name) {
    window.localStorage[e.target.name] = e.target.value
  }
})

document.querySelectorAll('select').forEach((select) => {
  select.addEventListener('change', (e) => {
    window.localStorage[e.target.name] = e.target.value
  });
});

