var DD = require("node-dogstatsd").StatsD;

module.exports = function (options) {
	var datadog = options.dogstatsd || new DD();
	var stat = options.stat || "node.express.router";
	var tags = options.tags || [];
	var path = options.path || false;
	var response_code = options.response_code || false;

	return function (req, res, next) {
		if (!req._startTime) {
			req._startTime = new Date();
		}

		var end = res.end;
		res.end = function (chunk, encoding) {
			res.end = end;
			res.end(chunk, encoding);

			var statTags = [
				"route:" + req.route.path,
			].concat(tags);

			if (options.method) {
				statTags.push("method:" + req.method.toLowerCase());
			}

			if (options.protocol && req.protocol) {
				statTags.push("protocol:" + req.protocol);
			}

			if (path !== false) {
				statTags.push("path:" + req.path);
			}

			if (response_code) {
				var responseCodeCategory = Math.floor(res.statusCode / 100) + 'xx';

				statTags.push("response_code:" + res.statusCode);
				statTags.push("response_code_category:" + responseCodeCategory);

				datadog.increment(stat + '.response_code.' + res.statusCode , 1, statTags);
				datadog.increment(stat + '.response_code_category.' + responseCodeCategory, 1, statTags);
				datadog.increment(stat + '.response_code.all' , 1, statTags);
			}

			datadog.histogram(stat + '.response_time', (new Date() - req._startTime), 1, statTags);
		};

		next();
	};
};
