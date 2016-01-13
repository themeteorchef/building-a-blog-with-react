Meteor.publish( 'postsList', () => {
  return Posts.find();
});
