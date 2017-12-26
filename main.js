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
}

// hide all divs
function hideAllDivs(divNames){
	for(var i = 0; i < divNames.length; i++){
		$(divNames[i]).hide();
	}
}

// when a predict url/file button is clicked
//   source either 'url' or 'file'
//   GET for url, POST for file
// http://www.freepngimg.com/download/happy_person/2-2-happy-person-free-download-png.png
function predict_click(value, source){
	if(source === "url"){
		var url = "http://18.217.53.24/DreamCatcherAgent/agent-release-raw-v2.php?";
		$.ajax({
			method: "GET",
  			url: url,
  			data: {
  				imageLink: value
  			},
  			success:
  			function(data){
  				success(data);
  			},
  			error:
  			function(a,b,c){
  				console.log("fail");
  				console.log(a);
  				console.log(b);
  				console.log(c);
  			},
  			dataType: "json"
		});
	} else if (source === "file"){
		console.log("this is the value:");
		console.log(value);
		$.ajax({
			method: "POST",
  			url: url,
  			data: {
  				imageSource: value
  			},
  			success:
  			function(data){
  				success(data);
  			},
  			error:
  			function(a,b,c){
  				console.log("fail");
  				console.log(a);
  				console.log(b);
  				console.log(c);
  			},
  			dataType: "json"
		});
	} else {
		alert("Invalid source");
	}
}

function success(data){
	console.log("success");

	console.log(data);
	console.log(data.imageData);
	console.log(data.info);
	console.log(data.info.length);
	console.log(data.info[0]);

	var numEngaged = 0;
	var numAsleep = 0;
	var accuracy = 100;

	for(var i = 0; i < data.info.length; i++) {
		if(data.info[i].engage >= data.info[i].sleep) {
			numEngaged++;
			accuracy *= data.info[i].engage; 
		} else {
			numAsleep++;
			accuracy *= data.info[i].sleep;
		}

	}

	var html = "";
	html += "<p>";
	html += "There are ";
	if(numEngaged > 0) {
		html += numEngaged;
		html += " people engaged";
		if(numAsleep > 0) {
			html += " and ";
		} else {
			html += ".";
		}
	}
	if(numAsleep > 0) {
		html += numAsleep;
		html += "people asleep."
	}

	html += " The accuracy is ";
	html += accuracy;
	html += "%.";

	html += "</p>";

	html += '<img style="width: 80%" ';
	html += 'src="';
	// image here
	html += data.imageData;
	html += '" />';

	$("#results").html(html);
	$("#results-modal").modal("show");
}

/*
$(document).on('change', ':file', function() {
		var input = $(this),
				numFiles = input.get(0).files ? input.get(0).files.length : 1,
				label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
		input.trigger('fileselect', [numFiles, label]);
});
*/