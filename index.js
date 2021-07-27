"use strict";

var https = require("https");
var fs = require("fs");
var download = require("image-downloader");
// Replace the subscriptionKey string value with your valid subscription key.
const subscriptionKey = "add your key here";
// Verify the endpoint URI.  At this writing, only one endpoint is used for Bing
// search APIs.  In the future, regional endpoints may be available.  If you
// encounter unexpected authorization errors, double-check this host against
// the endpoint for your Bing Search instance in your Azure dashboard.
const host = "api.bing.microsoft.com";
const path = "/v7.0/images/search";
//filter by license
const filter = "&qft=+filterui:license-L2_L3_L4&FORM=IRFLTR";

var searchAndSaveImages = (search) => {
  console.log("Searching images for: " + search);
  //set global to current search term

  let request_params = {
    method: "GET",
    hostname: host,
    path: path + "?q=" + encodeURIComponent(`${search}`) + filter,
    headers: {
      "Ocp-Apim-Subscription-Key": subscriptionKey,
    },
  };
  var req = https.request(request_params, (response) => {
    console.log("statusCode:", response.statusCode);
    let body = "";
    response.on("data", (d) => {
      body += d;
    });
    response.on("end", () => {
      let imageResults = JSON.parse(body);
      console.log(`Image result count: ${imageResults.value.length}`);
      if (imageResults.value.length > 0) {
        //create directory folder for current search term
        let rootDir = `./images`;
        let searchDir = `${rootDir}/${search}`;
        let testDir = `${searchDir}/test`;
        let trainDir = `${searchDir}/train`;

        if (!fs.existsSync(rootDir)) {
          fs.mkdirSync(rootDir);
        }
        if (!fs.existsSync(searchDir)) {
          fs.mkdirSync(searchDir);
          fs.mkdirSync(testDir);
          fs.mkdirSync(trainDir);
        }
        //create count so we can split the results between test and train folder
        let count = 0;

        //save image results
        imageResults.value.forEach((imageResult) => {
          let destDir = count % 3 == 0 ? testDir : trainDir;
          let options = {
            url: imageResult.contentUrl,
            dest: `./${destDir}/${imageResult.imageId}.png`,
          };

          download
            .image(options)
            .then(({ filename, image }) => {
              console.log("File saved to", filename);
            })
            .catch((err) => {
              console.error(err);
            });
          count++;
        });
      } else {
        console.log("Couldn't find image results!");
      }
    });
    response.on("error", function (e) {
      console.log("Error: " + e.message);
    });
  });
  req.end();
};

let main = () => {
  //bird species search term list
  var searchTermList = ["dog", "cat"];
  //loop search terms
  searchTermList.forEach((term) => {
    searchAndSaveImages(term);
  });
};

//check to make sure the subscription key was updated and kick off main func
if (subscriptionKey.length === 32) {
  main();
} else {
  console.log("Invalid Bing Search API subscription key!");
  console.log("Please paste yours into the source code.");
}
