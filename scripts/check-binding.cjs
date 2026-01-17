try {
    const binding = require('./node_modules/better-sqlite3/build/Release/better_sqlite3.node');
    console.log('SUCCESS: Loaded with system Node (137). Binding is version 137.');
} catch (e) {
    console.log('FAILURE: Could not load with system Node.');
    console.log(e.message);
}
