var cmsmodulread = {
  None: function (data) {
    return '';
  },
  SimpleHtml: function (data) {
    // convert from base64 to string
    return Buffer.from(data, 'base64').toString('ascii');
  }

};

module.exports = cmsmodulread;