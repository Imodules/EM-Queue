/**
 * Created by paul on 2/5/15.
 */

'use strict';
Meteor.startup(function () {
	Collections.Waves.remove({});

	if (Collections.Waves.find().count() === 0) {
		for (var i=1; i<=2; i++) {
			console.log('Creating wave: ' + i);
			Collections.Waves.insert({wave: i, name: 'Wave ' + i});
		}
	}

});