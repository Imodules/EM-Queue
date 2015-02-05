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
		emailsToSend = 20,
		emailsCreated = 0;

if (process.argv.length >= 3) {
	emailsToSend = parseInt(process.argv[2]);
}

function getRandomId(min, max) {
	return Math.floor(Math.random() * max) + min;
}

function getDummyEmail() {
	var site = sites[getRandomId(0, 3)];

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
	if (emailsCreated < emailsToSend) {
		var em = getDummyEmail();
		console.log('InsertEmail: ' + em._id);
		emailQueue.insert(em, function () {});
	}
}

function processPopEmail() {
	emailQueue.findOne({QueueState: 0}, function (err, doc) {
		assert.equal(err, null);
		if (doc) {
			console.log('Populating Email: ' + doc._id);
			if (doc.EmailData.PopulationStartTime === null ) {
				emailQueue.update({_id: doc._id}, {$set: {'EmailData.PopulationStartTime': new Date()}}, function () {});
			} else if (doc.EmailData.PopulationEndTime === null) {
				var ranSec = getRandomId(2, 6);
				if (moment(doc.EmailData.PopulationStartTime).add(ranSec, 's').isBefore(new Date())) {
					emailQueue.update({_id: doc._id}, {$set: {'EmailData.PopulationEndTime': new Date(), QueueState: 1}}, function () {});
				}
			}
		}
	});


}

function processEmailSend(id) {
	emailQueue.findOne({QueueState: 1, _id: {$ne: id}}, function (err, doc) {
		assert.equal(err, null);
		if (doc) {
			// Process records.
			var emailProc = getRandomId(5, 20),
					emailDif = doc.EmailData.RecipientCount - doc.EmailData.TotalEmails,
					func = null,
					emailInc = emailProc;

			if (doc.EmailData.EmailStartTime === null) {
				func = startEmail;
			} else if (emailDif > emailProc) {
				func = incEmail;
			} else {
				emailInc = emailDif;
				func = compEmail;
			}

			func(doc._id, emailInc, function (err) {
				assert.equal(err, null);

				if (id === 0) {
					processEmailSend(doc._id);
				}
			});
		}
	});
}

function startEmail(id, emailInc, cb) {
	console.log('Starting email send: ' + id);
	emailQueue.update({_id: id}, {$set: {'EmailData.EmailStartTime': new Date()}}, cb);
}

function incEmail(id, emailInc, cb) {
	console.log('Sending ' + emailInc + ' for email: ' + id);
	emailQueue.update({_id: id}, {$inc: {'EmailData.TotalEmails': emailInc}}, cb);
}

function compEmail(id, emailInc, cb) {
	console.log('Completing email send: ' + id);
	emailQueue.update({_id: id}, {$inc: {'EmailData.TotalEmails': emailInc},
		$set: {
			QueueState: 2,
			'EmailData.EmailEndTime': new Date(),
			'EmailData.EndTime': new Date()
		}}, cb);
}


function processLoop() {
	insertEmail();
	processPopEmail();
	processEmailSend(0);

	emailQueue.findOne({QueueState: {$lt: 2}}, function (err, doc) {
		assert.equal(err, null);

		if (doc || emailsCreated < emailsToSend) {
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
