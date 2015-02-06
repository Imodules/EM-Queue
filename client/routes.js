'use strict';

Router.route('/', function () {
	Meteor.subscribe('emQueue');
	Meteor.subscribe('waves');
	this.render('home');
});

