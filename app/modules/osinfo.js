var si = require('systeminformation');

async function cpuData() {
    try {
        const data = await si.cpu();
        return data;
    } catch (e) {
        console.log(e);
    }
    return 'error';
}

var osinfo = {
    osname: async function () {
        let r = await cpuData();
        return `manufacturer: ${r.manufacturer}, brand: ${r.brand}, cores: ${r.cores}, speed: ${r.speed} `;
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