Editor = React.createClass({
  mixins: [ ReactMeteorData ],
  getMeteorData() {
    Meteor.subscribe( 'editor', this.props.post );

    return {
      post: Posts.findOne( { _id: this.props.post } )
    };
  },
  validations() {
    let component = this;

    return {
      rules: {
        postTitle: {
          required: true
        }
      },
      messages: {
        postTitle: {
          required: "Hang on there, a post title is required!"
        }
      },
      submitHandler() {
        let { getValue, isChecked } = ReactHelpers;

        let form = component.refs.editPostForm.refs.form,
            post = {
              _id: component.props.post,
              title: getValue( form, '[name="postTitle"]' ),
              slug: getValue( form, '[name="postSlug"]' ),
              content: getValue( form, '[name="postContent"]' ),
              published: isChecked( form, '[name="postPublished"]' ),
              tags: getValue( form, '[name="postTags"]' ).split( ',' ).map( ( string ) => {
                return string.trim();
              })
            };

        Meteor.call( 'savePost', post, ( error, response ) => {
          if ( error ) {
            Bert.alert( error.reason, 'danger' );
          } else {
            Bert.alert( 'Post saved!', 'success' );
          }
        });
      }
    };
  },
  generateSlug( event ) {
    let { setValue } = ReactHelpers,
        form         = this.refs.editPostForm.refs.form,
        title        = event.target.value;

    setValue( form, '[name="postSlug"]', getSlug( title, { custom: { "'": "" } } ) );
  },
  getLastUpdate() {
    if ( this.data ) {
      let { formatLastUpdate } = ReactHelpers,
          post                 = this.data.post;

      return `${ formatLastUpdate( post.updated ) } by ${ post.author }`;
    }
  },
  getTags() {
    let post = this.data.post;

    if ( post && post.tags ) {
      return post.tags.join( ', ' );
    }
  },
  handleSubmit( event ) {
    event.preventDefault();
  },
  render() {
    if ( !this.data.post ) { return <div />; }

    return <GridRow>
      <GridColumn className="col-xs-12 col-sm-8 col-sm-offset-2">
        <PageHeader size="h4" label="Edit Post" />
        <Form ref="editPostForm" id="edit-post" className="edit-post" validations={ this.validations() } onSubmit={ this.handleSubmit }>
          <p className="updated-date">
            <strong>Last Updated:</strong> { this.getLastUpdate() }
          </p>
          <FormGroup>
            <FormControl
              style="checkbox"
              name="postPublished"
              id="#post-published"
              label="Published?"
              defaultValue={ this.data.post && this.data.post.published }
            />
          </FormGroup>
          <FormGroup>
            <FormControl
              showLabel={ false }
              style="input"
              type="text"
              name="postTitle"
              label="Title"
              onChange={ this.generateSlug }
              defaultValue={ this.data.post && this.data.post.title }
            />
          </FormGroup>
          <FormGroup>
            <FormControl
              disabled={ true }
              showLabel={ false }
              style="input"
              type="text"
              name="postSlug"
              label="Slug"
              defaultValue={ this.data.post && this.data.post.slug }
            />
          </FormGroup>
          <FormGroup>
            <FormControl
              showLabel={ false }
              style="textarea"
              name="postContent"
              label="Content"
              defaultValue={ this.data.post && this.data.post.content }
            />
          </FormGroup>
          <FormGroup>
            <FormControl
              showLabel={ false }
              style="input"
              type="text"
              name="postTags"
              label="Tags"
              defaultValue={ this.getTags() }
            />
          </FormGroup>
          <FormGroup>
            <SuccessButton type="submit" label="Save Post" />
          </FormGroup>
        </Form>
      </GridColumn>
    </GridRow>;
  }
});
