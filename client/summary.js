/**
 * Created by paul on 2/5/15.
 */

'use strict';
Template.summary.helpers({
	waves: function () {
		return Collections.Waves.find({});
	}
});

Template.summaryRow.helpers({
	myData: function () {
		var start = null,
				maxEndDate = null,
				complete = true,
				totalEmails = 0;

		Collections.EmailQueue.find({Wave: this.wave}).forEach(function (emData) {
			if (start === null) {
				start = emData.EmailData.StartTime;
			} else if (start > emData.EmailData.StartTime) {
				start = emData.EmailData.StartTime;
			}

			if (maxEndDate === null) {
				maxEndDate = emData.EmailData.EndTime;
			} else if (maxEndDate < emData.EmailData.EndTime) {
				maxEndDate = emData.EmailData.EndTime;
			}

			if (complete && emData.EmailData.TotalEmails < emData.EmailData.RecipientCount) {
				complete = false;
			}

			totalEmails += emData.EmailData.TotalEmails;
		});

		return {
			wave: this,
			start: start,
			end: complete ? maxEndDate : null,
			totalEmails: totalEmails
		};
	}
});
