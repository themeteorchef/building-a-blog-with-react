PanelHeading = React.createClass({
  render() {
    return <div className="panel-heading">
      { this.props.children }
    </div>;
  }
});
