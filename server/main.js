import { Meteor } from 'meteor/meteor';

import Waypoints from '../waypoints';

Meteor.startup(() => {
  // code to run on server at startup
  Waypoints.find().observe({
    added: (waypoint) => {
      console.log('got waypoint', waypoint);
    },
  });
});
