const helperText = document.querySelector( '#helper text' );

const minTextWidth = Math.max(
  getTextDims( 'Property' ).width,
  getTextDims( 'Entity' ).width,
);

/**
 * measure the dimensions of a given text
 * @param     {string}  text      string to be measured
 * @param     {string?} classes   (optional) class of the text element to measure for
 * @returns   {object}            width and height of the rendered text
 */
export default function getTextDims( text, classes ) {

  helperText.classList = classes;
  helperText.innerHTML = text;
  const bbox = helperText.getBoundingClientRect();
  const dims = {
    width:  bbox.width,
    height: bbox.height,
  };
  helperText.innerHTML = '';
  helperText.classList = '';
  return dims;

}

export { minTextWidth, getTextDims };
