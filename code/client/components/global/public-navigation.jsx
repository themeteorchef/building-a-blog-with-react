PublicNavigation = React.createClass({
  mixins: [ ReactMeteorData ],
  getMeteorData() {
    return {
      items: {
        right: [
          { uid: 'login', href: '/login', label: 'Log In' }
        ]
      }
    };
  },
  render() {
    return <div className="public-navigation">
      <NavBarNav position={ `navbar-right` } items={ this.data.items.right } />
    </div>;
  }
});
