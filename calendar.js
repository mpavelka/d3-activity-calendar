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

/* Calendar
 * 
 * @param options Calendar options
 *
 * */
var Calendar = function(options) {
  this.canvas = {};
  this.data = {};
  this._init(options);
}


/* Time format used in data hash table
* */
Calendar.timeFormat = "%Y-%m-%d %H:%M:%S.%L"

/* Data granularity enum
 * 
 * */
Calendar.gran = {
  MILLISECOND: 0,
  SECOND: 1,
  MINUTE: 2,
  HOUR: 3,
  DAY: 4,
  MONTH: 5,
  YEAR: 6
}


/* Granularity to milliseconds lookup
 * 
 * */
Calendar.granMilliseconds = [
  1,
  1000, // Calendar.gran.SECOND
  1000*60,// Calendar.gran.MINUTE
  1000*60*60,// Calendar.gran.HOUR
  1000*60*60*24,// Calendar.gran.DAY
  1000*60*60*24*30, // Calendar.gran.MONTH
  1000*60*60*24*30*12, // Calendar.gran.YEAR
]


/* Returns a unit (second, minute, ...) from the given date
 * based on the granularity
 * 
 * @param date Date()
 * @param gran Granularity
 *
 * */
Calendar.prototype.getDateUnit = function(date, gran) {
  if (gran == Calendar.gran.MILLISECOND)
    return date.getMilliseconds();
  if (gran == Calendar.gran.SECOND)
    return date.getSeconds();
  else if (gran == Calendar.gran.MINUTE)
    return date.getMinutes();
  else if (gran == Calendar.gran.HOUR)
    return date.getHours();
  else if (gran == Calendar.gran.DAY)
    return date.getDate();
  else if (gran == Calendar.gran.MONTH)
    return date.getMonth();
  else if (gran == Calendar.gran.YEAR)
    return date.getYear();
  else throw 'Unknown granularity ' + gran;
}


/* Returns a D3 time range based on the given granularity
 * 
 * @param minDate lower time limit
 * @param maxDate upper time limit
 * @param gran Granularity
 *
 * */
Calendar.prototype.getDateRange = function(minDate, maxDate, gran) {
  if (gran == Calendar.gran.MILLISECOND)
    return d3.timeMilliseconds(minDate, maxDate);
  if (gran == Calendar.gran.SECOND)
    return d3.timeSeconds(minDate, maxDate);
  else if (gran == Calendar.gran.MINUTE)
    return d3.timeMinutes(minDate, maxDate);
  else if (gran == Calendar.gran.HOUR)
    return d3.timeHours(minDate, maxDate);
  else if (gran == Calendar.gran.DAY)
    return d3.timeDays(minDate, maxDate);
  else if (gran == Calendar.gran.MONTH)
    return d3.timeMonths(minDate, maxDate);
  else if (gran == Calendar.gran.YEAR)
    return d3.timeYears(minDate, maxDate);
  else throw 'Unknown granularity ' + gran;
}


/* Init calendar from options
 * 
 * @param options Calendar options
 *
 * */
Calendar.prototype._init = function(options) {
  // Options
  this.options = extend({}, {
    wrapper:    'body',
    width:      800,
    height:     400,
    responsive: false,
    minDate:    null,
    maxDate:    null,
    xAxis : {
      gran: Calendar.gran.DAY,
      show: true,
    },
    yAxis : {
      gran: Calendar.gran.HOUR, // Must be less than or equal to granX
      flip: false,
      show: true,
    },
    colorRange: ["#ffffff", "#f6fafd", "#edf6fc", "#e3f0fa", "#daebf8", "#d1e7f6", "#c8e2f5", "#bfdef3", "#b6d9f2", "#a4c9e4", "#8fb5d2", "#7aa1bf", "#658dad", "#4f799b", "#3a6488", "#244f75", "#0f3b63", "#012d56", "#012b52", "#01294d", "#002649", "#002444", "#002140", "#00203d", "#001d38"],
  }, options);

  if (this.options.yAxis.gran > this.options.xAxis.gran)
    throw 'Option granY must be less than or equal to granX.';

  // Default maxDate is today night
  if (this.options.maxDate === null) {
    this.options.maxDate = new Date();
    this.options.maxDate.setHours(23);
    this.options.maxDate.setMinutes(59);
  }
 
  // default minDate to today - 1 month
  if (this.options.minDate === null) {
    var d = new Date();
    this.options.minDate = new Date(d.getTime() - (30 * 24 * 60 * 60 * 1000));
  }
}

/* Transforms InfluxDB result to Calendar data
 *
 * @param results array of result objects
 * @param dateMapper function to be used to find a date in an object within the results
 * @param valueMapper function to be used to find the value in an object within the results
 *
 * */
Calendar.prototype.setDataFromResults = function(results, dateMapper, valueMapper) {

  var data   = {},
      minVal = null,
      maxVal = null,
      formatter = d3.timeFormat("%Y-%m-%d %H:%M:%S.%L");

  if (dateMapper == undefined)
    dateMapper = function(obj) {
      return new Date(obj.key);
    }

  if (valueMapper == undefined)
    valueMapper = function(obj) {
      return obj.doc_count;
    }
  
  for (r in results) {
    var key,
        lowerDate,
        date = dateMapper(results[r]);
        val  = valueMapper(results[r]);

    // Find the lowest date from a time interval where the date belongs to (based on granularity)
    lowerDate = this.floorDate(date, this.options.yAxis.gran)

    // Store minimum value
    if (minVal == null || minVal > val)
      minVal = val;

    // Store maximum value
    if (maxVal == null || maxVal < val)
      maxVal = val;

    // Store data
    key = formatter(lowerDate);
    if (data[key] == undefined)
      data[key] = 0;
    data[key] += val;
  }

  this.data = data;
  this.minVal = minVal;
  this.maxVal = maxVal;

  return data;
  // return {
  //   '2017-03-20 19:00:00.000' : 3,
  //   '2017-03-21 12:00:00.000' : 2,
  //   '2017-03-14 08:00:00.000' : 20,
  //   '2017-03-02 12:00:00.000' : 12,
  //   '2017-03-11 16:00:00.000' : 89,
  // }
}

/* Returns a date object that represents a start of a date interval
 * based on the desired granularity
 * 
 * e. g.: calendar
 *
 * @date a date object
 * @param granularity a value from Calendar.gran
 * @return Date
 * */
Calendar.prototype.floorDate = function(date, granularity) {
  var retDate = new Date(date.getTime());
  retDate.setMilliseconds(0);
  if (granularity >= Calendar.gran.MINUTE)
    retDate.setSeconds(0);
  if (granularity >= Calendar.gran.HOUR)
    retDate.setMinutes(0);
  if (granularity >= Calendar.gran.DAY)
    retDate.setHours(0);
  if (granularity >= Calendar.gran.MONTH)
    retDate.setDate(1);
  return retDate;
}

/* Returns the number of the column (starting with 0) that represents data of the given date
 * The value is based on options.granX, options.minDate and options.maxDate
 *
 * @param date a Date object
 * */
Calendar.prototype.getCol = function(date) {
  var granX      = this.options.xAxis.gran;
  var flrDate    = this.floorDate(date, granX);
  var flrMinDate = this.floorDate(this.options.minDate, granX);

  return Math.floor(Math.abs(flrDate - flrMinDate) / Calendar.granMilliseconds[granX]);
}

/* Returns the number of the row (starting with 0) that represents data of the given date
 * The value is based on options.granY, options.minDate and options.maxDate
 *
 * @param date a Date object
 * */
Calendar.prototype.getRow = function(date) {
  var granY  = this.options.yAxis.gran,
      granX  = this.options.xAxis.gran;
  var floor0 = this.floorDate(date, granX),
      floorN = this.floorDate(date, granY);
  var delta  = floorN - floor0;

  return delta / Calendar.granMilliseconds[granY];
}

/* Returns the index of the rect that holds data for the specified date
 *
 * @param date a Date object
 * */
Calendar.prototype.getRectIndex = function(date) {
  return this.getColumn(date)*this.getRowsCount()+this.getRow(date);
}


/* Returns the columns count based on options (minDate, maxDate, granX) 
 *
 * */
Calendar.prototype.getColumnsCount = function() {
  // var tomorrow = new Date(this.options.maxDate.getTime() + 87400000);
  var flrMinDate = this.floorDate(this.options.minDate, this.options.xAxis.gran);
  var flrMaxDate = this.floorDate(this.options.maxDate, this.options.xAxis.gran);
  return Math.ceil(Math.abs(flrMaxDate - flrMinDate) / Calendar.granMilliseconds[this.options.xAxis.gran]);
}


/* Returns the rows count based on the Y axis granularity (granY)
 *
 * */
Calendar.prototype.getRowsCount = function() {
  return Calendar.granMilliseconds[this.options.xAxis.gran] / Calendar.granMilliseconds[this.options.yAxis.gran];
}


/* Returns and array of columns names based on the options 
 *
 * */
Calendar.prototype.getColNames = function() {
  var ret = [];
  var gran = this.options.xAxis.gran;

  var flrMinDate = this.floorDate(this.options.minDate, gran);
  var colsCount = this.getColumnsCount();

  for (var i=0, time=flrMinDate.getTime(); i<colsCount; i++) {
    var date = new Date(time);
    name = this.getDateUnit(date, gran);
    ret.push(name);
    time = time + Calendar.granMilliseconds[gran]
  }

  return ret;

}

/* Returns an array of row names based on the granularity in options
 *
 * */
Calendar.prototype.getRowNames = function() {
  var ret = [];
  var rowsCount = this.getRowsCount();

  for (var i=0;i<rowsCount; i++) {
    // A range of granularity greater than or equal to DAY must not start with 0
    ret.push( i + (this.options.yAxis.gran >= Calendar.gran.DAY ? 1 : 0) )
  }

  return ret;
}


/* Renders X Axis
 *
 * */
Calendar.prototype.renderXAxis = function(elem, graphWidth, fontSize) {
  var cellWidth  = graphWidth / this.getColumnsCount(),
      xAxis      = elem;

  if (fontSize == undefined)
    fontSize = 12;

  // Render texts on X Axis
  xAxis.selectAll('text')
      .data(this.getColNames())
      .enter().append('text')
        .attr('transform', function(val, index) {
          return 'translate('+(index*cellWidth)+', 0)';
        })
        .attr('font-size', fontSize)
        .text(function(val, index, data) { return val; });

}


/* Renders Y Axis
 *
 * */
Calendar.prototype.renderYAxis = function(elem, graphHeight, fontSize) {
  var cellHeight = graphHeight / this.getRowsCount(),
      yAxis      = elem;

  if (fontSize == undefined)
    fontSize = 12;

  // Render texts on Y Axis
  console.log(this.getRowNames());
  var self = this;
  yAxis.selectAll('text')
      .data(this.getRowNames())
      .enter().append('text')
        .attr('transform', function(val, index) {
          if (self.options.yAxis.flip)
            return 'translate(0, '+(graphHeight - (index*cellHeight) - 2)+')';
          else
            return 'translate(0, '+(((index+1)*cellHeight) - 2)+')';
        })
        .attr('font-size', fontSize)
        .text(function(val, index, data) { return val; });
}


/* Renders the rectangles.
 *
 * @param elem the element to render rectangles to
 * @param width width of the graph
 * @param height hight of the graph
 * */
Calendar.prototype.renderRects = function(elem, width, height) {
  var cellWidth  = (width) / this.getColumnsCount(),
      cellHeight = (height) / this.getRowsCount(),
      rowsCount  = this.getRowsCount();
      rect       = elem;

  // Render rectangles
  var self = this;
  rect
    .attr('fill', 'none')
    .attr('stroke', '#eee')
    .attr('stroke-width', '0.05')
    .selectAll('rect')
    .data(function(d) { return self.getDateRange(self.options.minDate, self.options.maxDate, self.options.yAxis.gran); })
    .enter().append('rect')
      .attr("width", cellWidth)
      .attr("height", cellHeight)
      .attr("x", function(val, index) {return self.getCol(val) * cellWidth;})
      .attr("y", function(val, index) {
        if (self.options.yAxis.flip) {
          return height - (self.getRow(val) * cellHeight) - cellHeight;
        }
        else
          return self.getRow(val) * cellHeight;
      })
      .datum(d3.timeFormat(Calendar.timeFormat))
    .exit()

  // The color range to be used for the data
  var color = d3.scaleQuantile()
    .domain([0, this.maxVal])
    .range(this.options.colorRange);

  
  // Fill rectangles with color based on data
  rect.selectAll('rect')
    .filter(function(d) { return d in self.data; })
    .attr("fill", function(d, a) { return color(self.data[d]); })

  return rect;

}

/* Renders the calendar
 *
 * */
Calendar.prototype.render = function() {

  var yAxisWidth    = (this.options.yAxis.show ? 30 : 0),
      xAxisHeight   = (this.options.xAxis.show ? 15 : 0),
      yAxisFontSize = 12;

  var graphWidth  = this.options.width-yAxisWidth,
      graphHeight = this.options.height-xAxisHeight;

  // Init canvas if needed
  if (this.canvas.svg == undefined)
    this.canvas.svg = d3.select(this.options.wrapper)
            .append("svg")
              .attr("width", this.options.width)
              .attr("height", this.options.height)
              .append('g').classed('svg', true);


  // Init rect if needed
  if (this.canvas.rect == undefined)
    this.canvas.rect = this.canvas.svg
                           .append('g').classed('rect', true);
  // Render rect
  this.canvas.rect.attr('transform', 'translate('+yAxisWidth+', 0)');
  this.renderRects(this.canvas.rect, graphWidth, graphHeight);


  var axesFontSize = (graphHeight / this.getRowsCount()) - 2;

  // Init X axis if needed
  if (this.canvas.xAxis == undefined)
    this.canvas.xAxis = this.canvas.svg
                            .append('g').classed('xAxis', true)
  // Render X axis
  if (this.options.xAxis.show) {
    this.canvas.xAxis.attr('transform', 'translate('+(yAxisWidth + 2)+', '+(graphHeight + xAxisHeight)+')')
    this.renderXAxis(this.canvas.xAxis, graphWidth, axesFontSize);
  }


  // Init Y axis if needed
  if (this.canvas.yAxis == undefined)
    this.canvas.yAxis = this.canvas.svg
                            .append('g').classed('yAxis', true)
  // Render Y axis
  if (this.options.yAxis.show) {
    this.canvas.yAxis.attr('transform', 'translate('+0+', '+0+')')
    this.renderYAxis(this.canvas.yAxis, graphHeight, axesFontSize);
  }
}

