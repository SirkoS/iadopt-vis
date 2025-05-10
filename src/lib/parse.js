import N3 from 'n3';
import {RdfXmlParser} from 'rdfxml-streaming-parser';

/**
 * parse a given RDF-string into a graph store
 * @param   {String}              content  RDF-compliant data
 * @returns {Promise.<N3.Store>}           N3-store with parsed data
 */
export async function parseRDF( content ) {

  try {

    // first attempt: N3 (Turtle, TriG, N-Triples, N-Quads, RDF* and Notation3 (N3))
    return parseRDFN3( content );

  } catch (e) {
    try {

      // second attempt: RDF/XML
      return parseRDFXML( content );

    } catch {
      throw Exception( 'Unable to parse file content' );
    }
  }

}


/**
 * @typedef  {Object} ParseResponse
 * @property {N3.Store}                 store     store holding graph data
 * @property {Object.<string, string>}  prefixes  map of prefixes
 */


/**
 * parse a given RDF-string into a graph store using N3 parser
 * @param   {String}              content  RDF-compliant data
 * @returns {Promise.<ParseResponse>}      parsed data
 */
function parseRDFN3( content ) {
  return new Promise( (resolve, reject) => {
    const parser = new N3.Parser();
    const store = new N3.Store();
    parser.parse( content,
                  (error, quad, prefixes) => {

                    // errors
                    if( error ) {
                      reject( error );
                    }

                    // content
                    if (quad) {
                      // remove subgraphs as they confuse queries later on
                      store.add( N3.DataFactory.quad(
                        quad.subject,
                        quad.predicate,
                        quad.object,
                        N3.DataFactory.defaultGraph()
                      ) );
                    } else {
                      resolve({ store, prefixes });
                    }

                  });
  });
}



/**
 * parse a given RDF-string into a graph store using RDF/XML parser
 * @param   {String}              content  RDF-compliant data
 * @returns {Promise.<ParseResponse>}           N3-store with parsed data
 */
function parseRDFXML( content ) {
  return new Promise( (resolve, reject) => {

    // store for result
    const store = new N3.Store();

    // setup parser
    const parser = new RdfXmlParser();
    parser
      .on( 'error', reject )
      .on( 'data', (quad) => store.add( quad ) )
      // TODO integrate prefixes
      .on( 'end', () => resolve({ store, prefixes: {} }) );

    // pipe content
    parser.write( content );
    parser.end();

  });
}
