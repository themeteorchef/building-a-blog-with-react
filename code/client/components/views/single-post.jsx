SinglePost = React.createClass({
  mixins: [ ReactMeteorData ],
  getMeteorData() {
    let sub = Meteor.subscribe( 'singlePost', this.props.slug );

    return {
      post: Posts.findOne( { slug: this.props.slug } ),
      ready: sub.ready()
    };
  },
  render() {
    if ( !this.data ) { return <div />; }
    return <GridRow>
      <GridColumn className="col-xs-12 col-sm-8 col-sm-offset-2">
        <Post singlePost={ true } post={ this.data.ready && this.data && this.data.post } />
      </GridColumn>
    </GridRow>;
  }
});
