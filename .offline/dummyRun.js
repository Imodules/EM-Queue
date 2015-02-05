/**
 * Created by paul on 2/5/15.
 */

'use strict';
var MongoClient = require('mongodb').MongoClient,
		assert = require('assert'),
		moment = require('moment');

var url = 'mongodb://localhost:3001/meteor',
		sites = [
			{sid: -10010, wave: 1},
			{sid: -10011, wave: 1},
			{sid: -10025, wave: 2},
			{sid: -10026, wave: 2}
		],
		db,
		emailQueue,
		emailsCreated = 0;

function getRandomId(min, max) {
	return Math.floor(Math.random() * max) + min;
}

function getDummyEmail() {
	var site = sites[getRandomId(0, 3)];

	console.log(site);

	var start = moment();
	start.minute(0);
	start.second(0);

	return {
		_id: ++emailsCreated,
		Wave: site.wave,
		ThreadIndex: 1,
		RunDateTime: start.toDate(),
		SiteInfoId: site.sid,
		EmailInstanceId: getRandomId(1000, 2000),
		ScheduledEmailInstanceId: getRandomId(100, 400),
		DateAdded: new Date(),
		LastUpdated: new Date(),
		IsDeleted: false,
		QueueState: 0,

		EmailData: {
			RecipientCount: getRandomId(100, 1000),
			RecipientsSkipped: 0,
			TotalEmails: 0,
			HasRoleBasedContent: false,
			EmailBodyLength: getRandomId(100, 1000),

			StartTime: new Date(),
			PopulationStartTime: null,
			PopulationEndTime: null,
			EmailStartTime: null,
			EmailEndTime: null,
			EndTime: null
		}
	};
}

function insertEmail() {
	if (emailsCreated < 20) {
		emailQueue.insert(getDummyEmail(), function () {});
	}
}

function processEmailLoop() {
	emailQueue.findOne({QueueState: 0}, function (err, doc) {
		assert.equal(err, null);
		if (doc) {
			if (doc.EmailData.PopulationStartTime === null ) {
				//emailQueue.update({_id: doc._id}, {$set: {QueueState: 1}}, function () {});
				emailQueue.update({_id: doc._id}, {$set: {'EmailData.PopulationStartTime': new Date()}}, function () {});
			} else if (doc.EmailData.PopulationEndTime === null) {
				if (moment(doc.EmailData.PopulationStartTime).add(3, 's').isBefore(new Date())) {
					emailQueue.update({_id: doc._id}, {$set: {'EmailData.PopulationEndTime': new Date(), QueueState: 1}}, function () {});
				}
			}
		}

	});
}


function processLoop() {
	insertEmail();
	processEmailLoop();

	emailQueue.findOne({QueueState: {$lt: 1}}, function (err, doc) {
		assert.equal(err, null);

		if (doc || emailsCreated < 20) {
			setTimeout(processLoop, 500, db);
		} else {
			db.close();
		}
	});
}

MongoClient.connect(url, function(err, _db) {
	assert.equal(null, err);
	console.log('Connected correctly to server');
	db = _db;

	emailQueue = db.collection('EmailQueue');
	emailQueue.remove({}, function (err) {
		assert.equal(err, null);
		processLoop();
	});
});
