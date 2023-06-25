import * as Rdflib from 'rdflib';

const NAMED_GRAPH = 'http://named.graph/';
const NS = {
  iop:  Rdflib.Namespace( 'https://w3id.org/iadopt/ont/' ),
  rdf:  Rdflib.Namespace( 'http://www.w3.org/1999/02/22-rdf-syntax-ns#' ),
  rdfs: Rdflib.Namespace( 'http://www.w3.org/2000/01/rdf-schema#' ),
};
const PROP_MAP = {
  label:      [ NS.rdfs( 'label' ) ],
  comment:    [ NS.rdfs( 'comment' ), NS.rdf( 'description') ],
  ooi:        [ NS.iop( 'hasObjectOfInterest' ) ],
  prop:       [ NS.iop( 'hasProperty' ) ],
  matrix:     [ NS.iop( 'hasMatrix' ) ],
  context:    [ NS.iop( 'hasContextObject' ) ],
  constraint: [ NS.iop( 'hasConstraint' ) ],
};
const LITERAL_PROP_MAP = {
  label:    PROP_MAP.label,
  comment:  PROP_MAP.comment,
};

/**
 * Parse a TTL representation of the Variable to the internal object format
 * @param   {string} content  TTL representation of the Variable
 * @returns {object}          Object representation of the Variable
 */
export default async function extract( content ) {

  // parse input
  const graph = Rdflib.graph();
  Rdflib.parse( content, graph, NAMED_GRAPH );

  // get all variables
  const variables = queryType( graph, NS.iop( 'Variable' ) );

  // add entries for each variable
  const result = [];
  for( const variable of variables ){

    // entry base
    const entry = {
      iri: variable.value,
      shortIri: getPrefixed( graph.namespaces, variable.value ),
      ... Object.keys( PROP_MAP ).reduce( (all,el) => ({ [el]: [], ... all }), {} ),
    };
    result.push( entry );

    // grab all properties and collect their values in the entry
    for( const [ key, props ] of Object.entries( PROP_MAP ) ) {

      for( const prop of props ) {
        const values = graph.each( variable, prop, undefined );
        if( values.length > 0 ){
          entry[ key ] = values.map( (el) => {
            switch( el.termType ) {
              case 'NamedNode': return { type: 'iri',     value: el.value };
              case 'Literal':   return { type: 'literal', value: el.value };
              default: throw new Error( `Unsupported value ${el.termType} for key ${key}` );
            }
          });
          break;
        }
      }
    }

    // further get data (label) for some more properties
    for( const key of [ 'ooi', 'prop', 'matrix', 'context' ] ) {

      // for each individual of that type
      for( const instance of entry[ key ] ) {

        // add shortened IRI, if possible
        instance.shortIri = getPrefixed( graph.namespaces, instance.value );

        // for use within RDFlib this needs to be a named node
        const instanceNode = Rdflib.sym( instance.value );

        // try to get labels and comments
        for( const [ key, props ] of Object.entries( LITERAL_PROP_MAP ) ) {
          for( const prop of props ) {

            const values = graph.each( instanceNode, prop, undefined );
            if( values.length > 0 ){
              instance[ key ] = values.map( (el) => {
                switch( el.termType ) {
                  case 'Literal': return { type: 'literal', value: el.value };
                  default:        throw new Error( `Unsupported value ${el.termType} for key ${key}` );
                }
              });
              break;
            }
          }
        } // for literal props

        // backup for label: take the local part from the IRI
        if( !instance.label ) {

          // cutoff for the local part; might be separated by # or /
          const posHash = instance.value.lastIndexOf( '#' );
          const splitPos = posHash > 0 ? posHash : instance.value.lastIndexOf( '/' );

          // set the label
          instance.label = [{
            type:   'literal',
            value:  instance.value.slice( splitPos + 1 ),
          }];

        }

      } // for instance

    } // for key

  }

  return result;

}


function queryType( graph, type ) {
  return graph
    .each( undefined, NS.rdf( 'type' ), type )
    // .map( (el) => el.termType == 'NamedNode' ? el.value : null )
    .filter( (el) => el );
}

/**
 * shorten a given IRI by trying to apply prefixes
 * @param   {object} namespaces   map of prefixes and their expanded versions
 * @param   {string} iri          the IRI to shorten
 * @returns {string|null}         shortened IRI or null if no prefix was found
 */
function getPrefixed( namespaces, iri ) {
  for( const [key, value] of Object.entries( namespaces ) ) {
    if( iri.startsWith( value ) ) {
      return iri.replace( value, `${key}:` );
    }
  }
}
