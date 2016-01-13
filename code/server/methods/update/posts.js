Meteor.methods({
  savePost( post ) {
    check( post, Object );

    let postId = post._id;
    delete post._id;

    Posts.upsert( postId, { $set: post } );
  }
});
