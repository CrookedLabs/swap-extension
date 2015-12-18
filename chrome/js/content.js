function getFromSyncStorage(cb) {
  chrome.storage.sync.get(function (items) {
    cb(items);
  });
}

function walkTheDOM(node, func) {
  func(node);
  node = node.firstChild;
  while (node) {
    walkTheDOM(node, func);
    node = node.nextSibling;
  }
}

function replaceText(node, items) {
  var text = node.data;

  if(items && items.itemsStorage) {
    var newItemsArr = items.itemsStorage.itemsArr;
    newItemsArr.forEach(function (el,i,arr) {
      text = text.replace(el.o, el.r);
    });
  }
  node.data = text;
}

function replace(items) {
  walkTheDOM(document, function (node) {
    if (node.nodeType === 3) {
      replaceText(node, items);
    }
  });

  var observer = new MutationObserver(function(mutations) {
    try {
      mutations.forEach(function(mutation) {
        if (mutation.addedNodes) {
          [].slice.call(mutation.addedNodes).forEach(function(node) {
            walkTheDOM(node, function (node) {
              if (node.nodeType === 3) {
                replaceText(node, items);
              }
            });
          });
        }
      });
    } catch (e) {
      console.log(e);
    }
  });

  observer.observe(document, {
    childList: true,
    subtree:   true
  });
}

getFromSyncStorage(replace);
