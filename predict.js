/*
  Purpose: Pass information to other helper functions after a user clicks 'Predict'
  Args:
    value - Actual filename or URL
    source - 'url' or 'file'
*/
function predict_click(value, source) {
  // first grab current index
  var index = document.getElementById("hidden-counter").value;

  // Div Stuff
  if(index > 1) {
    createNewDisplayDiv(index);
  }
  
  if(source === "url") {
    document.getElementById("img_preview" + index).src = value;
    doPredict({ url: value });
    
    // Div Stuff
    createHiddenDivs("url", value);
  }
    
  else if(source === "file") {
    var preview = document.querySelector("#img_preview" + index);
    var file    = document.querySelector("input[type=file]").files[0];
    var reader  = new FileReader();

    // load local file picture
    reader.addEventListener("load", function () {
      preview.src = reader.result;
      var localBase64 = reader.result.split("base64,")[1];
      doPredict({ base64: localBase64 });
      
      // Div Stuff
      createHiddenDivs("base64", localBase64);
        
    }, false);

    if (file) {
      reader.readAsDataURL(file);
    }
  } 
}

/*
  Purpose: Does a v2 prediction based on user input
  Args:
    value - Either {url : urlValue} or { base64 : base64Value }
*/
function doPredict(value) {

  var modelID = getSelectedModel();

  app.models.predict(modelID, value).then(
    
    function(response) {
      console.log(response);
      var conceptNames = "";
      var tagArray, regionArray;
      var tagCount = 0;
      var modelName = response.rawData.outputs[0].model.name;
      var modelNameShort = modelName.split("-")[0];
      var modelHeader = '<b><span style="font-size:14px">' + capitalize(modelNameShort) + ' Model</span></b>';
      // removes "My Model" text from appearing
      modelHeader = "";
      
      // Check for regions models first
      if(response.rawData.outputs[0].data.hasOwnProperty("regions")) {
        regionArray = response.rawData.outputs[0].data.regions;
      	
        // Regions are found, so iterate through all of them
        for(var i = 0; i < regionArray.length; i++) {
      	  conceptNames += "<b>Result " + (i+1) + "</b>";  
      		 		
      	  // Demographic has separate sub-arrays
      	  if(modelName == "demographics") {
      	    var ageArray = regionArray[i].data.face.age_appearance.concepts;
      	    var ethnicArray = regionArray[i].data.face.multicultural_appearance.concepts;
      	    var genderArray = regionArray[i].data.face.gender_appearance.concepts;
          
            // Age Header
      	    conceptNames += '<br/><b><span style="font-size:10px">Age Appearance</span></b>';
      		
      	    // print top 5 ages
      	    for(var a = 0; a < 5; a++) {
      	      conceptNames += '<li>' + ageArray[a].name + ': <i>' + ageArray[a].value + '</i></li>'; 
            }
      		
      	    // Ethnicity Header
      	    conceptNames += '<b><span style="font-size:10px">Multicultural Appearance</span></b>';
      			
      	    // print top 3 ethnicities
      	    for(var e = 0; e < 3; e++) {
      	      conceptNames += '<li>' + ethnicArray[e].name + ': <i>' + ethnicArray[e].value + '</i></li>'; 
            }
            
      	    // Gender Header
      	    conceptNames += '<b><span style="font-size:10px">Gender Appearance</span></b>';
      		
      	    // print gender
      	    conceptNames += '<li>' + genderArray[0].name + ': <i>' + genderArray[0].value + '</i></li>'; 
      	}
      		
        // For faces just print bounding boxes
      	else if(modelName == "face-v1.3") {
      	  // Top Row
      	  conceptNames += '<li>Top Row: <i>' + regionArray[i].region_info.bounding_box.top_row + '</i></li>';
      	  conceptNames += '<li>Left Column: <i>' + regionArray[i].region_info.bounding_box.left_col + '</i></li>';
      	  conceptNames += '<li>Bottom Row: <i>' + regionArray[i].region_info.bounding_box.bottom_row + '</i></li>';
      	  conceptNames += '<li>Right Column: <i>' + regionArray[i].region_info.bounding_box.right_col + '</i></li>';
      	}
      		
      	// Celebrity
      	else if(modelName == "celeb-v1.3") {
      	  tagArray = regionArray[i].data.face.identity.concepts;
      			
      	  // Print first 10 results
      	  for(var c=0; c < 10; c++) {
      	    conceptNames += '<li>' + tagArray[c].name + ': <i>' + tagArray[c].value + '</i></li>'; 
          }
      	}
      		
      	// Logos
      	else if(modelName == "logo") {
      	  // Print all results
      	  conceptNames += '<br/><b><span style="font-size:10px">Logo</span></b>';
      	  conceptNames += '<li>' + regionArray[i].data.concepts[0].name + ': <i>' + regionArray[i].data.concepts[0].value + '</i></li>';
      	  conceptNames += '<br/><b><span style="font-size:10px">Location</span></b>';
      	  conceptNames += '<li>Top Row: <i>' + regionArray[i].region_info.bounding_box.top_row + '</i></li>';
      	  conceptNames += '<li>Left Column: <i>' + regionArray[i].region_info.bounding_box.left_col + '</i></li>';
      	  conceptNames += '<li>Bottom Row: <i>' + regionArray[i].region_info.bounding_box.bottom_row + '</i></li>';
      	  conceptNames += '<li>Right Column: <i>' + regionArray[i].region_info.bounding_box.right_col + '</i></li>';
      	}
      		
      	// Focus
      	else if(modelName == "focus") {
      	  // Print total focus score and all regions with focus
      	  conceptNames += '<br/><b><span style="font-size:10px">Focus Region</span></b>';
      	  conceptNames += '<li>Top Row: <i>' + regionArray[i].region_info.bounding_box.top_row + '</i></li>';
      	  conceptNames += '<li>Left Column: <i>' + regionArray[i].region_info.bounding_box.left_col + '</i></li>';
      	  conceptNames += '<li>Bottom Row: <i>' + regionArray[i].region_info.bounding_box.bottom_row + '</i></li>';
      	  conceptNames += '<li>Right Column: <i>' + regionArray[i].region_info.bounding_box.right_col + '</i></li>';
          
          if(i === regionArray.length - 1) {
      		  conceptNames += '<br><br><li><br><br>Overall Focus: <i>' + response.rawData.outputs[0].data.focus.value + '</i><br><br><br></li>'; 
      		}
      	}

      	tagCount+=10;      	
      }
     }
      
      // Color Model
      else if(modelName === "color") {
      	conceptNames += '<b><span style="font-size:10px">Colors</span></b>';
        tagArray = response.rawData.outputs[0].data.colors;
        
        for (var col = 0; col < tagArray.length; col++) {
          conceptNames += '<li>' + tagArray[col].w3c.name + ': <i>' + tagArray[col].value + '</i></li>';
        }
        
        tagCount=tagArray.length;
      }
      
      // Generic tag response models
      else if(response.rawData.outputs[0].data.hasOwnProperty("concepts")) {
        tagArray = response.rawData.outputs[0].data.concepts;
        
        for (var other = 0; other < tagArray.length; other++) {
          conceptNames += '<li>' + tagArray[other].name + ': <i>' + tagArray[other].value + '</i></li>';
        }
        
        tagCount=tagArray.length;
      }
      
      // Bad region request
      else {
      	if(modelName != "logo" && modelName != "focus") {
          $('#concepts').html("<br/><br/><b>No Faces Detected!</b>");
        }
      	else if(modelName == "logo") {
          $('#concepts').html("<br/><br/><b>No Logos Detected!</b>");
        }
        else {
          $('#concepts').html("<br/><br/><b>No Focus Regions Detected!</b>");
        }
      	return;
      }
      
      var columnCount = tagCount / 10;
      
      // Focus gets one more column
      if(modelName == "focus") {
      	columnCount += 1;
      }
      
      conceptNames = '<ul style="margin-right:20px; margin-top:20px; columns:' + columnCount + '; -webkit-columns:' + columnCount + '; -moz-columns:' + columnCount + ';">' + conceptNames;
        
      conceptNames += '</ul>';
      conceptNames = modelHeader + conceptNames;
      
      $('#concepts').html(conceptNames);
      
      document.getElementById("add-image-button").style.visibility = "visible";
    },
    function(err) {
      console.log(err);
    }
  );
}

/*
  Purpose: Return a back-end model id based on current user selection
  Returns:
    Back-end model id

  Modified to always use our custom model
*/
function getSelectedModel() {
  return "my-first-application";
}

/*
  Purpose: Create a dynamic div to store entire user session
  Args:
    index - # of the image in the session
*/
function createNewDisplayDiv(index) {
  var mainDiv = document.getElementById("predictions");
  
  var elem = document.createElement('div');
  elem.innerHTML = 
    '<div style="margin-top:30px; margin-left:20px; margin-bottom:30px; clear:left; float:left"> \
      <img id="img_preview' + index + '" src="" width="400"/> \
      <br/> \
    </div> \
    <div id="concepts" class="conceptBox"> \
    </div>';
    
  mainDiv.innerHTML = elem.innerHTML + mainDiv.innerHTML;
}

/*
  Purpose: Creates hidden Div elements to store info of each picture uploaded
  Args:
    urlOrBase64 - binary variable to store the type of image
    source - the actual URL string or the base64
*/
function createHiddenDivs(urlOrBase64, source) {
  // first grab current index
  var index = document.getElementById("hidden-counter").value;
  
  // type
  var input1 = document.createElement("input");
  input1.setAttribute("type", "hidden");
  input1.setAttribute("id", "hidden-type"+index);
  input1.setAttribute("name", "hidden-type"+index);
  input1.setAttribute("value", urlOrBase64);
  
  // value
  var input2 = document.createElement("input");
  input2.setAttribute("type", "hidden");
  input2.setAttribute("id", "hidden-val"+index);
  input2.setAttribute("name", "hidden-val"+index);
  input2.setAttribute("value", source);
  
  // add new inputs to page
  document.getElementsByTagName('body')[0].appendChild(input1);
  document.getElementsByTagName('body')[0].appendChild(input2);
  
  // increment index
  document.getElementById("hidden-counter").value = parseInt(index)+1;
}

/*
  Purpose: Return a capitalized String
  Args:
    s - A String
*/
function capitalize(s)
{
  return s[0].toUpperCase() + s.slice(1);
}
