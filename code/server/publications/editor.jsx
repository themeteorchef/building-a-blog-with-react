Meteor.publish( 'editor', ( postId ) => {
  check( postId, String );

  return [
    Posts.find( { _id: postId } ),
    Meteor.users.find( {}, { fields: { profile: 1 } } )
  ];
});
