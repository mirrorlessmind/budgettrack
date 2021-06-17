let db;
let budgetVersion;
// create a new db request for a "budget" database.
const request = indexedDB.open("BudgetDB", budgetVersion || 21);

request.onupgradeneeded = function(event) {
    console.log("IndexDB upgrade needed");
  // create object store called "pending" and set autoIncrement to true
  const db = event.target.result;
  db.createObjectStore('pending', { autoIncrement: true });
  store.clear();
};

request.onsuccess = function(event) {
  db = event.target.result;

  // check if app is online before reading from db
  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function(event) {
  console.log(`Woops a doodle! ${event.target.errorCode}`);
};

function saveRecord(record) {
  // create a transaction on the pending db with readwrite access
  const transaction = db.transaction(['pending'], 'readwrite');

  // access your pending object store
  const store = transaction.objectStore('pending');

  // add record to your store with add method.
  store.add(record);
}

function checkDatabase() {
  
  const transaction = db.transaction(['pending'], 'readwrite');
  const store = transaction.objectStore('pending');
  const getAll = store.getAll();

  getAll.onsuccess = function() {
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then(response => response.json())
        .then(() => {
          const transaction = db.transaction(['pending'], 'readwrite');
          const store = transaction.objectStore('pending');
          store.clear();
        });
    }
  };
}

// listen for app coming back online
window.addEventListener('online', checkDatabase);