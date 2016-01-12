AuthenticatedNavigation = React.createClass({
  mixins: [ ReactMeteorData ],
  getMeteorData() {
    let userEmail = Meteor.user().emails[0].address;

    return {
      items: {
        left: [
          { uid: 'posts', href: '/posts', label: 'Posts' }
        ],
        right: [
          {
            uid: 'currentUser',
            href: '#',
            label: userEmail,
            dropdown: true,
            dropdownItems: [
              { uid: 'logout', href: '#', label: 'Logout', action: () => {
                return Meteor.logout( () => {
                  FlowRouter.go( 'index' );
                });
              }}
            ]
          }
        ]
      }
    };
  },
  render() {
    return <div className="authenticated-navigation">
      <NavBarNav position={ `navbar-left` } items={ this.data.items.left } />
      <NavBarNav position={ `navbar-right` } items={ this.data.items.right } />
    </div>;
  }
});
