import { Concept, Constraint, Entity, Property, Variable } from './models.js';

/**
 * @returns {Variable}
 */
export default function parseJSONLD( data ) {

  // parse main variable content
  const variable = new Variable({
    iri: data['@id'],
    label: {
      '': data['label']
    },
    comment: {
      '': data['comment']
    },
  });

  // parse components
  let ent = parseConcept( data['property'], Property );
  const lookup = {};
  if (ent) {
    variable.setProperty( ent );
  }
  ent = parseConcept( data['ooi'], Entity );
  if (ent) {
    variable.setObjectOfInterest( ent );
    lookup[ ent.getIri() ] = ent;
  }
  ent = parseConcept( data['matrix'], Entity );
  if (ent) {
    variable.setMatrix( ent );
    lookup[ ent.getIri() ] = ent;
  }
  if( data['context'] ) {
    for( const d of data['context'] ) {
      ent = parseConcept( d, Entity );
      variable.addContextObject( ent );
      lookup[ ent.getIri() ] = ent;
    }
  }

  // parse constraints
  if( data['constraint'] ) {
    for( const c of data['constraint'] ) {
      let { constraint, entities } = parseConstraint( c );
      entities = entities.map( (e) => lookup[e] );
      variable.addConstraint( constraint, ... entities );
    }
  }

  return variable;
}



function parseConcept( data, Type ) {

  // no data given
  if (!data) {
    return;
  }

  return new Type({
    iri: data['@id'],
    label: {
      '': data['label']
    },
    comment: {
      '': data['comment']
    },
  });

}


function parseConstraint( data ) {

  // no data given
  if (!data) {
    return;
  }

  return {
    constraint: new Constraint({
      iri: data['@id'],
      label: {
        '': data['label']
      },
      comment: {
        '': data['comment']
      },
    }),
    entities: data['constrains'],
  };

}