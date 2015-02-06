/**
 * Created by paul on 2/5/15.
 */

'use strict';
Template.home.helpers({
	amIChecked: function (opt) {
		if (opt === 'inc' && Session.equals('IncompleteOnly', true)) {
			return 'active';
		} else if (opt === 'all' && Session.equals('IncompleteOnly', false)) {
			return 'active';
		}
	}
});

Template.home.events({
	'change input[name="filterAll"]': function () {
		Session.set('IncompleteOnly', $('#optInc').is(':checked'));
	}
});
