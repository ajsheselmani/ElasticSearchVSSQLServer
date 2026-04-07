export function Base64toBlob(base64, contentType) {
    contentType = contentType || '';
    var sliceSize = 512;
    base64 = base64.replace(/^[^,]+,/, '');
    base64 = base64.replace(/\s/g, '');
    var byteCharacters = window.atob(base64);
    var byteArrays = [];

    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        var slice = byteCharacters.slice(offset, offset + sliceSize);

        var byteNumbers = new Array(slice.length);
        for (var i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        var byteArray = new Uint8Array(byteNumbers);

        byteArrays.push(byteArray);
    }

    var blob = new Blob(byteArrays, { type: contentType });
    return blob;
}
