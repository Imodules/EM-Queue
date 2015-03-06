/**
 * Created by paul on 3/5/15.
 */

'use strict';
var myLineChart,
		pctChart,
		speedChart,
		pctOptions,
		speedOptions,
		dataPointCount = 120,
		zeroDeltaCount = dataPointCount;

Template.charts.rendered = function () {
	setupLineChart(this);
	setupSpeedChart(this);
	setupPctChart(this);

	//setTimeout(chartTimer, 1000);
	Tracker.autorun(chartTimer);
};

function setupPctChart(t) {
	pctChart = echarts.init(t.find('#pctChart'));

	pctOptions = {
		title: {
			show: false
		},
		series : [
			{
				name:'1',
				type:'pie',
				radius : [60, 90],
				itemStyle: {
					normal: {
						label: {show:false},
						labelLine: {show:false}
					}
				},
				data:[
					{
						value: 0,
						name: 'complete',
						itemStyle: {
							normal: {
								color: '#090',
								label: {
									show: true,
									position: 'center',
									textStyle: {
										color: '#090',
										fontSize: 24,
										fontWeight: 'bold'
									},
									formatter: function (f) {
										return f.value + '%';
									}
								}
							}
						}
					},
					{
						value:100,
						name:'incomplete',
						itemStyle: {
							normal: {
								color: '#ccc'
							}
						}
					}
				]
			}
		]
	};

	// Load data into the ECharts instance
	pctChart.setOption(pctOptions);
}

function setupSpeedChart(t) {
	speedChart = echarts.init(t.find('#speedChart'));

	speedOptions = {
		series : [
			{
				name:'Speed',
				type:'gauge',
				min: 0,
				max: 1000,
				detail : {formatter:'{value}/s'},
				axisLine: {
					lineStyle: {
						color: [[0.05, '#cc0000'],[0.1, '#cccc00'],[1, '#009900']],
						width: 10
					}
				},
				data:[{value: 0}]
			}
		]
	};

	// Load data into the ECharts instance
	speedChart.setOption(speedOptions);
}

function setupLineChart(t) {
	var ctx = t.find('#myChart').getContext('2d'),
			labels = [], sData = [];

	for(var i=dataPointCount; i>0; i--) {
		labels.push('');
		sData.push(0);
	}

	var data = {
		labels: labels,
		datasets: [
			{
				label: 'My Second dataset',
				fillColor: 'rgba(151,187,205,0.2)',
				strokeColor: 'rgba(151,187,205,1)',
				pointColor: 'rgba(151,187,205,1)',
				pointStrokeColor: '#fff',
				pointHighlightFill: '#fff',
				pointHighlightStroke: 'rgba(151,187,205,1)',
				data: sData
			}
		]
	};

	myLineChart = new Chart(ctx).Line(data, {
		responsive: true,
		bezierCurve: false,
		scaleShowGridLines: false,
		pointDot: false,
		datasetStrokeWidth: 1,
		animation: true,
		animationSteps: 60,
		scaleBeginAtZero: true
	});
}

function chartTimer() {
	if (Session.equals('dataWasUpdated', false)) {
		// Nothing to see here.
		return;
	}

	var t = getTotalEmailsSent();

	myLineChart.removeData();
	myLineChart.addData([t.deltaSinceLast], '');

	pctOptions.series[0].data[0].value = ((t.totalEmails / t.recipientCount) * 100).toFixed(1);
	pctOptions.series[0].data[1].value = 100 - pctOptions.series[0].data[0].value;
	pctChart.setOption(pctOptions, true);

	speedOptions.series[0].data[0].value = t.deltaSinceLast;
	speedChart.setOption(speedOptions, true);

	if (t.deltaSinceLast === 0) {
		// If our last delta was 0 then we need to start our count until
		// the chart is cleared of all datapoints.
		if(++zeroDeltaCount === dataPointCount) {
			// No data updated and the chart has been cleared so turn off
			// any reactivity.
			Session.set('dataWasUpdated', false);

			// Update our speed to an avg speed.
			var diffSeconds = moment.duration(moment(t.finish).diff(t.start), 'milliseconds').asSeconds(),
					rate = t.totalEmails / diffSeconds;

			speedOptions.series[0].data[0].value = rate.toFixed(0);
			speedChart.setOption(speedOptions, true);

			return;
		}
	} else {
		// Something did change, reset our delta count.
		zeroDeltaCount = 0;
	}

	// Run the timer through again.
	setTimeout(chartTimer, 1000);
}

var lastTotalEmailsSent = 0;
function getTotalEmailsSent() {
	var totalEmails = 0,
			recipientCount = 0,
			start,
			finish;

	Collections.EmailQueue.find({}, {reactive: false}).forEach(function (emData) {
		if (!start) {
			start = emData.EmailData.StartTime;
		} else if (start > emData.EmailData.StartTime) {
			start = emData.EmailData.StartTime;
		}

		if (!finish) {
			finish = emData.EmailData.EndTime;
		} else if (finish < emData.EmailData.EndTime) {
			finish = emData.EmailData.EndTime;
		}

		recipientCount += emData.EmailData.RecipientCount;
		totalEmails += emData.EmailData.TotalEmails + emData.EmailData.RecipientsSkipped;
	});

	var deltaSinceLast = totalEmails - lastTotalEmailsSent;

	// This will fix the spike when we first start and our last is 0.
	if (lastTotalEmailsSent === 0 || totalEmails < lastTotalEmailsSent) {
		deltaSinceLast = 0;
	}

	lastTotalEmailsSent = totalEmails;

	return {
		totalEmails: totalEmails,
		recipientCount: recipientCount,
		deltaSinceLast: deltaSinceLast,
		start: start,
		finish: finish
	};
}
