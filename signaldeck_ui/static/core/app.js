
function getResult(data) {
  console.log(data);
}


function addStateChangeEvent(id, actionhash, get_params) {
  console.log(actionhash)
  console.log($('.control-element-button[data-actionhash="' + actionhash + '"]')[0])
  let elementName = $('.control-element-button[data-actionhash="' + actionhash + '"]')[0].dataset["element"]
  state_params = $("#state_" + actionhash).data("params");
  const params = { ...state_params, ...JSON.parse(get_params) }
  var fileInput = null;

  $("#" + id).click(function (element) {
    for (const [key, value] of entriesStartingWithAt(params)) {
      const [isFile, val] = resolveValue(value.slice(1)); // Beispiel: "@" entfernen
      if (isFile) {
        fileInput = val; // Speichern des File-Objekts
        delete params[key];
      } else {
        params[key] = val; // Ersetzen des Platzhalters durch den tatsächlichen Wert
      }
    }
    const fd = new FormData();
    if (fileInput) {
      fd.append("file", fileInput);
    }
    fd.append("payload", JSON.stringify({ actionhash, ...params })); // JSON als String dazu

    $.ajax({
      url: "/run",
      type: "POST",
      data: fd,
      processData: false,
      contentType: false,
      success: function (data) {
        if (data.html != undefined) {
          document.getElementById("state-" + elementName).innerHTML = data.html;
        }
        if (data.stateChangeEvents != undefined) {
          data.stateChangeEvents.forEach(element => {
            addStateChangeEvent(element["id"], element["actionhash"], element["get_params"]);
          });
        }

        if (data.js_functions !== undefined) {

          Object.entries(data.js_functions).forEach(([elementId, functionName]) => {

            const el = document.getElementById(elementId);
            const fn = window[functionName];

            if (!el) {
              console.warn("Element nicht gefunden:", elementId);
              return;
            }

            if (typeof fn !== "function") {
              console.warn("JS Funktion nicht gefunden:", functionName);
              return;
            }

            fn(el);

          });

        }
      }
    })
  })
}
function resolveValue(name) {
  console.log("Resolve value for " + name);

  const el = document.getElementById(name);
  if (!el) return [false, null];

  // file input?
  if (el instanceof HTMLInputElement && el.type === "file") {
    const file = el.files && el.files.length > 0 ? el.files[0] : null;
    return [true, file]; // boolean=true => file input (value ist File oder null)
  }

  // normal input/select/textarea etc.
  return [false, $('#' + name).val()];
}

function* entriesStartingWithAt(obj) {
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string" && value.startsWith("@")) {
      yield [key, value];
    }
  }
}


$(document).ready(function () {
  $(".control-element-button").click(function (element) {
    el = element.target;
    $.ajax({
      url: "/run",
      data: { actionhash: el.dataset.actionhash },
      indexValue: el.dataset.element,
      success: function (data) {
        if (data.html != undefined) {
          document.getElementById("state-" + this.indexValue).innerHTML = data.html;
        }
        if (data.stateChangeEvents != undefined) {
          data.stateChangeEvents.forEach(element => {
            addStateChangeEvent(element["id"], element["actionhash"], element["get_params"]);
          });
        }
        if (data.js_functions !== undefined) {

          Object.entries(data.js_functions).forEach(([elementId, functionName]) => {

            const el = document.getElementById(elementId);
            const fn = window[functionName];

            if (!el) {
              console.warn("Element nicht gefunden:", elementId);
              return;
            }

            if (typeof fn !== "function") {
              console.warn("JS Funktion nicht gefunden:", functionName);
              return;
            }

            fn(el);

          });

        }
      }
    });
  }
  )
  $(".action-element-button").each(function (index, record) {
    el = record
    addStateChangeEvent(el.id, el.dataset["actionhash"], el.dataset["params"])
  })

  $('.copy-btn').on('click', function () {
    const $btn = $(this);
    const hash = $btn.data('hash');

    // moderner Clipboard‑API‑Weg
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(hash).then(() => {
        $btn.addClass('copied');
        setTimeout(() => $btn.removeClass('copied'), 1500);
      }).catch(() => fallbackCopy(hash, $btn));
    } else {
      fallbackCopy(hash, $btn);
    }
  });

  function fallbackCopy(text, $btn) {
    // alter execCommand‑Fallback
    const $tmp = $('<textarea>')
      .val(text)
      .css({ position: 'fixed', top: 0, left: 0, opacity: 0 })
      .appendTo('body')
      .select();

    document.execCommand('copy');
    $tmp.remove();
    alert('Hash kopiert!');
    $btn.addClass('copied');
    setTimeout(() => $btn.removeClass('copied'), 1500);
  }


});