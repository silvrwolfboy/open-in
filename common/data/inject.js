'use strict';

var config = {
  button: 0,
  altKey: true,
  ctrlKey: false,
  shiftKey: true,
  metaKey: false,
  enabled: false,
  hosts: [],
  urls: [],
  reverse: false
};

chrome.storage.local.get(config, prefs => {
  Object.assign(config, prefs);
  chrome.storage.managed.get({
    hosts: [],
    urls: []
  }, prefs => {
    if (!chrome.runtime.lastError) {
      config.hosts.push(...prefs.hosts);
      config.urls.push(...prefs.urls);
    }
  });
});

chrome.storage.onChanged.addListener(e => {
  Object.keys(e).forEach(n => {
    config[n] = e[n].newValue;
  });
});

document.addEventListener('click', e => {
  const redirect = url => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    chrome.runtime.sendMessage({
      cmd: 'open-in',
      url
    });
    return false;
  };
  // hostname on left-click
  if (e.button === 0 && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
    if (config.hosts.length || config.urls.length) {
      let a = e.target.closest('a');
      if (a) {
        if (a.href.startsWith('https://www.google') && a.href.indexOf('&url=') !== -1) {
          const link = decodeURIComponent(a.href.split('&url=')[1].split('&')[0]);
          a = new URL(link);
        }
        if (config.hosts.length) {
          const host = a.hostname;
          if (host) {
            if (config.hosts.some(h => h.endsWith(host) || host.endsWith(h))) {
              return config.reverse ? '' : redirect(a.href);
            }
          }
        }
        else {
          const href = a.href;
          if (href) {
            if (config.urls.some(h => href.startsWith(h))) {
              return config.reverse ? '' : redirect(a.href);
            }
          }
        }
        // reverse mode
        if (config.reverse && a.href && a.href.indexOf('#') === -1) {
          if (a.href.startsWith('http') || a.href.startsWith('file')) {
            return redirect(a.href);
          }
        }
      }
    }
  }
  // click + modifier
  if (
    config.enabled &&
    e.button === config.button &&
    e.altKey === config.altKey &&
    e.ctrlKey === config.ctrlKey &&
    e.metaKey === config.metaKey &&
    e.shiftKey === config.shiftKey
  ) {
    const a = e.target.closest('a');
    if (a && a.href) {
      return redirect(a.href);
    }
  }
}, true);
