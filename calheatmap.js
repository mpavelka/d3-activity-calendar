/**
 * Simplified version of the jQuery $.extend
 */
function extend(){
	for(var i=1; i<arguments.length; i++)
		for(var key in arguments[i])
			if(arguments[i].hasOwnProperty(key))
				arguments[0][key] = arguments[i][key];
	return arguments[0];
}


/* CalHeatMap
 * 
 * @param options CalHeatMap options
 *
 * */
var CalHeatMap = function(options) {
	this._init(options);
	this.buckets = [];

	this.offset = Math.round(this.options.date_min / this.options.interval);

	this.value_min = this.options.value_min;
	this.value_max = this.options.value_max;

	this.bucket_min = 0;
	this.bucket_max = 0;
};

/* Init calendar from options
 * 
 * @param options Calendar options
 *
 * */
CalHeatMap.prototype._init = function(options) {
	// Options
	this.options = extend({}, {
		date_min: null,
		date_max: null,
		interval: 1000,
		value_min: 0,
		value_max: 0,
		margin_x: 1,
		margin_y: 0,
		color_range: ["#f7fbff", "#08306b"],
		//color_range: ["#ffffff", "#f6fafd", "#edf6fc", "#e3f0fa", "#daebf8", "#d1e7f6", "#c8e2f5", "#bfdef3", "#b6d9f2", "#a4c9e4", "#8fb5d2", "#7aa1bf", "#658dad", "#4f799b", "#3a6488", "#244f75", "#0f3b63", "#012d56", "#012b52", "#01294d", "#002649", "#002444", "#002140", "#00203d", "#001d38"],
		//color_range: ["#00007f","#0000a3","#0000c8","#0000ec","#0004ff","#0024ff","#0044ff","#0064ff","#0088ff","#00a8ff","#00c8ff","#02e8f4","#1fffd7","#39ffbd","#53ffa3","#6cff89","#89ff6c","#a3ff53","#bdff39","#d7ff1f","#f4f802","#ffda00","#ffbd00","#ff9f00","#ff7e00","#ff6000","#ff4200","#ff2500","#ec0300","#c80000","#a30000","#7f0000", "#FF0000"],
		// Blues: color_range: ["#f7fbff","#f0f6fc","#eaf2fa","#e4eef8","#ddeaf6","#d7e6f4","#d1e2f2","#cbdef0","#c3d9ee","#b9d5ea","#afd1e6","#a5cde3","#98c7df","#8bc0dd","#7fb8da","#72b1d7","#65aad3","#5aa3cf","#509bcb","#4694c7","#3c8cc3","#3383be","#2b7bba","#2373b6","#1b6aaf","#1562a9","#0f5aa3","#08529c","#08488f","#084083","#083877","#08306b", "#FF0000"],
		//color_range: ["#fff5f0","#feefe8","#feeae0","#fee5d9","#fdded0","#fdd5c3","#fcccb7","#fcc2ab","#fcb89d","#fcad91","#fca386","#fc997a","#fb8d6d","#fb8363","#fb7959","#fb6f4f","#f96345","#f6573e","#f34b36","#f03f2f","#e83429","#df2c25","#d62321","#cd1a1e","#c2161b","#b91319","#af1117","#a60f15","#950b13","#860711","#76030f","#67000c"],
	}, options);
}


CalHeatMap.prototype.load = function(data_series, dateMapper, valueMapper) {
	if (dateMapper == undefined) dateMapper = function(obj) { return new Date(obj.key); };
	if (valueMapper == undefined) valueMapper = function(obj) { return obj; };

	m = {};

	for (i in data_series) {
		obj = data_series[i];
		d = dateMapper(obj);
		v = valueMapper(obj);
		k = d.getTime();
		b = Math.round((k / this.options.interval) - this.offset);

		if (d <= this.options.date_min) continue;
		if (d >= this.options.date_max) continue;

		if (b in m)
		{
			v += m[b].v;
		}
		m[b] = {
			'b': parseInt(b),
			'v': v,
			'd': d
		};

		if (b < this.bucket_min) this.bucket_min = b;
		if (b > this.bucket_max) this.bucket_max = b;

		if (v < this.value_min) this.value_min = v;
		if (v > this.value_max) this.value_max = v;
	}

	for (b in m) {
		if (m[b].v == 0) continue; // Filter all zero buckets
		this.buckets.push(m[b]);
	}
}

CalHeatMap.prototype.render_days = function(wrapper, day_width, interval_height) {

	var options = this.options;

	// X Axis

	var x_days = Math.ceil((this.options.date_max - this.options.date_min)/(1000*60*60*24));
	var x = d3.scaleTime()
		.range([0, x_days * (day_width + this.options.margin_x)])
		.domain([this.options.date_min, this.options.date_max]);

	var xAxis = d3.axisBottom(x).ticks(x_days);

	var x_length = (1000*60*60*24) / this.options.interval;


	// Y Axis

	var y = d3.scaleLinear()
		.range([0, (interval_height + this.options.margin_y) * x_length])
		.domain([0, 24]);

	var yAxis = d3.axisRight(y).ticks(24);


	// The color range to be used for the data
	var color_range = d3.scalePow()
		.domain([this.value_min, this.value_max])
		.range(this.options.color_range);


	// Create canvas
	if (this.canvas == undefined)
	{
		this.canvas = d3.select(wrapper)
			.append("svg")
			.attr('class', 'calheatmap')
			.attr("height", (interval_height + this.options.margin_y) * x_length + 50)
			.attr("width", (day_width + this.options.margin_x) * x_days + 50);
	}

	// Append X axis
	this.canvas.append('g')
		.attr('class', 'xaxis')
		.attr("transform", "translate(0," + ((interval_height + this.options.margin_y) * x_length - this.options.margin_y)+ ")")
		.call(xAxis);

	// Rotate X axis text
	this.canvas.selectAll(".xaxis text")
		.attr("transform", function(d) {
			return "translate(0, 20) rotate(-90)";
		});

	// Append Y axis
	this.canvas.append('g')
		.attr('class', 'yaxis')
		.attr("transform", "translate(" + ((day_width + this.options.margin_x) * x_days - this.options.margin_x) + ",0)")
		.call(yAxis);


	var gdata = this.canvas.append('g').classed('data', true);
	var bucket = gdata.selectAll(".bucket")
		.data(this.buckets)

	var bucket_rects = bucket.enter();
	bucket_rects.append("rect")
		.attr("x", function(val, index) {
			return (day_width + options.margin_x) * Math.floor(val.b / x_length);
		})
		.attr("y", function(val, index) {
			return (interval_height + options.margin_y) * (val.b % x_length);
		})
		.attr("width", day_width)
		.attr("height", interval_height)
		.style("fill", function(val, index) {
			return color_range(val.v);
		})
		.insert("title",":first-child").html(function(val) {  return val.v + " @ " + val.d; });

}
