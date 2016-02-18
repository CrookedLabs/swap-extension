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
