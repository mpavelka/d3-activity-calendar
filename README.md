# d3-activity-calendar
A javascript component that displays the GitHub-like activity calendar with configurable datetime granularity on both axes.

## Example Output

![New TeskaLabs SeaCat feature: The Remote Access](https://www.teskalabs.com/media/img/product/availability-calendar.png)

## Usage

```
<!DOCTYPE html>
<html>
<head>
	<title>Activity Calendar</title>
</head>
<body>

<div class="my-wrapper"></div>

<script src="https://d3js.org/d3.v4.min.js"></script>
<script type="text/javascript" src="calendar.js"></script>

<script type="text/javascript">
  var calendar = new Calendar({
    wrapper: '.my-wrapper',
    xAxis: {
      gran: Calendar.gran.DAY,
    },
    yAxis: {
      gran: Calendar.gran.HOUR,
    },
  });
  
  calendar.setData([
  	  {'date': 12345678, 'val': 20},
  	  {'date': 23456781, 'val': 60},
  	  {'date': 34567812, 'val': 80},
  	  ...
    ],
    function mapDate(o) { return new Date(o.date) },
    function mapValue(o) { return o.val });

  calendar.render();

</script>
</body>
</html>

```
