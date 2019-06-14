"use strict";
//-----------------------------------------------------------------------------
//                                     MAIN
//-----------------------------------------------------------------------------
function findLanguage(req) {
  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - VARIABLES
  var languages = [],
  qualities = [],
  acceptLanguages,
  isLangSupported;
  //- - - - - - - - CURL AND CRAWLERS DON'T HAVE ACCEPT-LANGUAGE IN HTTP HEADER
  if (typeof req.headers["accept-language"] === "undefined") {
    return "crawler";
  } else {
    acceptLanguages = req.headers["accept-language"].split(",");
  }
  //- - - - - - - - - - - - - - - - - - - - - - - LANGUAGES AND THEIR QUALITIES
  for (var i = 0; i < acceptLanguages.length; i++) {
    var language = acceptLanguages[i];
    languages.push(language.substring(0, 2));
    var qIndex = language.indexOf("q=");
    if (qIndex !== -1){
      qualities.push(parseFloat(language.substring(qIndex + 2, qIndex + 5)));
    } else {
      qualities.push(1.0);
    }
  }
  //- - - - - - - - - - - - - - - - - - - - - LANGUAGE WITH THE HIGHEST QUALITY
  var maxIndex = indexOfMax(qualities);
  return languages[maxIndex];
}
//-----------------------------------------------------------------------------
//                                     FUNCTIONS
//-----------------------------------------------------------------------------
function indexOfMax(array) {
  var maxIndex = 0,
  max = array[maxIndex];
  for (var i = 0; i < array.length; i++) {
    if (array[i] > max) {
      max = array[i];
      maxIndex = i;
    }
  }
  return maxIndex;
}
//-----------------------------------------------------------------------------
//                                    EXPORTS
//-----------------------------------------------------------------------------
module.exports = findLanguage;
//-----------------------------------------------------------------------------
//                                    END
//-----------------------------------------------------------------------------
