export function capitalizer(str, separators) {
  separators = separators || [ ' ' ];
  var regex = new RegExp('(^|[' + separators.join('') + '])(\\w)', 'g');
  return str.toLowerCase().replace(regex, function(x) { return x.toUpperCase(); });
}

export function requestFullScreen(element) {

    let requestMethod = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || element.msRequestFullScreen;

    if (requestMethod) { // Native full screen.
        requestMethod.call(element);
    } else if (typeof window.ActiveXObject !== "undefined") { // Older IE.
        var wscript = new ActiveXObject("WScript.Shell");
        if (wscript !== null) {
            wscript.SendKeys("{F11}");
        }
    }
}

export function blobToDataURL(blob) {
    return new Promise((fulfill, reject) => {
        let reader = new FileReader();
        reader.onerror = reject;
        reader.onload = (e) => fulfill(reader.result);
        reader.readAsDataURL(blob);
    })
}

export function saveAs(uri, filename) {

    let link = document.createElement('a');

    if (typeof link.download === 'string') {
        link.href = uri;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.bsequiody.removeChild(link);
    } else {
        window.open(uri);
    }
}

export let searchObj = (obj, term) => {
  let key, keys = []
  for (key in obj)
    if (obj.hasOwnProperty(key) && term.test(key))
      keys.push(key)
  return keys.length ? keys : [""];
}