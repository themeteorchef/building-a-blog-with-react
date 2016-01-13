PanelBody = React.createClass({
  render() {
    return <div className="panel-body">
      { this.props.children }
    </div>;
  }
});
