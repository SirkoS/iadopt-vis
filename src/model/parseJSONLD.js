import { Concept, Constraint, Entity, Variable } from './models.js';

/**
 * @returns {Variable}
 */
export default function parse ( data ) {

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
  let ent = parseEntity( data['property'] );
  const lookup = {};
  if (ent) {
    variable.setProperty( ent );
  }
  ent = parseEntity( data['ooi'] );
  if (ent) {
    variable.setObjectOfInterest( ent );
    lookup[ ent.getIri() ] = ent;
  }
  ent = parseEntity( data['matrix'] );
  if (ent) {
    variable.setMatrix( ent );
    lookup[ ent.getIri() ] = ent;
  }
  if( data['context'] ) {
    for( const d of data['context'] ) {
      ent = parseEntity(d);
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



function parseEntity( data ) {

  // no data given
  if (!data) {
    return;
  }

  return new Entity({
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