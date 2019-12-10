var moment = require('moment');

var cmsmodulread = {
  SimpleHtml: function (data) {
    // convert from base64 to string
    return Buffer.from(data, 'base64').toString('ascii');
  },
  TodayTime:function(data)
  {
      return moment().format('LL');
  }

};

module.exports = cmsmodulread;