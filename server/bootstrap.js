/**
 * Created by paul on 2/5/15.
 */

'use strict';
Meteor.startup(function () {
	var sites = [-10010, -10025];

	Collections.EmailQueue.remove({});

	if (Collections.EmailQueue.find().count() === 0) {
		for (var i=0; i<20; i++) {
			var sid = i % 2 === 0 ? sites[0] : sites[1];
			inserDummyData(i, 1, sid, getRandomId(), getRandomId());
		}
	}

});

function getRandomId() {
	return Math.random() * (100000 - 1000) + 1000;
}

function inserDummyData(idx, wave, siteInfoId, eid, seid) {
	var start = moment();
	start.minute(0);
	start.second(0);

	var s1 = moment(start).add(1, 'm').toDate(),
			s2 = moment(s1).add(1, 'm').toDate(),
			s3 = moment(s2).add(5, 'm').toDate(),
			s4 = moment(s3).add(7, 'm').toDate(),
			s5 = moment(s4).add(8, 'm').toDate(),
			s6 = moment(s5).add(9, 'm').toDate(),
			s7 = moment(s6).add(1, 'm').toDate();

	Collections.EmailQueue.insert({
		Wave: wave,
		ThreadIndex: 1,
		RunDateTime: start.toDate(),
		SiteInfoId: siteInfoId,
		EmailInstanceId: eid,
		ScheduledEmailInstanceId: seid,
		DateAdded: new Date(),
		LastUpdated: new Date(),
		IsDeleted: false,
		QueueState: 0,

		EmailData: {
			RecipientsSkipped: 0,
			RecipientCount: 0,
			HasRoleBasedContent: false,
			EmailBodyLength: 1024,
			TotalEmails: 500,
			StartTime: s2,
			PopulationStartTime: s3,
			PopulationEndTime: s4,
			EmailStartTime: s5,
			EmailEndTime: s6,
			EndTime: s7
		}
	});
}
