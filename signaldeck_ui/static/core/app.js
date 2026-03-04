
function getResult(data) {
  console.log(data);
}



function getChartConfigScatter(ctx, xVals, yVals, unit) {
  xStepSize = 1000 * 60 * 60 //for intraday, 1 hour
  if (ctx.dataset["agg"] == "day") {
    xStepSize = 1000 * 60 * 60 * 24 * 5 //5 days
  }
  data = [];
  for (i = 0; i < xVals.length; i++) {
    data.push({ x: xVals[i], y: yVals[i] })
  }
  const yScalePart =
    ctx.dataset["ymin"] != "" && ctx.dataset["ymax"] != ""
      ? { y: { min: Math.floor(ctx.dataset["ymin"]), max: Math.floor(ctx.dataset["ymax"]) } }
      : {};

  return {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: ctx.dataset["label"],
          data: data,
          showLine: true,
          fill: false,
          //borderColor: 'rgba(0, 200, 0, 1)'
        }
      ]
    },
    options: {
      aspectRatio: 1.25,
      tooltips: {
        mode: 'index',
        intersect: false,
      },
      hover: {
        mode: 'nearest',
        intersect: true
      },
      scales: {
        x: {
          ticks: {
            callback: function (val, index) {
              val = new Date(val);
              if (ctx.dataset["agg"] == "") { return val.toLocaleTimeString(); }
              if (ctx.dataset["agg"] == "day") { return val.toLocaleDateString(); }
              return val.toString();
            },
            //color: "red",
            stepSize: xStepSize
          }
        },
        ...yScalePart
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              dateLong = context.parsed.x
              date = new Date(dateLong);
              dateRes = date.toString();
              if (ctx.dataset["agg"] == "") { dateRes = date.toLocaleTimeString(); }
              if (ctx.dataset["agg"] == "day") { dateRes = date.toLocaleDateString(); }
              yVal = context.parsed.y
              if (Math.round(yVal) != yVal) {
                yVal = Number(yVal).toFixed(2);
              }
              return dateRes + ": " + yVal + " " + unit
            }
          }
        }
      }
    }
  };
}


function getChartConfigBar(ctx, xVals, yVals, unit) {
  var step = 1
  if (xVals.length > 10) {
    step = Math.round(xVals.length / 10)  //approx. 10 labels
  }
  data = {
    labels: xVals,
    datasets: [
      {
        label: ctx.dataset["label"],
        data: yVals
      }
    ]
  }
  return {
    type: 'bar',
    data: data,
    options: {
      aspectRatio: 1.25,
      scales: {
        x: {
          ticks: {
            callback: function (val, index) {
              return val % step == 0 ? new Date(parseInt(this.getLabelForValue(val))).toLocaleDateString() : "";
            }
          }
        },
        y: {
          beginAtZero: true
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            title: function (context) {
              data = context[0];
              return new Date(parseInt(data.label)).toLocaleDateString();
            },
            label: function (context) {
              return parseFloat(context.parsed.y).toFixed(1) + " " + unit;
            }
          }
        }
      }
    }
  };
}

function initChart(ctx) {
  xVals = JSON.parse(ctx.dataset["xvals"])
  yVals = JSON.parse(ctx.dataset["yvals"])
  unit = ctx.dataset["unit"]

  var config = undefined;
  if (ctx.dataset["type"] == "scatter") {
    config = getChartConfigScatter(ctx, xVals, yVals, unit);
  }
  if (ctx.dataset["type"] == "bar") {
    config = getChartConfigBar(ctx, xVals, yVals, unit);
  }
  if (config == undefined) {
    console.log("Invalid chart type given.");
    return;
  }
  new Chart(ctx, config);
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
        if (data.render_charts != undefined) {
          data.render_charts.forEach(element => {
            el = document.getElementById(element);
            initChart(el);
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
        if (data.render_charts != undefined) {
          data.render_charts.forEach(element => {
            el = document.getElementById(element);
            initChart(el);
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
  $(".state-chart").each(function (index, record) {
    el = record
    initChart(el);
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