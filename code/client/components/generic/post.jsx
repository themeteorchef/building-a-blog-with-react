Post = React.createClass({
  getHTML( markdown ) {
    if ( markdown ) {
      return { __html: parseMarkdown( markdown ) };
    }
  },
  renderTags( tags ) {
    if ( tags ) {
      return <div className="tags">
        {tags.map( ( tag ) => {
          return <a className="tag" href={ `/tags/${ tag }` }>#{ tag }</a>;
        })}
      </div>;
    }
  },
  render() {
    let { formatLastUpdate } = ReactHelpers,
        post                 = this.props.post;

    return <div className="post">
      <h3><a href={ `/posts/${ post.slug }`}>{ post.title }</a></h3>
      <p><strong>Last Updated:</strong> { formatLastUpdate( post.updated ) }</p>
      { this.renderTags( post.tags ) }
      <div className="post-body" dangerouslySetInnerHTML={ this.getHTML( post.content ) } />
    </div>;
  }
});
