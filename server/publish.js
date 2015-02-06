/**
 * Created by paul on 2/5/15.
 */

'use strict';
Meteor.publish('emQueue', function () {
	return Collections.EmailQueue.find();
});

Meteor.publish('waves', function () {
	return Collections.Waves.find();
});
