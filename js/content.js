// TODO: storage onchange when user adds new stuff, reload

function getFromSyncStorage() {
  chrome.storage.sync.get(function (items) {

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
      mutations.forEach(function(mutation) {
        if (mutation.addedNodes) {
          [].slice.call(mutation.addedNodes).forEach(function(node) {
            if (node.nodeName.toLowerCase() == "#text") {
              replaceText(node);
            }
          });
        }
      });
    });

    observer.observe(document, {
      childList: true,
      subtree:   true
    });
  });
}

getFromSyncStorage();
