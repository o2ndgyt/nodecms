/*
Then download the latest version of [MaxMind GeoLite2 Country Database](
	https://dev.maxmind.com/geoip/geoip2/geolite2/) 
	and save it somewhere in the way that you application can access it. 
	Make sure you download the database in MaxMind DB format.
*/

"use strict";

var fs = require("fs-extra"),
MMDBReader = require("mmdb-reader"),
ip = require('ip');

module.exports = function (options, accessDenied) {
	
	accessDenied = accessDenied || function (req, res) {
		res.statusCode = 403;
		res.end("Forbidden");
	};
	
	options = options || {};
	verifyOptions(options);
	
	var mmdb = new MMDBReader(options.geolite2);
	
	function verifyOptions() {
		if (!options.geolite2) {
			throw new Error("options.geolite2 is not set");
		}
		
		var geo2 = fs.openSync(options.geolite2, "r");
		fs.close(geo2);
		
		options.allowed = options.allowed || [];
		options.blocked = options.blocked || [];
		options.blockedCountries = options.blockedCountries || [];
		options.allowedCountries = options.allowedCountries || [];
		
		if (options.blockedCountries.length > 0 && options.allowedCountries.length > 0) {
			throw new Error("You have to choose only allowed contries or only blocked countries");
		}
	}
	
	function isBlocked(ip, req, res) {
		req.location = req.location || {};
		req.location.ip=ip;
		req.location.country = {
			data: null,
			isoCode: "*"
		};
				
		//check that IP address is local
		if (ip.indexOf("192.168")>-1 || ip.indexOf("10.")>1 || ip.indexOf("127.")>1)
			return false;

		// 1. Check that IP address is blocked
		if (options.blocked.indexOf(ip) > -1) 
			return true;
		
		
		if (options.allowed.indexOf(ip) > -1) 
			return false;
		

		var blocked = false;
		var query = mmdb.lookup(ip);
		if (options.blockedCountries.length > 0) {
			
			// 2. If user added country to Blocked Countries collection then only those countries 
            // are blocked 
				
			blocked = query !== null && options.blockedCountries.indexOf(query.country.iso_code) > -1;	
		} else if (options.allowedCountries.length > 0) {
			
			// 3. If user added country to Allowed Countries collecction then all countries except allowed
            // are blocked
				
			blocked = query === null || options.allowedCountries.indexOf(query.country.iso_code) === -1;
		}
		
		if (!blocked && query !== null) {
			req.location.country.data = query;
			req.location.country.isoCode = query.country.iso_code;	
		}
		
		return blocked;
	}
	
	return function (req, res, next) {
	
		if (isBlocked( ip.address(), req, res)) {
			accessDenied(req, res);
			return;	
		}
		
		next();
	};
	
};