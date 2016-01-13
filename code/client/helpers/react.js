ReactHelpers = {
  getValue( context, selector ) {
    return context.querySelector( selector ).value;
  },
  setValue( context, selector, value ) {
    context.querySelector( selector ).value = value;
  },
  formatLastUpdate( date ) {
    if ( date ) {
      return moment( date ).format( 'MMMM Do, YYYY hh:mm a' );
    }
  }
};
