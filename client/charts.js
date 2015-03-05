/**
 * Created by paul on 3/5/15.
 */

'use strict';
var myLineChart,
		pctChart,
		dataPointCount = 120;

Template.charts.rendered = function () {
	var ctx = this.find('#myChart').getContext('2d'),
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

	var element = this.find('#pctChart'),
			span = this.$('#pctChart > span');
	pctChart = new EasyPieChart(element, {
		barColor: '#00cc00',
		lineWidth: 6,
		onStart: function(value) {
			span.html(value.toFixed(0) + '%');
		}
	});

	setTimeout(dummyTimer, 1000);
};

function dummyTimer() {
	var t = getTotalEmailsSent();
	console.log(t);

	myLineChart.removeData();
	myLineChart.addData([t.deltaSinceLast], '');

	pctChart.update((t.totalEmails / t.recipientCount) * 100);

	setTimeout(dummyTimer, 1000);
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
