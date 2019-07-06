var fs = require('fs-extra'),
glob = require('glob'),
cmsmodulread = require('./modules/cmsmodul.read.js'),
JsonDB=require('node-json-db'),
dbads = new JsonDB("./db/cmsad", true, false),
dbheaders = new JsonDB("./db/cmsheaders", true, false),
dbcontents = new JsonDB("./db/cmscontents", true, false),
dbcontentsad = new JsonDB("./db/cmscontentsad", true, false),
db = new JsonDB("./db/config", true, false),
fileBytes = require('file-bytes'),
prettyBytes = require('pretty-bytes');

const uuidv4 = require('uuid/v4');

var comfunc = {
  B2A: function (data){
    if (data != "")
      return Buffer.from(data, 'base64').toString('ascii');
    return "";
  },
  UrlEngine: function (id,langid)
  {
    dbcontents.reload();
    dbheaders.reload();
    dbads.reload();
    dbcontentsad.reload();

   var strHtml=`UrlEngine BodyID error:${id} lang id:${langid} `;
 
   var result = dbcontents.getData("/").findIndex(item => item.Id === id );
    if (result > -1) {
      var objContent=dbcontents.getData("/"+result);
      // read html
      strHtml = fs.readFileSync("./views/" +objContent.FileLayout + ".edge", 'utf8');
      // read header
      var result = dbheaders.getData("/").findIndex(item => item.Id === objContent.HeadId );
      if (result > -1) {
        var objHeader=dbheaders.getData("/"+result);
        strHtml=strHtml.replace("@!Title",objHeader.Title).replace("@!Desc",objHeader.MetaDesc).replace("@!section('HeaderScript')",comfunc.B2A(objHeader.HeaderScript)).replace("@!section('BodyScript')",comfunc.B2A(objHeader.BodyScript)).replace("@!section('FooterScript')",comfunc.B2A(objHeader.FooterScript));        
      }  
       
      // ads
      var filteredCAd =dbcontentsad.getData("/").filter(function (value) { return value.HeadId === objContent.Id && value.Mode === "A" ; });
      filteredCAd.forEach(function(item){
          // search one ad
          var adHtml="";
          var filterads = dbads.getData("/").filter(function (value) { return value.GroupID === item.GroupID && (value.lang === langid || value.lang === "*"); });
          if (filterads.length>0)
          {
            var adelement=0;
            if (filterads.length>1)
              adelement=Math.floor(Math.random() * filterads.length-1);
            adHtml=comfunc.B2A(filterads[adelement].AdvertJS);
          }
          strHtml=strHtml.replace("@!section('"+item.Section+"')",adHtml);
      });
                
      // moduls
      var filteredCMo = dbcontentsad.getData("/").filter(function (value) { return value.HeadId === objContent.Id && value.Mode === "M" ; });
      filteredCMo.forEach(function(item){
          // call read fn to convert data
          if (item.GroupID != "None")
          {
          var strModul = cmsmodulread[item.GroupID](item.Data);
          strHtml=strHtml.replace("@!section('"+item.Section+"')",strModul);
          }
        });
    }    

   return strHtml;
  },
  SearchTextinFile: function (searchStr, file, caseSensitive) {

    var str = fs.readFileSync(file, 'utf8');

    var searchStrLen = searchStr.length;
    if (searchStrLen == 0) {
      return [];
    }
    var startIndex = 0, index, indices = [];
    if (!caseSensitive) {
      str = str.toLowerCase();
      searchStr = searchStr.toLowerCase();
    }

    while ((index = str.indexOf(searchStr, startIndex)) > -1) {
      indices.push(index);
      startIndex = index + searchStrLen;
    }

    return indices;
  },
  GetSections: function (file, HeadId) {
    var searchintext = "@!section('";
    var data = this.SearchTextinFile(searchintext, file, false);

    var indices = [];
    var str = fs.readFileSync(file, 'utf8');
    if (data.length == 0) { return indices; }

    data.forEach(function (element) {
      var str1 = str.substring(element);
      var str2 = str1.indexOf(')');
      var str3 = str.substring(element + searchintext.length, element + str2 - 1);

      //except head,body,footer js script
      if (str3 != "HeaderScript" && str3 != "BodyScript" && str3 != "FooterScript") {
        var id = uuidv4();
        if (str3.substr(0, 3).toLowerCase() == "ad_")
          indices.push({ "Id": id, "HeadId": HeadId, "Mode": "A", "Section": str3, "GroupID": "None", "Data": "" });
        if (str3.substr(0, 4).toLowerCase() == "mod_")
          indices.push({ "Id": id, "HeadId": HeadId, "Mode": "M", "Section": str3, "GroupID": "None", "Data": "" });
      }
    });

    return indices;

  },
  FileList: function () {
    return glob.sync("./views/*.edge");
  },
  GetDbSize: function (){
    var filesize=[];
    db.reload();
    var configdata = db.getData("/");
    if (configdata.DB==="File")
    {
      filesize.push( {file:"FileDB",size:"max 200MB/file"});  
    filesize.push( {file:"AD", size:prettyBytes(fileBytes.sync('./db/cmsad.json')) });
    filesize.push( {file:"Content" ,size:prettyBytes(fileBytes.sync('./db/cmscontents.json'))});
    filesize.push( {file:"Content Ads",size:prettyBytes(fileBytes.sync('./db/cmscontentsad.json'))});
    filesize.push( {file:"Headers",size: prettyBytes(fileBytes.sync('./db/cmsheaders.json'))});
    filesize.push( {file:"Urls",size: prettyBytes(fileBytes.sync('./db/cmsurls.json'))});
    }
    else
    {
      filesize.push( {file:"MongoDB",size:"Unlimited"});       
    }
    return filesize;
  },
  CountriesList: function (){
    var countries=[ 
      {name: 'Afghanistan', code: 'AF'}, 
      {name: 'Åland Islands', code: 'AX'}, 
      {name: 'Albania', code: 'AL'}, 
      {name: 'Algeria', code: 'DZ'}, 
      {name: 'American Samoa', code: 'AS'}, 
      {name: 'AndorrA', code: 'AD'}, 
      {name: 'Angola', code: 'AO'}, 
      {name: 'Anguilla', code: 'AI'}, 
      {name: 'Antarctica', code: 'AQ'}, 
      {name: 'Antigua and Barbuda', code: 'AG'}, 
      {name: 'Argentina', code: 'AR'}, 
      {name: 'Armenia', code: 'AM'}, 
      {name: 'Aruba', code: 'AW'}, 
      {name: 'Australia', code: 'AU'}, 
      {name: 'Austria', code: 'AT'}, 
      {name: 'Azerbaijan', code: 'AZ'}, 
      {name: 'Bahamas', code: 'BS'}, 
      {name: 'Bahrain', code: 'BH'}, 
      {name: 'Bangladesh', code: 'BD'}, 
      {name: 'Barbados', code: 'BB'}, 
      {name: 'Belarus', code: 'BY'}, 
      {name: 'Belgium', code: 'BE'}, 
      {name: 'Belize', code: 'BZ'}, 
      {name: 'Benin', code: 'BJ'}, 
      {name: 'Bermuda', code: 'BM'}, 
      {name: 'Bhutan', code: 'BT'}, 
      {name: 'Bolivia', code: 'BO'}, 
      {name: 'Bosnia and Herzegovina', code: 'BA'}, 
      {name: 'Botswana', code: 'BW'}, 
      {name: 'Bouvet Island', code: 'BV'}, 
      {name: 'Brazil', code: 'BR'}, 
      {name: 'British Indian Ocean Territory', code: 'IO'}, 
      {name: 'Brunei Darussalam', code: 'BN'}, 
      {name: 'Bulgaria', code: 'BG'}, 
      {name: 'Burkina Faso', code: 'BF'}, 
      {name: 'Burundi', code: 'BI'}, 
      {name: 'Cambodia', code: 'KH'}, 
      {name: 'Cameroon', code: 'CM'}, 
      {name: 'Canada', code: 'CA'}, 
      {name: 'Cape Verde', code: 'CV'}, 
      {name: 'Cayman Islands', code: 'KY'}, 
      {name: 'Central African Republic', code: 'CF'}, 
      {name: 'Chad', code: 'TD'}, 
      {name: 'Chile', code: 'CL'}, 
      {name: 'China', code: 'CN'}, 
      {name: 'Christmas Island', code: 'CX'}, 
      {name: 'Cocos (Keeling) Islands', code: 'CC'}, 
      {name: 'Colombia', code: 'CO'}, 
      {name: 'Comoros', code: 'KM'}, 
      {name: 'Congo', code: 'CG'}, 
      {name: 'Congo, The Democratic Republic of the', code: 'CD'}, 
      {name: 'Cook Islands', code: 'CK'}, 
      {name: 'Costa Rica', code: 'CR'}, 
      {name: 'Cote D\'Ivoire', code: 'CI'}, 
      {name: 'Croatia', code: 'HR'}, 
      {name: 'Cuba', code: 'CU'}, 
      {name: 'Cyprus', code: 'CY'}, 
      {name: 'Czech Republic', code: 'CZ'}, 
      {name: 'Denmark', code: 'DK'}, 
      {name: 'Djibouti', code: 'DJ'}, 
      {name: 'Dominica', code: 'DM'}, 
      {name: 'Dominican Republic', code: 'DO'}, 
      {name: 'Ecuador', code: 'EC'}, 
      {name: 'Egypt', code: 'EG'}, 
      {name: 'El Salvador', code: 'SV'}, 
      {name: 'Equatorial Guinea', code: 'GQ'}, 
      {name: 'Eritrea', code: 'ER'}, 
      {name: 'Estonia', code: 'EE'}, 
      {name: 'Ethiopia', code: 'ET'}, 
      {name: 'Falkland Islands (Malvinas)', code: 'FK'}, 
      {name: 'Faroe Islands', code: 'FO'}, 
      {name: 'Fiji', code: 'FJ'}, 
      {name: 'Finland', code: 'FI'}, 
      {name: 'France', code: 'FR'}, 
      {name: 'French Guiana', code: 'GF'}, 
      {name: 'French Polynesia', code: 'PF'}, 
      {name: 'French Southern Territories', code: 'TF'}, 
      {name: 'Gabon', code: 'GA'}, 
      {name: 'Gambia', code: 'GM'}, 
      {name: 'Georgia', code: 'GE'}, 
      {name: 'Germany', code: 'DE'}, 
      {name: 'Ghana', code: 'GH'}, 
      {name: 'Gibraltar', code: 'GI'}, 
      {name: 'Greece', code: 'GR'}, 
      {name: 'Greenland', code: 'GL'}, 
      {name: 'Grenada', code: 'GD'}, 
      {name: 'Guadeloupe', code: 'GP'}, 
      {name: 'Guam', code: 'GU'}, 
      {name: 'Guatemala', code: 'GT'}, 
      {name: 'Guernsey', code: 'GG'}, 
      {name: 'Guinea', code: 'GN'}, 
      {name: 'Guinea-Bissau', code: 'GW'}, 
      {name: 'Guyana', code: 'GY'}, 
      {name: 'Haiti', code: 'HT'}, 
      {name: 'Heard Island and Mcdonald Islands', code: 'HM'}, 
      {name: 'Holy See (Vatican City State)', code: 'VA'}, 
      {name: 'Honduras', code: 'HN'}, 
      {name: 'Hong Kong', code: 'HK'}, 
      {name: 'Hungary', code: 'HU'}, 
      {name: 'Iceland', code: 'IS'}, 
      {name: 'India', code: 'IN'}, 
      {name: 'Indonesia', code: 'ID'}, 
      {name: 'Iran, Islamic Republic Of', code: 'IR'}, 
      {name: 'Iraq', code: 'IQ'}, 
      {name: 'Ireland', code: 'IE'}, 
      {name: 'Isle of Man', code: 'IM'}, 
      {name: 'Israel', code: 'IL'}, 
      {name: 'Italy', code: 'IT'}, 
      {name: 'Jamaica', code: 'JM'}, 
      {name: 'Japan', code: 'JP'}, 
      {name: 'Jersey', code: 'JE'}, 
      {name: 'Jordan', code: 'JO'}, 
      {name: 'Kazakhstan', code: 'KZ'}, 
      {name: 'Kenya', code: 'KE'}, 
      {name: 'Kiribati', code: 'KI'}, 
      {name: 'Korea, Democratic People\'S Republic of', code: 'KP'}, 
      {name: 'Korea, Republic of', code: 'KR'}, 
      {name: 'Kuwait', code: 'KW'}, 
      {name: 'Kyrgyzstan', code: 'KG'}, 
      {name: 'Lao People\'S Democratic Republic', code: 'LA'}, 
      {name: 'Latvia', code: 'LV'}, 
      {name: 'Lebanon', code: 'LB'}, 
      {name: 'Lesotho', code: 'LS'}, 
      {name: 'Liberia', code: 'LR'}, 
      {name: 'Libyan Arab Jamahiriya', code: 'LY'}, 
      {name: 'Liechtenstein', code: 'LI'}, 
      {name: 'Lithuania', code: 'LT'}, 
      {name: 'Luxembourg', code: 'LU'}, 
      {name: 'Macao', code: 'MO'}, 
      {name: 'Macedonia, The Former Yugoslav Republic of', code: 'MK'}, 
      {name: 'Madagascar', code: 'MG'}, 
      {name: 'Malawi', code: 'MW'}, 
      {name: 'Malaysia', code: 'MY'}, 
      {name: 'Maldives', code: 'MV'}, 
      {name: 'Mali', code: 'ML'}, 
      {name: 'Malta', code: 'MT'}, 
      {name: 'Marshall Islands', code: 'MH'}, 
      {name: 'Martinique', code: 'MQ'}, 
      {name: 'Mauritania', code: 'MR'}, 
      {name: 'Mauritius', code: 'MU'}, 
      {name: 'Mayotte', code: 'YT'}, 
      {name: 'Mexico', code: 'MX'}, 
      {name: 'Micronesia, Federated States of', code: 'FM'}, 
      {name: 'Moldova, Republic of', code: 'MD'}, 
      {name: 'Monaco', code: 'MC'}, 
      {name: 'Mongolia', code: 'MN'}, 
      {name: 'Montserrat', code: 'MS'}, 
      {name: 'Morocco', code: 'MA'}, 
      {name: 'Mozambique', code: 'MZ'}, 
      {name: 'Myanmar', code: 'MM'}, 
      {name: 'Namibia', code: 'NA'}, 
      {name: 'Nauru', code: 'NR'}, 
      {name: 'Nepal', code: 'NP'}, 
      {name: 'Netherlands', code: 'NL'}, 
      {name: 'Netherlands Antilles', code: 'AN'}, 
      {name: 'New Caledonia', code: 'NC'}, 
      {name: 'New Zealand', code: 'NZ'}, 
      {name: 'Nicaragua', code: 'NI'}, 
      {name: 'Niger', code: 'NE'}, 
      {name: 'Nigeria', code: 'NG'}, 
      {name: 'Niue', code: 'NU'}, 
      {name: 'Norfolk Island', code: 'NF'}, 
      {name: 'Northern Mariana Islands', code: 'MP'}, 
      {name: 'Norway', code: 'NO'}, 
      {name: 'Oman', code: 'OM'}, 
      {name: 'Pakistan', code: 'PK'}, 
      {name: 'Palau', code: 'PW'}, 
      {name: 'Palestinian Territory, Occupied', code: 'PS'}, 
      {name: 'Panama', code: 'PA'}, 
      {name: 'Papua New Guinea', code: 'PG'}, 
      {name: 'Paraguay', code: 'PY'}, 
      {name: 'Peru', code: 'PE'}, 
      {name: 'Philippines', code: 'PH'}, 
      {name: 'Pitcairn', code: 'PN'}, 
      {name: 'Poland', code: 'PL'}, 
      {name: 'Portugal', code: 'PT'}, 
      {name: 'Puerto Rico', code: 'PR'}, 
      {name: 'Qatar', code: 'QA'}, 
      {name: 'Reunion', code: 'RE'}, 
      {name: 'Romania', code: 'RO'}, 
      {name: 'Russian Federation', code: 'RU'}, 
      {name: 'RWANDA', code: 'RW'}, 
      {name: 'Saint Helena', code: 'SH'}, 
      {name: 'Saint Kitts and Nevis', code: 'KN'}, 
      {name: 'Saint Lucia', code: 'LC'}, 
      {name: 'Saint Pierre and Miquelon', code: 'PM'}, 
      {name: 'Saint Vincent and the Grenadines', code: 'VC'}, 
      {name: 'Samoa', code: 'WS'}, 
      {name: 'San Marino', code: 'SM'}, 
      {name: 'Sao Tome and Principe', code: 'ST'}, 
      {name: 'Saudi Arabia', code: 'SA'}, 
      {name: 'Senegal', code: 'SN'}, 
      {name: 'Serbia and Montenegro', code: 'CS'}, 
      {name: 'Seychelles', code: 'SC'}, 
      {name: 'Sierra Leone', code: 'SL'}, 
      {name: 'Singapore', code: 'SG'}, 
      {name: 'Slovakia', code: 'SK'}, 
      {name: 'Slovenia', code: 'SI'}, 
      {name: 'Solomon Islands', code: 'SB'}, 
      {name: 'Somalia', code: 'SO'}, 
      {name: 'South Africa', code: 'ZA'}, 
      {name: 'South Georgia and the South Sandwich Islands', code: 'GS'}, 
      {name: 'Spain', code: 'ES'}, 
      {name: 'Sri Lanka', code: 'LK'}, 
      {name: 'Sudan', code: 'SD'}, 
      {name: 'Suriname', code: 'SR'}, 
      {name: 'Svalbard and Jan Mayen', code: 'SJ'}, 
      {name: 'Swaziland', code: 'SZ'}, 
      {name: 'Sweden', code: 'SE'}, 
      {name: 'Switzerland', code: 'CH'}, 
      {name: 'Syrian Arab Republic', code: 'SY'}, 
      {name: 'Taiwan, Province of China', code: 'TW'}, 
      {name: 'Tajikistan', code: 'TJ'}, 
      {name: 'Tanzania, United Republic of', code: 'TZ'}, 
      {name: 'Thailand', code: 'TH'}, 
      {name: 'Timor-Leste', code: 'TL'}, 
      {name: 'Togo', code: 'TG'}, 
      {name: 'Tokelau', code: 'TK'}, 
      {name: 'Tonga', code: 'TO'}, 
      {name: 'Trinidad and Tobago', code: 'TT'}, 
      {name: 'Tunisia', code: 'TN'}, 
      {name: 'Turkey', code: 'TR'}, 
      {name: 'Turkmenistan', code: 'TM'}, 
      {name: 'Turks and Caicos Islands', code: 'TC'}, 
      {name: 'Tuvalu', code: 'TV'}, 
      {name: 'Uganda', code: 'UG'}, 
      {name: 'Ukraine', code: 'UA'}, 
      {name: 'United Arab Emirates', code: 'AE'}, 
      {name: 'United Kingdom', code: 'GB'}, 
      {name: 'United States', code: 'US'}, 
      {name: 'United States Minor Outlying Islands', code: 'UM'}, 
      {name: 'Uruguay', code: 'UY'}, 
      {name: 'Uzbekistan', code: 'UZ'}, 
      {name: 'Vanuatu', code: 'VU'}, 
      {name: 'Venezuela', code: 'VE'}, 
      {name: 'Viet Nam', code: 'VN'}, 
      {name: 'Virgin Islands, British', code: 'VG'}, 
      {name: 'Virgin Islands, U.S.', code: 'VI'}, 
      {name: 'Wallis and Futuna', code: 'WF'}, 
      {name: 'Western Sahara', code: 'EH'}, 
      {name: 'Yemen', code: 'YE'}, 
      {name: 'Zambia', code: 'ZM'}, 
      {name: 'Zimbabwe', code: 'ZW'} 
    ]
    return countries;

  }
};

module.exports = comfunc;