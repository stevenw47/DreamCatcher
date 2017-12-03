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