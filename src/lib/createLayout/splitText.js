/**
 * split a given text into multiple lines in a way that all lines roughly have the same length
 * the text is hence somewhat rectangular
 *
 * @param   {string}          text          the text split into lines
 * @param   {number}          lineCount     the number of lines to split into
 * @returns {Array.<string>}                an array of strings containing one line of text per element
 *
 * @todo use the actual rendered text width via getTextDims() instead of the character length
 */
export default function splitText( text, lineCount ) {
  /*
    basic idea is to iteratively split away a single line from start or end of the text
    (whichever is closer to the ideal length for a line)
    until the entire text is distributed over the desired amount of lines
    if single words are too long, they will stay on their own line - no matter the length
  */

  // split the text into tokens
  const tokens = text.split( ' ' )
    .map( (e) => ({ val: e, length: e.length }));
  const reversedTokens = tokens.slice( 0, tokens.length ).reverse();  // so we DRY during the algorithm

  // get the target length for each line
  const targetLength = text.length / lineCount;

  // we move from start and end of the text
  let startIndex = 0;
  let endIndex = tokens.length - 1;

  // collect into lines
  const linesStart = [];      // collected lines (from start of text)
  const linesEnd = [];        // collected lines (from end of text)
  while(
    // we have not yet reached the desired line count
    (linesStart.length + linesEnd.length + 1 < lineCount)
    // we still have tokens left
    && (startIndex < endIndex)
  ) {

    // best solution from both ends
    const bestStart = getNextLine( tokens, startIndex, endIndex, targetLength );
    // need to mirror indices for reversed list
    const bestEnd = getNextLine( reversedTokens, tokens.length - endIndex - 1, tokens.length - startIndex - 1, targetLength );
    bestEnd.index = tokens.length - bestEnd.index - 1;

    // select the best solution
    if( bestStart.deviation <= bestEnd.deviation ) {

      // next line is taken from start
      linesStart.push(
        tokens.slice( startIndex, bestStart.index + 1 )
          .map( (e) => e.val )
          .join( ' ' )
      );
      startIndex = bestStart.index + 1;

    } else {

      // next line is taken from end
      linesEnd.push(
        tokens.slice( bestEnd.index, endIndex+1 )
          .map( (e) => e.val )
          .join( ' ' )
      );
      endIndex = bestEnd.index - 1;

    }

  }

  // assemble all parts
  return [ ... linesStart,
           tokens.slice( startIndex, endIndex+1 ).map( (e) => e.val ).join( ' ' ),
           ... linesEnd.reverse()
  ];

}


/**
 * find the next array of tokens to use as a separate line from the beginning of the token list
 *
 * @param   {Array}   tokens          list of tokens
 * @param   {number}  startIndex      starting index to consider
 * @param   {number}  endIndex        final index to consider
 * @param   {nunber}  targetLength    target length of a line
 * @returns {object}                  the found index along with the deviation from the target length
 */
function getNextLine( tokens, startIndex, endIndex, targetLength ) {

  // we use at least one token
  let lineLength = tokens[ startIndex ].length;
  let splitIndex = startIndex;

  // short-circuit: first token already exceeds targetLength
  if( lineLength >= targetLength ) {
    return {
      index:      splitIndex,
      deviation:  lineLength - targetLength,
    };
  }

  // try to use more tokens until we find the threshold
  while(
    // we still have more tokens to check
    (splitIndex < endIndex)
    // we are still below the threshold
    && (lineLength + tokens[ splitIndex + 1 ].length < targetLength)
  ) {
    splitIndex += 1;
    lineLength += tokens[ splitIndex + 1 ].length + 1; // account for spaces between tokens
  }

  // short-circuit: we are using all remaining tokens
  if( splitIndex == endIndex ) {
    return {
      index:      splitIndex,
      deviation:  lineLength,
    };
  }

  // compare shorter and longer versions around the threshold
  if( targetLength - lineLength <= lineLength + tokens[ splitIndex + 1 ].length + 1 - targetLength ) {
    // shorter is not worse
    // in case of ties, we use less tokens
    return {
      index:      splitIndex,
      deviation:  targetLength - lineLength,
    };

  } else {
    // longer is better
    return {
      index:      splitIndex+1,
      deviation:  lineLength + tokens[ splitIndex + 1 ].length - targetLength,
    };

  }

}
