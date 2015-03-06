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
			{sid: -10026, wave: 2},
			{sid: -10027, wave: 3},
			{sid: -10028, wave: 3},
			{sid: -10029, wave: 4},
			{sid: -10030, wave: 4}
		],
		db,
		emailQueue,
		emailsToSend = 20,
		emailsCreated = 0,
		sendThreadCount = 2;

if (process.argv.length >= 3) {
	emailsToSend = parseInt(process.argv[2]);
}

if (process.argv.length >= 4) {
	sendThreadCount = parseInt(process.argv[3]);
}

function getRandomId(min, max) {
	return Math.floor(Math.random() * max) + min;
}

function getDummyEmail() {
	var siteCount = sites.length - 1;
	var site = sites[getRandomId(0, siteCount)];

	var start = moment();
	start.minute(0);
	start.second(0);

	return {
		_id: ++emailsCreated,
		Wave: site.wave,
		ThreadIndex: null,
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
		if (err) { return; }
		if (doc) {
			console.log('Populating Email: ' + doc._id);
			if (doc.EmailData.PopulationStartTime === null ) {
				emailQueue.update({_id: doc._id}, {$set: {'EmailData.PopulationStartTime': new Date()}}, function () {});
			} else if (doc.EmailData.PopulationEndTime === null) {
				var ranSec = getRandomId(1, 3);
				if (moment(doc.EmailData.PopulationStartTime).add(ranSec, 's').isBefore(new Date())) {
					emailQueue.update({_id: doc._id}, {$set: {'EmailData.PopulationEndTime': new Date(), QueueState: 1}}, function () {});
				}
			}
		}
	});


}

function processEmailSend(currentThread) {
	if (currentThread >= sendThreadCount) { return; }

	emailQueue.findOne({QueueState: 1, $or: [{ThreadIndex: currentThread}, {ThreadIndex: null}]}, function (err, doc) {
		if (err) { return; }
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

			func(doc._id, currentThread, emailInc, function (err) {
				assert.equal(err, null);

				processEmailSend(currentThread + 1);
			});
		} else {
			// Didn't find anything for this thread, move to the next.
			processEmailSend(currentThread + 1);
		}
	});
}

function startEmail(id, thread, emailInc, cb) {
	console.log(thread + '> Starting email send: ' + id);
	emailQueue.update({_id: id}, {$set: {'EmailData.EmailStartTime': new Date(), ThreadIndex: thread}}, cb);
}

function incEmail(id, thread, emailInc, cb) {
	console.log(thread + '> Email: ' + id + ' sending ' + emailInc);
	emailQueue.update({_id: id}, {$inc: {'EmailData.TotalEmails': emailInc}}, cb);
}

function compEmail(id, thread, emailInc, cb) {
	console.log(thread + '> Completing email send: ' + id);
	emailQueue.update({_id: id}, {$inc: {'EmailData.TotalEmails': emailInc},
		$set: {
			QueueState: 2,
			'EmailData.EmailEndTime': new Date(),
			'EmailData.EndTime': new Date()
		}}, cb);
}


function processLoop() {
	insertEmail();

	emailQueue.findOne({QueueState: {$lt: 2}}, {sort: [['ThreadIndex', 'asc']]}, function (err, doc) {
		assert.equal(err, null);

		if (doc) {
			processPopEmail();
			processEmailSend(doc.ThreadIndex === null ? 0 : doc.ThreadIndex);
		}

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
