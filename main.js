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
	var url = "http://18.217.53.24/DreamCatcherAgent/agent-release-raw-v2.php?";
	var imageType;
	if(source === "url"){
		var valSplit = value.split(".");
		imageType = valSplit[valSplit.length - 1];
		imageType = imageType.toLowerCase();

		$.ajax({
			method: "GET",
  			url: url,
  			data: {
  				imageLink: value,
  				imageType: imageType
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
		var file = document.querySelector("input[type=file]").files[0];
		var reader = new FileReader();
		
		reader.addEventListener("load", function () {
			// var localBase64 = reader.result.split("base64,")[1];
			var localBase64 = reader.result;
			// console.log(reader.result);
			// console.log(localBase64);
			imageType = localBase64.split(";base64,")[0];
			imageType = imageType.split("/")[1];
			imageType = imageType.toLowerCase();
			
			$.ajax({
			method: "POST",
			url: url,
			data: {
				imageSource: localBase64,
				imageType: imageType
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
		}, false);

		if (file) {
			reader.readAsDataURL(file);
		}

	} else {
		alert("Invalid source");
	}
}

function success(data){
	console.log("success");

	//console.log(data);
	//console.log(data.imageData);
	//console.log(data.info);

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

	// need to fix this part to have correct grammar in all different cases
	var html = "";
	html += "<p>";
	if(numEngaged == 1) {
		html += "There is 1 person engaged";
	} else {
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
	}
	
	if(numAsleep > 0) {
		html += numAsleep;
		html += " people asleep."
	}

	html += " The accuracy is ";
	html += accuracy;
	html += "%.";

	html += "</p>";

	html += '<img style="width: 90%" ';
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