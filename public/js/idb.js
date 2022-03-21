const RECORD_NAME = 'entry';
const apiPath = '/api/transaction';
const requestOptions = ( body ) => {
  return {
    method: 'POST',
    body: JSON.stringify( body ),
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  };
};

// idb.js
// store connection to db
let db;
// establish connection
const request = indexedDB.open( 'budget', 1 );

// event listeners
// version change listener
request.onupgradeneeded = function ( e ) {
  // store ref to db
  const db = e.target.result;
  // create objStore
  db.createObjectStore( RECORD_NAME, { autoIncrement: true } );
};

request.onsuccess = function ( e ) {
  // global db
  db = e.target.result;

  // is app online?
  if ( navigator.onLine ) {
    // save records
    uploadEntry();
  }
};

// log error
request.onerror = function ( e ) {
  console.log( e.target.errorCode );
};

function saveRecord( record ) {
  const transaction = db.transaction( [ RECORD_NAME ], 'readwrite' );

  const entryObjStore = transaction.objectStore( RECORD_NAME );

  entryObjStore.add( record );
}

function uploadEntry() {
  // console.log( 'uploading record...' );
  const transaction = db.transaction( [ RECORD_NAME ], 'readwrite' );

  const entryObjStore = transaction.objectStore( 'entry' );

  const getAll = entryObjStore.getAll();

  getAll.onsuccess = function () {
    if ( getAll.result.length > 0 )
      fetch( apiPath, requestOptions( getAll.result ) )
        .then( response => response.json() )
        .then( serverResponse => {
          if ( serverResponse.message ) {
            throw new Error( serverResponse );
          }

          const transaction = db.transaction( [ RECORD_NAME ], 'readwrite' );
          const entryObjStore = transaction.objectStore( RECORD_NAME );

          entryObjStore.clear();
        } )
        .catch( err => {
          console.log( err );
        } );
  };
}

window.addEventListener( 'online', uploadEntry );