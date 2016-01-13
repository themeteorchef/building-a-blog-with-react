PostsIndex = React.createClass({
  mixins: [ ReactMeteorData ],
  getMeteorData() {
    let query = {};

    if ( this.props.tag ) {
      Meteor.subscribe( 'tagsIndex', this.props.tag );
      query = { tags: { $in: [ this.props.tag ] } };
    } else {
      Meteor.subscribe( 'postsIndex' );
    }

    return {
      posts: Posts.find( query, { sort: { updated: -1 } } ).fetch()
    };
  },
  renderHeader() {
    if ( this.props.tag ) {
      return <Jumbotron>
        <h4>Posts tagged with: { this.props.tag }.</h4>
      </Jumbotron>;
    } else {
      return <Jumbotron>
        <h2>Get Buff</h2>
        <h4>A new blog by the HD Buff crew.</h4>
      </Jumbotron>;
    }
  },
  renderPosts() {
    return this.data.posts.map( ( post ) => {
      return <Post key={ post._id } post={ post } />;
    });
  },
  render() {
    return <div className="posts">
      <GridRow>
        <GridColumn className="col-xs-12 col-sm-8 col-sm-offset-2">
          { this.renderHeader() }
          { this.renderPosts() }
        </GridColumn>
      </GridRow>
    </div>;
  }
});
