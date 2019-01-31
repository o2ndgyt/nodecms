var osdata = require('node-os-utils');
var osdatacpu = osdata.cpu;
var osdataos = osdata.os;
var osdatadrive = osdata.drive;
var osdatamem = osdata.mem;
var osName = require('os-name');

var osinfo = {
    osname : function() {
      
        return osName();
    },
    oscpucount: function() {
        return osdatacpu.count();
    },
    oscpumodel: function() {
        return osdatacpu.model();
    },
    oshostname: function() {
        return  osdataos.hostname();
    },
    oshostip: function() {
        return osdataos.ip();
    }
  };

  module.exports = osinfo;