var cmsmodulupdate = {
  SimpleHtml: function (data) {
    // convert from string to base64
    return Buffer.from(data).toString('base64');
  },
  TodayTime:function(data)
  {
    return "";
  }

};

module.exports = cmsmodulupdate;