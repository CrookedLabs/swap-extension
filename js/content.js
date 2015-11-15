// TODO: storage onchange when user adds new stuff, reload

getFromSyncStorage();

function walk(rootNode, items) {
  // Find all the text nodes in rootNode
  var walker = document.createTreeWalker(
    rootNode,
    NodeFilter.SHOW_TEXT,
    null,
    false
  ),
  node;

  // Modify each text node's value
  while (node = walker.nextNode()) {
    handleText(node, items);
  }
}

function handleText(textNode, items) {
  textNode.nodeValue = replaceText(textNode.nodeValue, items);
}

function replaceText(v, items) {
  if(items && items.itemsStorage) {
    var newItemsArr = items.itemsStorage.itemsArr;
    newItemsArr.forEach(function (el,i,arr) {
      if (el.o && v && v.length > 0 && v.indexOf(el.o) >= 0) {
        v = v.replace(el.o, el.r);
      }
    });
  }
  return v;
}

// Walk the doc (document) body, replace the title, and observe the body and title
function walkAndObserve(doc, items) {
  var docTitle = doc.getElementsByTagName('title')[0],
  observerConfig = {
    characterData: true,
    childList: true,
    subtree: true
  },
  bodyObserver, titleObserver;

  // Do the initial text replaasdcements in the document body and title
  walk(doc.body, items);
  doc.title = replaceText(doc.title, items);

  // Observe the body so that we replace text in any added/modified nodes
  bodyObserver = new MutationObserver(function (mutations) {
    var i;

    mutations.forEach(function(mutation) {
      for (i = 0; i < mutation.addedNodes.length; i++) {
        if (mutation.addedNodes[i].nodeType === 3) {
          // Replace the text for text nodes
          handleText(mutation.addedNodes[i], items);
        } else {
          // Otherwise, find text nodes within the given node and replace text
          walk(mutation.addedNodes[i], items);
        }
      }
    });
  });
  bodyObserver.observe(doc.body, observerConfig);

  // Observe the title so we can handle any modifications there
  if (docTitle) {
    titleObserver = new MutationObserver(function (mutations) {
      var i;

      mutations.forEach(function(mutation) {
        for (i = 0; i < mutation.addedNodes.length; i++) {
          if (mutation.addedNodes[i].nodeType === 3) {
            // Replace the text for text nodes
            handleText(mutation.addedNodes[i], items);
          } else {
            // Otherwise, find text nodes within the given node and replace text
            walk(mutation.addedNodes[i], items);
          }
        }
      });
    });
    titleObserver.observe(docTitle, observerConfig);
  }
}

function getFromSyncStorage() {
  chrome.storage.sync.get(function (items) {
    walkAndObserve(document, items);
  });
}
