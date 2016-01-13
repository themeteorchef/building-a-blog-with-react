Meteor.publish( 'postsIndex', function() {
  return Posts.find();
});

Meteor.publish( 'tagsIndex', function( tag ) {
  check( tag, String );
  return Posts.find( { tags: { $in: [ tag ] } } );
});
