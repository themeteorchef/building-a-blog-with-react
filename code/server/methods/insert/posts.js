Meteor.methods({
  newPost() {
    return Posts.insert( {} );
  }
});
