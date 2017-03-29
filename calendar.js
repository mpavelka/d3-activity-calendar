/* Calendar
 * 
 * @param options Calendar options
 *
 * */
var Calendar = function(options) {
  this.canvas = {};
  this._init(options);
}


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
    height:     300,
    responsive: false,
    granX:      Calendar.gran.DAY,
    granY:      Calendar.gran.HOUR,
    minDate:    null,
    maxDate:    null,
  }, options);

  // Default maxDate is now
  if (this.options.maxDate === null)
    this.options.maxDate = new Date();
 
  // default minDate to today - 1 month
  if (this.options.minDate === null) {
    var minDate = new Date();

    // January -> December last year
    if (minDate.getMonth() == 1) {
      minDate.setMonth(12);
      minDate.setYear(minDate.getYear()-1);
    } else {
      minDate.setMonth(minDate.getMonth()-1);9
    }
    this.options.minDate = minDate;
  }
}

/* Sets calendar data
 *
 * Data is expected to be an array objects in following format:
 * {
 *   date: Date,
 *   val: float
 * }
 * */
Calendar.prototype.setData = function(data) {
  this.data.data = data;
  this.data.minDate = null;
  this.data.maxDate = null;

  for (var i=0; i<data.length; i++) {
    // Data item object must contain the key 'date'
    // data[i].date must be a Date object
    if (!data[i].date instanceof Date)
      continue;

    // Append to object data
    this.data.data.push(data[i]);

    // Min date
    if (this.data.minDate == null)
      this.data.minDate = data[i].date;
    else if (this.data.minDate > data[i])
      this.data.minDate = data[i].date;

    // Max date
    if (this.data.maxDate == null)
      this.data.maxDate = data[i].date;
    else if (this.data.maxDate < data[i])
      this.data.maxDate = data[i].date;
  }
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
  
  // floor seconds
  retDate.setMilliseconds(0);
  // floor minute
  if (granularity >= Calendar.gran.MINUTE)
    retDate.setSeconds(0);
  // floor hour
  if (granularity >= Calendar.gran.HOUR)
    retDate.setMinutes(0);
  // floor day
  if (granularity >= Calendar.gran.DAY)
    retDate.setHours(0);
  // floor month
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
  var granX      = this.options.granX;
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
  var granY      = this.options.granY;

  if (granY == Calendar.gran.MILLISECOND)
    return date.getMilliseconds();
  if (granY == Calendar.gran.SECOND)
    return date.getSeconds();
  else if (granY == Calendar.gran.MINUTE)
    return date.getMinutes();
  else if (granY == Calendar.gran.HOUR)
    return date.getHours();
  else if (granY == Calendar.gran.DAY)
    return date.getDate()-1;
  else if (granY == Calendar.gran.MONTH)
    return date.getMonth()-1;
  else if (granY == Calendar.gran.YEAR)
    return date.getYear()-1;

  throw 'Unknown granularity ' + granY;
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
  var flrMinDate = this.floorDate(this.options.minDate, gran);
  var flrMaxDate = this.floorDate(this.options.maxDate, gran);
  return Math.abs(flrMaxDate - flrMinDate) / Calendar.granMilliseconds[gran];
}


/* Returns the rows count based on the Y axis granularity (granY)
 *
 * */
Calendar.prototype.getRowsCount = function() {
  return this.getRowNames().length;
}


/* Returns and array of columns names based on the options 
 *
 * */
Calendar.prototype.getColNames = function() {
  var ret = [];
  var gran      = this.options.granX;

  var flrMinDate = this.floorDate(this.options.minDate, gran);
  var flrMaxDate = this.floorDate(this.options.maxDate, gran);
  var colsCount = Math.abs(flrMaxDate - flrMinDate) / Calendar.granMilliseconds[gran];


  for (var i=0, time=flrMinDate.getTime(); i<colsCount; i++) {
    var date = new Date(time);
    if (gran == Calendar.gran.MILLISECOND)
      name = date.getMilliseconds() + ' ';
    if (gran == Calendar.gran.SECOND)
      name = date.getSeconds() + ' ';
    else if (gran == Calendar.gran.MINUTE)
      name = date.getMinutes() + ' ';
    else if (gran == Calendar.gran.HOUR)
      name = date.getHours() + ' ';
    else if (gran == Calendar.gran.DAY)
      name = date.getDate() + ' ';
    else if (gran == Calendar.gran.MONTH)
      name = date.getMonth()-1 + ' ';
    else if (gran == Calendar.gran.YEAR)
      name = date.getYear()-1 + ' ';
    ret.push(name);
    time = time + Calendar.granMilliseconds[gran]
  }

  return ret;

}

/* Returns an array of row names based on the options
 *
 * */
Calendar.prototype.getRowNames = function() {
  var ret = [];
  var gran      = this.options.granY;

  if (gran == Calendar.gran.MILLISECOND)
    name = date.getMilliseconds() + ' ';
  if (gran == Calendar.gran.SECOND)
    return [  0,  1,  2,  3,  4,  5,  6,  7,  8,  9,
             10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
             20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
             30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
             40, 41, 42, 43, 44, 45, 46, 47, 48, 49,
             50, 51, 52, 53, 54, 55, 56, 57, 58, 59];
  else if (gran == Calendar.gran.MINUTE)
    return [  0,  1,  2,  3,  4,  5,  6,  7,  8,  9,
             10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
             20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
             30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
             40, 41, 42, 43, 44, 45, 46, 47, 48, 49,
             50, 51, 52, 53, 54, 55, 56, 57, 58, 59];
  else if (gran == Calendar.gran.HOUR)
    return [  0,  1,  2,  3,  4,  5,  6,  7,  8,  9,
             10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
             20, 21, 22, 23];
  else if (gran == Calendar.gran.DAY)
    return [  0,  1,  2,  3,  4,  5,  6,  7,  8,  9,
             10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
             20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
             30, 31];
  else if (gran == Calendar.gran.MONTH)
    return [  0,  1,  2,  3,  4,  5,  6,  7,  8,  9,
             10, 11, 12];
  else
    throw "Incompatible granularity";

}

/* Returns X coordinate of the rectangle that represents the given date
 *
 * @param date a Date object
 * */
Calendar.prototype.getX = function(date) {
  
}

/* Returns Y coordinate of the rectangle that represents the given date
 *
 * @param date a Date object
 * */
Calendar.prototype.getX = function(date) {
  ;
}

/* Renders the calendar
 *
 * @param date a Date object
 * */
Calendar.prototype.render = function() {
  // Attributes
  var columnsNames = this.getColNames();
  var columnsCount = columnsNames.length;
  var rowsNames = this.getRowNames();
  var rowsCount = rowsNames.length;

  var paddingLeft = 10;
  var paddingRight = 10;
  var paddingTop = 10;
  var paddingBottom = 10;

  var cellWidth = Math.ceil((this.options.width - paddingLeft - paddingRight) / columnsCount);
  var cellHeight = Math.ceil((this.options.height - paddingTop - paddingBottom) / rowsCount);

  // Init canvas if needed
  if (this.canvas.svg == undefined)
    this.canvas.svg = d3.select(this.options.wrapper)
            .append("svg")
              .attr("width", this.options.width)
              .attr("height", this.options.height)
              .append('g').classed('svg', true);

  // Init textXAxis if needed
  if (this.canvas.textXAxis == undefined)
    this.canvas.textXAxis = this.canvas.svg.append('g').classed('textXAxis', true);

  // Init textYAxis if needed
  if (this.canvas.textYAxis == undefined)
    this.canvas.textYAxis = this.canvas.svg.append('g').classed('textYAxis', true);

  // Init rect if needed
  if (this.canvas.rect == undefined)
    this.canvas.rect = this.canvas.svg.append('g').classed('rect', true);



  // Render texts on X Axis
  this.canvas.textXAxis.selectAll('text')
      .data(this.getColNames())
      .enter().append('text')
        .attr('transform', function(val, index) {
          return 'translate('+(index*cellWidth)+', '+(rowsCount*cellHeight)+')';
        })
        .attr('font-size', 12)
        .text(function(val, index, data) { return val; });
  this.canvas.textXAxis.exit().remove();

  // Render texts on Y Axis
  this.canvas.textYAxis.selectAll('text')
      .data(this.getRowNames())
      .enter().append('text')
        .attr('transform', function(val, index) {
          return 'translate(0, '+((cellHeight*rowsCount)-(index*cellHeight))+')';
        })
        .attr('font-size', 12)
        .text(function(val, index, data) { return val; });
  this.canvas.textXAxis.exit().remove();

  // Render rectangles
  this.canvas.rect
    .attr('fill', 'none')
    .attr('stroke', '#ccc')
    .selectAll('rect')
    .data(function() {
      var ret = [];
      for (var i=0; i<columnsCount; i++)
        for (var j=0; j<rowsCount; j++)
          ret.push(0);
      return ret;
    })
    .enter().append('rect')
      .attr("width", cellWidth)
      .attr("height", cellHeight)
      .attr("x", function(val, index) {return Math.floor(index/rowsCount) * cellWidth;})
      .attr("y", function(val, index) {return (cellHeight*rowsCount) - ((index%rowsCount) * cellHeight) - cellHeight;})

  return;

}
