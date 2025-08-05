import { NS } from '../lib/extract';
import { Concept, Constraint } from './models';

// paddings for turtle output
const PADDING = '    ';

// collect blank nodes identifiers
/** @type {Map<Concept, string>} */
const blankNodes = new Map();

/**
 * convert a given Variable into its Turtle representation
 *
 * @param   {import('./models').Variable}   variable      variable to serialize
 * @returns {string}
 */
export default function toTurtle( variable ) {

  // collect result; start with namespaces
  const result = Object.entries( NS )
    .map( ([ prefix, iri]) => `@prefix ${prefix}: <${iri }> .`);

  // collect triples
  const triples = {};
  /** @type {string} */
  let iri, klass;
  /** @type {Concept} */
  let concept;

  // variable
  const varIri = getId( variable );
  triples[ varIri ] = {
    'a': [ 'iop:Variable', ],
  };
  addCommonProperties( triples[varIri], variable );
  concept = variable.getObjectOfInterest();
  if( concept ) {
    triples[ varIri ][ 'iop:hasObjectOfInterest' ] = [ getId( concept ) ];
  }
  concept = variable.getMatrix();
  if( concept ) {
    triples[ varIri ][ 'iop:hasMatrix' ] = [ getId( concept ) ];
  }
  if( variable.getContextObjects().length > 0 ) {
    triples[ varIri ][ 'iop:hasContextObject' ] = variable.getContextObjects().map( (c) => getId( c ) );
  }
  concept = variable.getStatisticalModifier();
  if( concept ) {
    triples[ varIri ][ 'iop:hasStatisticalModifier' ] = [ getId( concept ) ];
  }
  concept = variable.getProperty();
  if( concept ) {
    triples[ varIri ][ 'iop:hasProperty' ] = [ getId( concept ) ];
  }
  if( variable.getConstraints().length > 0 ) {
    triples[ varIri ][ 'iop:hasConstraint' ] = variable.getConstraints()
      .map( serializeConstraint );
  }


  // components
  const components = [
    variable.getObjectOfInterest(),
    variable.getMatrix(),
    variable.getStatisticalModifier(),
    variable.getProperty(),
    ... (variable.getContextObjects() ?? [])
  ].filter( (c) => c );
  for( const concept of components ) {

    // basic properties
    iri = getId( concept );
    switch( concept.getRole() ) {
      case 'Property':
        klass = 'iop:Property';
        break;
      case 'StatisticalModifier':
        klass = 'iop:StatisticalModifier';
        break;
      default:
        klass = 'iop:Entity';
    }
    triples[ iri ] = {
      'a': [ klass ]
    };
    addCommonProperties( triples[ iri ], concept );

    // add system components
    if( concept.isSystem() ) {

      triples[ iri ][ 'a' ].push(
        concept.isSymmetricSystem()
          ? 'iop:SymmetricSystem'
          : 'iop:AsymmetricSystem'
      );

      const sysComponents = concept.getComponents();
      components.push( ... Object.values( sysComponents ).flat() );
      for( const [prop, comps] of Object.entries( sysComponents ) ) {
        triples[ iri ][ `iop:${prop}` ] = comps.map( (c) => getId( c ) );
      }

    }
  }


  // add serialized triples
  for( const iri in triples ) {

    result.push( `\n${iri}` );

    const propResult = [];
    for( const prop in triples[iri] ) {
      propResult.push(
        PADDING + prop + ' \n' +
        triples[iri][prop]
          .map( (value) => PADDING + PADDING + value )
          .join( ' ,\n' )
      );
    }

    result.push(
      propResult
        .join( ' ;\n' )
    );
    result[ result.length - 1 ] += ' .';

  }

  // cleanup
  blankNodes.clear();

  return result.join( '\n' );

}



/**
 *
 * @param {Object<string, Array<string>}  result    the intermediate result for this concept
 * @param {Concept}                       concept   the concept to serialize
 */
function addCommonProperties( result, concept ) {

  // label
  let value = concept.getLabel();
  if( value ) {
    result[ 'rdfs:label' ] = [ `"${value}"` ];
  }

  // description
  value = concept.getComment();
  if( value ) {
    result[ 'rdfs:comment' ] =[ `"""${value}"""` ];
  }

}



/**
 * retrieve an identifier for the given concept to be used within the turtle serialization
 * this may be either of
 * - a prefixed IRI using given namespaces
 * - a full IRI including brackets
 * - a blank node identifier
 * @param   {import('./models').Concept}    c             concept
 * @returns {string}
 */
function getId( c ) {

  // get IRI
  const iri = c.getIri();

  if( !c.isBlank() && iri ) {

    // try to prefix IRI
    const prefix = Object.entries( NS )
      .find( ([_, namespace]) => iri.startsWith( namespace ) );

    if( prefix ) {
      return `${prefix[0]}:${iri.replace( prefix[1], '' )}`;
    } else {
      return `<${iri}>`;
    }

  } else {

    // create blank node identifier, if there was none
    if( !blankNodes.has( c ) ) {
      blankNodes.set( c, `_:b${blankNodes.size}` );
    }

    // return memorizes identifier
    return blankNodes.get( c );

  }

}



/**
 * serialize a single constraint
 * @param   {Constraint}                    constraint
 * @returns {Array<string>}
 */
function serializeConstraint( constraint ) {
  const result = [];

  if( constraint.getLabel() ) {
    result.push( `${PADDING} rdfs:label "${constraint.getLabel()}" ;` );
  }

  if( constraint.getComment() ) {
    result.push( `${PADDING} rdfs:comment """${constraint.getComment()}""" ;` );
  }

  result.push( `${PADDING} iop:constrains ${constraint.getEntities().map( (e) => getId( e ))} ;` );

  result.push(']');
  return '[ a iop:Constraint ;\n' +
    result
      .map( (line) => PADDING + PADDING + line )
      .join( '\n' );

}
