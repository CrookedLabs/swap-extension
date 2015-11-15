$(function () {
  ///// Element setup
  var optionsMessage = $(".options-message");


  ///// User actions

  // Submit entry to sync storage
  $('.replace-form').on('submit', function (e) {
    e.preventDefault();

    var o = $("#o").val();
    var r = $("#r").val();

    emptyWarning();

    if (!o || !r) {
      showWarning();
    } else {
      (function getNamesAndReplace() {

        var itemsArr = [];

        var inputs = $('.replace-inputs').find(':input[type="text"]');

        var obj = {};
        inputs.map(function (idx, i) {
          if (idx === 0) {
            obj.o = i.value;
          } else if (idx === 1) {
            obj.r = i.value;
          }
        });
        itemsArr.push(obj);

        console.log(itemsArr);
        setToSyncStorage(itemsArr);

        emptyInputs();
      })();
    }
  });

  // Show/hide options
  $(".options-header").on('click', function () {
    $(".options-container").toggle();
    $(".chevron").toggleClass('chevron-up');
  });

  // Export items
  $(".export").on('click', function () {
    optionsMessageFunc("Copy and send to a friend!");

    $(".json-import").hide();
    $(".json-export").show();
    $(".export").addClass('selected');
    $(".import").removeClass('selected');

    getFromSyncStorage(function (items) {
      if (isEmpty(items)) {
        $(".json-code").text("Nothing to export here. Replace something first, will ya!");
      } else {
        var exportJson = JSON.stringify(items, undefined, 2);
        $(".json-code").html(exportJson);
      }
    });
  });

  $(".import").on('click', function () {
    optionsMessageFunc("Paste your code watch the magic happen!");

    $(".json-export").hide();
    $(".json-import").show();
    $(".import").addClass('selected');
    $(".export").removeClass('selected');
  });

  $(".json-import-submit").on('click', function () {
    var parsedJson = {};
    try {
      parsedJson = JSON.parse($(".json-import-textarea").prop('value'));
    } catch (e) {
      console.log(e);
    }

    if(isEmpty(parsedJson)) {
      $(".json-import-textarea").prop('value', "Ugh, the code you inserted is not proper json. Try copying the code and pasting it again!");

      return;

    } else {
      chrome.storage.sync.set(parsedJson);
      $(".json-import").hide();
      $(".json-import-textarea").prop('value', "");
      optionsMessageFunc("Success!", true);
    }
  });

  // Clear entire storage
  $(".reset").on('click', function () {
    chrome.storage.sync.clear();

    emptyWarning();
  });


  ///// Storage functions

  // Set items to storage
  function setToSyncStorage(itemsArr) {
    chrome.storage.sync.get(function (items) {
      if(Object.keys(items).length > 0 && items.itemsStorage) {
        itemsArr.forEach(function (el) {
          items.itemsStorage.itemsArr.push({o: el.o, r: el.r});
        });
        chrome.storage.sync.set(items);
      } else {
        var storage = {};
        storage.itemsStorage = {itemsArr: itemsArr};
        chrome.storage.sync.set(storage);
      }
    });
  }

  // Get array of objects from storage
  function getFromSyncStorage(cb) {
    chrome.storage.sync.get(function (items) {
      cb(items);
    });
  }

  // Setup popup display
  function popupDisplay(items) {
    var replacedList = $(".replaced-list");
    var reset = $(".reset");

    replacedList.empty();

    var replacedItem = "";

    if (!isEmpty(items)) {
      var newItemsArr = items.itemsStorage.itemsArr;

      newItemsArr.forEach(function (el) {
        var orig = el.o;
        var rep = el.r;

        replacedItem = '<div class="replaced-item">' +
        '<div class="original-text">' + orig + '</div>' +
        '<div class="is-now-container">' +
        '<img src="./images/swap-vertical.svg" class="is-now" />' +
        '</div>' +
        '<div class="replaced-text">' + rep + '</div>' +
        '<img src="./images/trash.svg" class="delete-item" />' +
        '</div>';

        $(replacedItem).appendTo(replacedList);

        reset.show();
      });

      // Setup delete function
      deleteItem(items);
    } else {
      reset.hide();

      replacedItem = '<div class="replaced-item empty">' +
      '<div class="noitems">You haven\'t replaced anything!' +
      '</div>';

      $(replacedItem).appendTo(replacedList);
    }
  }

  // Delete storage item
  function deleteItem(items) {
    $('.delete-item').on('click', function (e) {
      var storageKey = $(this).prevAll('.original-text').text().trim();

      chrome.storage.sync.get(function (items) {
        var newArr = items.itemsStorage.itemsArr.filter(function (item) {
          return item.o !== storageKey;
        });
        items.itemsStorage.itemsArr = newArr;

        if (items.itemsStorage.itemsArr.length === 0) {
          chrome.storage.sync.clear();
        } else {
          chrome.storage.sync.set(items);
        }
      });
    });
  }

  //// Helper functions
  function optionsMessageFunc(message, success) {
    if (success) {
      optionsMessage.text(message).css("color", "#2979ff");
      setTimeout(function() {
        optionsMessage.text("");
      }, 3000);
    } else {
      optionsMessage.text(message).css("color", "#999999");
    }
  }

  // Empty object check
  function isEmpty(obj) {
    for (var k in obj) {
      if (obj.hasOwnProperty(k)) {
        return false;
      }
    }
    return true;
  }

  // Show warning for inputs not being filled out
  function showWarning() {
    $("<span class='warning'>You forgot to fill something out!</span>").appendTo(".replace-submit");
  }

  // Clear warning
  function emptyWarning() {
    var warning = $(".warning");

    if (warning) {
      warning.remove();
    }
  }

  function emptyInputs() {
    var inputs = $('.replace-inputs').find('input[type="text"]');
    inputs.each(function () {
      $(this).val("");
    });
  }

  // Get objects to display in popup
  getFromSyncStorage(popupDisplay);

  chrome.storage.onChanged.addListener(function () {
    getFromSyncStorage(popupDisplay);
  });

});
