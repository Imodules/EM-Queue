'use strict';

Router.route('/', function () {
	Meteor.subscribe('emQueue');
	this.render('home');
});

