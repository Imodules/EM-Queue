/**
 * Created by paul on 2/5/15.
 */

'use strict';
Template.detailTable.helpers({
	rows: function() {
		if (Session.equals('IncompleteOnly', true)) {
			return Collections.EmailQueue.find({QueueState: {$lt: 2}}, {sort: {DateAdded: -1}});
		}

		return Collections.EmailQueue.find({}, {sort: {DateAdded: -1}});
	}
});

Template.detailRow.helpers({
	queueTime: function() {
        if (this.EmailData.PopulationStartTime === null || this.EmailData.StartTime === null) {
            return '';
        }
		return moment.utc(moment(this.EmailData.PopulationStartTime).diff(moment(this.EmailData.StartTime))).format('HH:mm:ss');
	},
	populationTime: function() {
        if (this.EmailData.PopulationEndTime === null || this.EmailData.PopulationStartTime === null) {
            return '';
        }
		return moment.utc(moment(this.EmailData.PopulationEndTime).diff(moment(this.EmailData.PopulationStartTime))).format('HH:mm:ss');
	},
	executionTime: function() {
        if (this.EmailData.EmailEndTime === null || this.EmailData.EmailStartTime === null) {
            return '';
        }
		return moment.utc(moment(this.EmailData.EmailEndTime).diff(moment(this.EmailData.EmailStartTime))).format('HH:mm:ss');
	},
    emailsPerSecond: function() {
        var exTimeInSeconds = moment(this.EmailData.EmailEndTime).diff(moment(this.EmailData.EmailStartTime), 'seconds');
        if (exTimeInSeconds <= 0) {
            return 0;
        }
        return this.EmailData.TotalEmails / exTimeInSeconds;
    },
    percentComplete: function() {
        return (this.EmailData.RecipientCount / this.EmailData.TotalEmails * 100).toFixed() + '%';
    },
    estimatedCompletion: function() {
        var emailsLeft = this.EmailData.RecipientCount - this.EmailData.TotalEmails;
        return emailsLeft;
    }
});
