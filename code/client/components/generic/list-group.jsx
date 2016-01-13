ListGroup = React.createClass({
  renderListGroup() {
    if ( this.props.linked ) {
      return <div className="list-group">
        {this.props.items.map( ( item ) => {
          return <a key={ item.uid } href={ item.href } className="list-group-item">
            { item.label }
          </a>;
        })}
      </div>;
    } else {
      return <ul className="list-group">
        {this.props.items.map( ( item ) => {
          return <li key={ item.uid } className="list-group-item">
            { item.label }
          </li>;
        })}
      </ul>;
    }
  },
  render() {
    return this.renderListGroup();
  }
});
