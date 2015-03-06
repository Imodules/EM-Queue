/**
 * Created by paul on 3/5/15.
 */

'use strict';
var myLineChart,
		pctChart,
		speedChart,
		pctOptions,
		speedOptions,
		dataPointCount = 120;

Template.charts.rendered = function () {
	setupLineChart(this);
	setupSpeedChart(this);
	setupPctChart(this);

	setTimeout(chartTimer, 1000);
};

function setupPctChart(t) {
	pctChart = echarts.init(t.find('#pctChart'));

	pctOptions = {
		title: {
			show: false
		},
		//legend: {
		//	show: false,
		//	formatter: function () {
		//		return '%';
		//	}
		//},
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
						color: [[0.1, '#cc0000'],[0.2, '#cccc00'],[1, '#009900']],
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
	var t = getTotalEmailsSent();

	myLineChart.removeData();
	myLineChart.addData([t.deltaSinceLast], '');

	pctOptions.series[0].data[0].value = ((t.totalEmails / t.recipientCount) * 100).toFixed(1);
	pctOptions.series[0].data[1].value = 100 - pctOptions.series[0].data[0].value;
	pctChart.setOption(pctOptions, true);

	speedOptions.series[0].data[0].value = t.deltaSinceLast;
	speedChart.setOption(speedOptions, true);

	setTimeout(chartTimer, 1000);
}

var lastTotalEmailsSent = 0;
function getTotalEmailsSent() {
	var totalEmails = 0,
			recipientCount = 0;
	Collections.EmailQueue.find({}, {reactive: false}).forEach(function (emData) {
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
		deltaSinceLast: deltaSinceLast
	};
}
