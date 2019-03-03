var si = require('systeminformation');

var osinfo = {
    osname: function(){
        return "N/A";
    },
    oscpucount: function () {
        return '';//osdatacpu.count();
    },
    oscpumodel: function () {
        return '';//osdatacpu.model();
    },
    oshostname: function () {
        return '';//osdataos.hostname();
    },
    oshostip: function () {
        return '';//osdataos.ip();
    },
    
};

module.exports = osinfo;