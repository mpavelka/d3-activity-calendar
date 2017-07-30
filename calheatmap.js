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
		//color_range: ["#f7fbff", "#08306b"], // Blue
		//color_range: ["#fff5f0", "#67000c"], // Red
		color_range: ["#fff5f0", "#00670c"], // Red
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
	var x = d3.scaleUtc()
		.range([0, (day_width + this.options.margin_x) * x_days])
		.domain([this.options.date_min, this.options.date_max-1]);
		

	var xAxis = d3.axisBottom(x).ticks(x_days).tickFormat(d3.timeFormat("%b %d"));

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
	this.canvas = d3.select(wrapper)
		.append("svg")
		.attr('class', 'calheatmap')
		.attr("height", (interval_height + this.options.margin_y) * x_length + 50)
		.attr("width", (day_width + this.options.margin_x) * x_days + 50);

	// Append X axis
	this.canvas.append('g')
		.attr('class', 'xaxis')
		.attr("transform", "translate(0," + ((interval_height + this.options.margin_y) * x_length - this.options.margin_y)+ ")")
		.call(xAxis);

	// Rotate X axis text
	this.canvas.selectAll(".xaxis text")
		.attr("transform", function(d) {
			return "translate(10, 10) rotate(-45)";
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
