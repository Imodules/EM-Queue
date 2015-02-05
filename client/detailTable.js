/**
 * Created by paul on 2/5/15.
 */

'use strict';
Template.detailTable.helpers({
	rows: function() {
		return Collections.EmailQueue.find();
	}
});

Template.detailRow.helpers({
	queueTime: function() {
		return moment.utc(moment(this.EmailData.PopulationStartTime).diff(moment(this.EmailData.StartTime))).format('HH:mm:ss');
	},
	populationTime: function() {
		return moment.utc(moment(this.EmailData.PopulationEndTime).diff(moment(this.EmailData.PopulationStartTime))).format('HH:mm:ss');
	},
	executionTime: function() {
		return moment.utc(moment(this.EmailData.EmailEndTime).diff(moment(this.EmailData.EmailStartTime))).format('HH:mm:ss');
	}
});
