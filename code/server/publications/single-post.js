Meteor.publish( 'singlePost', ( postSlug ) => {
  check( postSlug, String );

  return Posts.find( { slug: postSlug } );
});
