const publicRoutes = FlowRouter.group({
  name: 'public'
});

publicRoutes.route( '/', {
  name: 'index',
  action() {
    ReactLayout.render( App, { yield: <PostsIndex /> } );
  }
});

publicRoutes.route( '/posts/:slug', {
  name: 'singlePost',
  action( params ) {
    ReactLayout.render( App, { yield: <SinglePost slug={ params.slug } /> } );
  }
});

publicRoutes.route( '/tags/:tag', {
  name: 'tagIndex',
  action( params ) {
    ReactLayout.render( App, { yield: <PostsIndex tag={ params.tag } /> } );
  }
});

publicRoutes.route( '/login', {
  name: 'login',
  action() {
    ReactLayout.render( App, { yield: <Login /> } );
  }
});

publicRoutes.route( '/recover-password', {
  name: 'recoverPassword',
  action() {
    ReactLayout.render( App, { yield: <RecoverPassword /> } );
  }
});

publicRoutes.route( '/reset-password/:token', {
  name: 'resetPassword',
  action( params ) {
    ReactLayout.render( App, { yield: <ResetPassword token={ params.token } /> } );
  }
});
