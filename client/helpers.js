/**
 * Created by paul on 2/5/15.
 */

'use strict';
Template.registerHelper('formatDate', function(data) {
	return moment(data).format('MMM DD YYYY, h:mm:ss a');
});
