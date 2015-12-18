function walkTheDOM(node, func) {
  func(node);
  node = node.firstChild;
  while (node) {
    walkTheDOM(node, func);
    node = node.nextSibling;
  }
}

function getFromSyncStorage(cb) {
  chrome.storage.sync.get(function (items) {
    cb(items);
  });
}

function doReplace(items) {
  walkTheDOM(document, function (node) {
    if (node.nodeType === 3) {
      replaceText(node);
    }
  });

  function replaceText(textNode) {
    var text = textNode.data;

    if(items && items.itemsStorage) {
      var newItemsArr = items.itemsStorage.itemsArr;
      newItemsArr.forEach(function (el,i,arr) {
        text = text.replace(el.o, el.r);
      });
    }
    textNode.data = text;
  }

  var observer = new MutationObserver(function(mutations) {
    try {
      mutations.forEach(function(mutation) {
        if (mutation.addedNodes) {
          [].slice.call(mutation.addedNodes).forEach(function(node) {
            walkTheDOM(node, function (node) {
              if (node.nodeType === 3) {
                replaceText(node);
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

getFromSyncStorage(doReplace);
