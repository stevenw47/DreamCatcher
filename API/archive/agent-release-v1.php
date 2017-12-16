
<?php
    /*
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     * http://www.apache.org/licenses/LICENSE-2.0
     */

    require __DIR__ . '/vendor/autoload.php';
    
    //Imports the Google Cloud client library
    use Google\Cloud\Vision\VisionClient;
    use Google\Cloud\Storage\StorageClient;
    use PhpFanatic\clarifAI\ImageClient;

    //$start = microtime(true);

    //User ID
    $userID = 'anonymous';
    if(isset($_GET['userID'])){
        $userID = $_GET['userID'];
    }

    //Google Vision API and Storage Bucket Info
    $projectId = '[project id]';
    $bucket = '[bucket name]';
    $serviceAccountPath = 'credentials/[your file].json';

    //Clarfai API Info
    $clarfaiAPI = '[api key]';
    $clarfaiModelName = '[model name]';

    //An array that contains all the invariant data
    $infoArray = Array("imagePath" => "", "userID" => $userID, "projectID" => $projectId, "bucket" => $bucket, "serviceAccount" => $serviceAccountPath, "clarfaiAPI" => $clarfaiAPI, "clarfaiModelName" => $clarfaiModelName);
    //Functions that uses Google Vision API to get the vertices of the faces of an image
    function detect_face($infoArray)
    {
        $configGoogle = [
            'keyFilePath' => $infoArray['serviceAccount'],
            'projectId' => $infoArray['projectID'],
        ];
        $vision = new VisionClient($configGoogle);
        $image = $vision->image(file_get_contents($infoArray['imagePath']), ['FACE_DETECTION']);
        $result = $vision->annotate($image);
        $arrR = (array)$result;
        reset($arrR);
        $key = array_keys($arrR)[0];
        $attributesArr = $arrR[$key]["faceAnnotations"];
        $bPolyArrays = array();
        foreach ($attributesArr as $tempA) {
            array_push($bPolyArrays, $tempA["boundingPoly"]);
        }
        return $bPolyArrays;
    }
    

    //Functions to genetare picture in Base64 format and get the cropped faces in an image
    function generatePicB64($sourcePath, $xStart, $yStart, $xSize, $ySize){
        $im = imagecreatefromjpeg($sourcePath);
        $im2 = imagecrop($im, ['x' => $xStart, 'y' => $yStart, 'width' => $xSize, 'height' => $ySize]);
        if ($im2 !== FALSE) {
            ob_start(); 
            imagejpeg($im2); 
            $contents = ob_get_contents(); 
            ob_end_clean();             
            $dataUri = "data:image/jpeg;base64," . base64_encode($contents);        
        }else{
            echo"failed";
        }
        return $dataUri;
    }

    function getCroppedImage($bPA, $path){
        $dataArr = array();
        for ($i=0; $i < sizeof($bPA); $i++) { 
            $vx1 = $bPA[$i]["vertices"][0]["x"];
            $vy1 = $bPA[$i]["vertices"][0]["y"];
            $vx2 = $bPA[$i]["vertices"][1]["x"];
            $vy2 = $bPA[$i]["vertices"][1]["y"];
            $vx3 = $bPA[$i]["vertices"][2]["x"];
            $vy3 = $bPA[$i]["vertices"][2]["y"];
            $vx4 = $bPA[$i]["vertices"][3]["x"];
            $vy4 = $bPA[$i]["vertices"][3]["y"];
            $xlen = abs($vx2-$vx1);
            $ylen = abs($vy3-$vy1);
            $dataTempURI = generatePicB64($path, $vx1, $vy1, $xlen, $ylen);
            array_push($dataArr, $dataTempURI);
        }
        return $dataArr;
    }


    //Functions for Uploading/Deleting Objects to Google Storage Bucket
    function upload_object($objectName, $source, $infoArray)
    {
        $configGoogle = [
            'keyFilePath' => $infoArray['serviceAccount'],
            'projectId' => $infoArray['projectID'],
        ];
        $storage = new StorageClient($configGoogle);
        $file = fopen($source, 'r');
        $bucket = $storage->bucket($infoArray['bucket']);
        $object = $bucket->upload($file, [
            'name' => $objectName
        ]);
        $object2 = $bucket->object($objectName);
        $object2->update(['acl' => []], ['predefinedAcl' => 'PUBLICREAD']);
    }

    function delete_object($objectName, $infoArray)
    {
        $configGoogle = [
            'keyFilePath' => $infoArray['serviceAccount'],
            'projectId' => $infoArray['projectID'],
        ];
        $storage = new StorageClient($configGoogle);
        $bucket = $storage->bucket($infoArray['bucket']);
        $object = $bucket->object($objectName);
        $object->delete();
    }

    function uploadBatchToGS($dataA, $infoArray){
        $arr = array();
        for ($i=0; $i <sizeof($dataA) ; $i++) { 
            $objName = "P-" . $infoArray['userID']. "-" .($i+1).".jpg";
            upload_object($objName, $dataA[$i], $infoArray);
            array_push($arr, $objName);
        }
        return $arr;
    }
    
    function deleteBatchFromGS($objArr, $infoArray){
        for ($i=0; $i <sizeof($objArr) ; $i++) { 
            delete_object($objArr[$i], $infoArray);
        }
    }       
 
    //Helper functions to upload and delete the image source for analysis   
    function uploadSource($infoArray){
        $objName = $infoArray['userID'] . "sourceFile.jpg";
        $imgSource = "";
        try{
            if(isset($_POST['imageSource'])){
                $imgSource = $_POST['imageSource'];
                upload_object($objName, $imgSource, $infoArray);
            }else if(isset($_GET['imageLink'])){
                $imgSource = $_GET['imageLink'];
                $type = pathinfo($imgSource, PATHINFO_EXTENSION);
                $imgData = file_get_contents($imgSource);
                $image = 'data:image/' . $type . ';base64,' . base64_encode($imgData);
                upload_object($objName, $image, $infoArray);
            }else{
                echo "No input source file.";
                die();
            }
        }catch(Exception $e){
            echo "$e";
        }
        return $objName;
    }

    function deleteSource($infoArray){
        $objName = $infoArray['userID'] . "sourceFile.jpg";
        delete_object($objName, $infoArray);
    }


    //A function to delete all the uploaded files
    function dumpStoredFiles($objArr, $infoArray){
        deleteSource($infoArray);
        deleteBatchFromGS($objArr, $infoArray);
    }


    //Functions for analyzing a batch of images of people (awake vs sleeping) 
    function batchCAnalysis($objList, $infoArray){
        $client = new ImageClient($infoArray['clarfaiAPI']);
        $scoreArr = Array("totalScore" => 0, "totalSleepScore" => 0, "totalEngageScore" => 0, "avgSleepScore" => 0, "avgEngageScore" => 0, "percentSleepScore" => 0, "percentEngageScore" => 0, "imageData" => "");
        $objLsize = sizeof($objList);
        for ($i=0; $i < $objLsize; $i++) {
            $imgLink = "https://storage.googleapis.com/". $infoArray['bucket'] ."/" . $objList[$i];
            $client->AddImage($imgLink);
            $result = $client->Predict($infoArray['clarfaiModelName']);
            $arrResult = (array)((array)(((array)json_decode($result))['outputs'])[0]);
            $arr2 = (array)(((array)$arrResult['data'])['concepts']);
            if(strcmp(((array)$arr2[0])['id'],"sleeping")){
                $engageScore = ((array)$arr2[0])['value'];
                $sleepyScore = ((array)$arr2[1])['value'];
            }else{
                $sleepyScore = ((array)$arr2[0])['value'];
                $engageScore = ((array)$arr2[1])['value'];
            }           
            $scoreArr["totalScore"] += ($sleepyScore+$engageScore);
            $scoreArr["totalSleepScore"] += $sleepyScore;
            $scoreArr["totalEngageScore"] += $engageScore;
        }
        $scoreArr["avgSleepScore"] = ($scoreArr["totalSleepScore"]/$objLsize)*100;
        $scoreArr["avgEngageScore"] = ($scoreArr["totalEngageScore"]/$objLsize)*100;
        $scoreArr["percentSleepScore"] = ($scoreArr["totalSleepScore"]/$scoreArr["totalScore"])*100;
        $scoreArr["percentEngageScore"] = ($scoreArr["totalEngageScore"]/$scoreArr["totalScore"])*100;        
        return $scoreArr;
    }


    //A functions that takes in an image and the face vertices and draw rectangles on the image based on the vertices
    function drawFaces($image, $vertices){
        $img = imagecreatefromjpeg($image);
        $colour = imagecolorallocate($img,0,255,0);
        imagesetthickness($img, 2.5);
        for($i=0; $i<sizeof($vertices); $i++){
            $tempValx1 = $vertices[$i]["vertices"][0]["x"];
            $tempValy1 = $vertices[$i]["vertices"][0]["y"];
            $tempValx2 = $vertices[$i]["vertices"][1]["x"];
            $tempValy2 = $vertices[$i]["vertices"][1]["y"];
            $tempValx3 = $vertices[$i]["vertices"][2]["x"];
            $tempValy3 = $vertices[$i]["vertices"][2]["y"];
            $tempValx4 = $vertices[$i]["vertices"][3]["x"];
            $tempValy4 = $vertices[$i]["vertices"][3]["y"];
            ImageLine($img, $tempValx1, $tempValy1, $tempValx2, $tempValy2, $colour);
            ImageLine($img, $tempValx2, $tempValy2, $tempValx3, $tempValy3, $colour);
            ImageLine($img, $tempValx1, $tempValy1, $tempValx4, $tempValy4, $colour);
            ImageLine($img, $tempValx3, $tempValy3, $tempValx4, $tempValy4, $colour);
        }
        ob_start(); 
        imagejpeg($img); 
        $imgData = ob_get_contents(); 
        ob_end_clean(); 
        return 'data:image/jpeg;base64,' . base64_encode($imgData);
    }


    //A function that complies all the action in the correct sequence
    function finalAPI($infoArray){
        try{
            $sourceName = uploadSource($infoArray);
            $infoArray['imagePath'] = 'https://storage.googleapis.com/'. $infoArray['bucket'] .'/' . $sourceName;
            $vertexJson = detect_face($infoArray);
            $imageNameArray = uploadBatchToGS(getCroppedImage($vertexJson, $infoArray['imagePath']), $infoArray);
            $finalAnalysis = batchCAnalysis($imageNameArray, $infoArray);
            $imageDataB64 = drawFaces($infoArray['imagePath'], $vertexJson);
            $finalAnalysis['imageData'] = $imageDataB64;
            dumpStoredFiles($imageNameArray, $infoArray);
            return $finalAnalysis;
        }catch(Exception $e){
            echo $e;
            return "Error";
        }
    }


    //The initiating part of the php
    $result = finalAPI($infoArray);
    //$timee = microtime(true) - $start;
    //echo($timee);
    echo json_encode($result);
?>
<html>
<head>
    <title>Engagement Score Analysis API</title>
    <!--<img src="<?php //echo $result['imageData'];?>">-->
</head>
</html>