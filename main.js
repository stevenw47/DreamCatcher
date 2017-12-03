try {
    var app = new Clarifai.App({
     apiKey: myApiKey
    });
  }
  catch(err) {
    alert("Need a valid API Key!");
    throw "Invalid API Key";
  }
  
  // Checks for valid image type
  function validFile(imageName) {
    var lowerImageName = imageName.toLowerCase();
    return lowerImageName.search(/jpg|png|bmp|tiff/gi) != -1;
  }

$(document).ready( function() {
    $(':file').on('fileselect', function(event, numFiles, label) {
        console.log(numFiles);
        console.log(label);
    });
});

$(document).on('change', ':file', function() {
    var input = $(this),
        numFiles = input.get(0).files ? input.get(0).files.length : 1,
        label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
    input.trigger('fileselect', [numFiles, label]);
});