$(function () {
  ///// Element setup
  var optionsMessage = $(".options-message");
  var feedbackBtn = $(".feedback-toggle");
  var feedbackModal = $(".feedback-modal");
  var feedbackSubmitting = $(".feedback-submitting");
  var feedbackThanks = $(".feedback-ty");
  var originalInput = $("#o");
  var replacedInput = $("#r");
  var rateLink = $(".rate-link");

  var SWAPS = [
    {"original": "ex: John Stamos", "replaced": "Uncle Jesse"},
    {"original": "ex: Anderson Cooper", "replaced": "Anderson Pooper"},
    {"original": "ex: moist", "replaced": "kinda wet"},
    {"original": "ex: Donald Trump", "replaced": "Donald Drumpf"}
  ];

  var randPlaceholder = SWAPS[Math.floor(Math.random() * SWAPS.length)];

  originalInput.attr("placeholder", randPlaceholder.original);
  replacedInput.attr("placeholder", randPlaceholder.replaced);

  ///// User actions

  // Click rate
  analytics.trackLink(rateLink, "Rate App");

  // Social tracking
  $(".facebook-share").on("click", function() {
    analytics.track("Share", {
      "network": "Facebook"
    });
  });

  $(".twitter-share").on("click", function() {
    analytics.track("Share", {
      "network": "Twitter"
    });
  });

  // Toggle feedback
  $(".feedback-toggle").on("click", function() {
    if (!$(this).hasClass("active")) {
      analytics.track("Feedback Link", {
        text: $(this).text()
      });
    }

    emptyWarning();
    $(this).toggleClass("active");
    feedbackModal.toggle();
  });

  // Submit feedback
  var request;
  $("#feedback").on("submit", function(e) {
    e.preventDefault();
    emptyWarning();

    if (request) {
      request.abort();
    }

    var email = $("#feedback-email").val();

    if (validateEmail(email)) {
      feedbackSubmitting.toggle();

      var $form = $(this);
      var $inputs = $form.find("input[type='text'], textarea");
      var serializedData = $form.serialize();

      $inputs.prop("disabled", true);

      request = $.ajax({
        url: "https://script.google.com/macros/s/AKfycbyBto2rr29_U5b4qhikd5zjhPqtv7GeLjpKqcmTCdzdh0Fa5jM/exec",
        type: "post",
        data: serializedData
      }).done(function(response, textStatus, jqXHR) {
        feedbackThanks.toggle();
        feedbackSubmitting.toggle();

        $inputs.each(function() {
          $(this).val("");
        });

        analytics.track("Leave Feedback", {
          "success": true,
          "email": email
        });

        window.setTimeout(function() {
          feedbackModal.toggle();
          feedbackThanks.toggle();
          feedbackBtn.toggleClass("active");
        }, 3000);
      }).fail(function(jqXHR, textStatus, error) {
        console.log("The following error occurred: " + textStatus, error);
      }).always(function() {
        $inputs.prop("disabled", false);
      });
    } else {
      showEmailWarning();
      analytics.track("Leave Feedback", {
        "success": false,
        "email": email
      })
    }
  });

  // Submit entry to sync storage
  $('.replace-form').on('submit', function (e) {
    e.preventDefault();

    emptyWarning();

    var o = $("#o").val();
    var r = $("#r").val();

    if (!o || !r) {
      showWarning();
    } else {
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

      setToSyncStorage(itemsArr);

      analytics.track("Swapped", {
        "original": o,
        "replaced": r
      });

      emptyInputs();
    }
  });

  // Clear entire storage
  $(".reset").on('click', function () {
    chrome.storage.sync.clear();

    analytics.track("Delete All");

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
      '<div class="noitems">You haven\'t swapped anything!' +
      '</div>';

      $(replacedItem).appendTo(replacedList);
    }
  }

  // Delete storage item
  function deleteItem(items) {
    $('.delete-item').on('click', function (e) {
      var storageKey = $(this).prevAll('.original-text').text();

      chrome.storage.sync.get(function (items) {
        var newArr = items.itemsStorage.itemsArr.filter(function (item) {
          if (item.o === storageKey) {
            analytics.track("Deleted", {
              "original": item.o,
              "replaced": item.r
            });
          }

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
    inputs.first().focus();
  }

  function showEmailWarning() {
    $("<span class='warning'>Please enter a valid email!</span>").insertAfter("#feedback-email");
  }

  function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  }

  // Get objects to display in popup
  getFromSyncStorage(popupDisplay);

  chrome.storage.onChanged.addListener(function () {
    getFromSyncStorage(popupDisplay);
  });

});
