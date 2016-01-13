Panel = React.createClass({
  render() {
    let style   = this.props.style,
        classes = style ? 'panel panel-${ style }' : 'panel panel-default';

    return <div className={ classes }>
      { this.props.children }
    </div>;
  }
});
