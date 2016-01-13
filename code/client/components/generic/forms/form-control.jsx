FormControl = React.createClass({
  renderLabel() {
    if ( !this.props.labelLink ) {
      return <label htmlFor={ this.props.name }>
        { this.props.label }
      </label>;
    } else {
      return <label htmlFor={ this.props.name }>
        <span className="pull-left">{ this.props.label }</span>
        <a className="pull-right" href={ this.props.labelLink.href }>
          { this.props.labelLink.label }
        </a>
      </label>;
    }
  },
  renderCheckbox() {
    if ( this.props.defaultValue ) {
      return <input
        defaultChecked={ true }
        type="checkbox"
        name={ this.props.name }
        id={ this.props.id }
        onClick={ this.toggleCheckbox }
      />;
    } else {
      return <input
        type="checkbox"
        name={ this.props.name }
        id={ this.props.id }
      />;
    }
  },
  renderFormControl() {
    let fields = {
      input: <input
        ref={ this.props.ref }
        type={ this.props.type }
        className="form-control"
        name={ this.props.name }
        placeholder={ this.props.label }
        disabled={ this.props.disabled }
        onChange={ this.props.onChange }
        defaultValue={ this.props.defaultValue }
      />,
      textarea: <textarea
        ref={ this.props.ref }
        name={ this.props.name }
        className="form-control"
        placeholder={ this.props.label }
        disabled={ this.props.disabled }
        onChange={ this.props.onChange }
        defaultValue={ this.props.defaultValue }
      ></textarea>,
      checkbox: <div className="checkbox">
        <label>{ this.renderCheckbox() } { this.props.label }</label>
      </div>
    };

    return fields[ this.props.style ];
  },
  render() {
    return <div className="input">
      { this.props.showLabel ? this.renderLabel() : '' }
      { this.renderFormControl() }
    </div>;
  }
});
