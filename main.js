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

// array to store strings of the div ids
var divNames = new Array();

// the current div
var currentDiv = 0;

$(document).ready( function() {
	// adds strings of the div ids
	divNames.push("#main-div");
	divNames.push("#how-it-works-div");
	divNames.push("#faq-div");

	hideAllDivs(divNames);

	// show main-div
	$(divNames[0]).fadeIn();

	$(':file').on('fileselect', function(event, numFiles, label) {
			console.log(numFiles);
			console.log(label);
	});
});

// hides currentDiv, displays divNames[div-num], updates currentDiv
function displayDiv(num){
	event.preventDefault();
	$(divNames[currentDiv]).hide();
	$(divNames[num]).fadeIn();
	currentDiv = num;
};

// hide all divs
function hideAllDivs(divNames){
	for(var i = 0; i < divNames.length; i++){
		$(divNames[i]).hide();
	}
};

$(document).on('change', ':file', function() {
		var input = $(this),
				numFiles = input.get(0).files ? input.get(0).files.length : 1,
				label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
		input.trigger('fileselect', [numFiles, label]);
});