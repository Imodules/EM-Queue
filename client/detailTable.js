/**
 * Created by paul on 2/5/15.
 */

'use strict';
Template.detailTable.helpers({
	rows: function() {
		if (Session.equals('IncompleteOnly', true)) {
			return Collections.EmailQueue.find({QueueState: {$lt: 2}}, {sort: {DateAdded: 1}});
		}

		return Collections.EmailQueue.find({}, {sort: {DateAdded: 1}});
	}
});

Template.detailRow.helpers({
	queueTime: function () {
		if (this.EmailData.PopulationStartTime === null || this.EmailData.StartTime === null) {
			return '';
		}
		return moment.utc(moment(this.EmailData.PopulationStartTime).diff(moment(this.EmailData.StartTime))).format('HH:mm:ss');
	},
	populationTime: function () {
		if (this.EmailData.PopulationEndTime === null || this.EmailData.PopulationStartTime === null) {
			return '';
		}
		return moment.utc(moment(this.EmailData.PopulationEndTime).diff(moment(this.EmailData.PopulationStartTime))).format('HH:mm:ss');
	},
	executionTime: function () {
		if (this.EmailData.EmailEndTime === null || this.EmailData.EmailStartTime === null) {
			return '';
		}
		return moment.utc(moment(this.EmailData.EmailEndTime).diff(moment(this.EmailData.EmailStartTime))).format('HH:mm:ss');
	},

	myCalcs: function () {
		var time = this.EmailData.EmailEndTime === null ? new Date() : this.EmailData.EmailEndTime;
		var exTimeInSeconds = moment(time).diff(moment(this.EmailData.EmailStartTime), 'seconds');
		var emailsPerSecond;
		if (isNaN(exTimeInSeconds) || exTimeInSeconds <= 0) {
			emailsPerSecond = 0;
		} else {
			emailsPerSecond = Math.floor(this.EmailData.TotalEmails / exTimeInSeconds);
		}

		return {
			emailsPerSecond: emailsPerSecond,
			percentComplete: (this.EmailData.TotalEmails / this.EmailData.RecipientCount * 100).toFixed() + '%',
			emailsLeft: this.EmailData.RecipientCount - this.EmailData.TotalEmails
		};
	},
	estimatedCompletion: function () {
		if (!this.emailsPerSecond) { return ''; };

		var secondsLeft = this.emailsLeft / this.emailsPerSecond;
		if (secondsLeft <= 0) {
			return '';
		}

		return moment().startOf('day').seconds(secondsLeft).format('HH:mm:ss');
	}
});
