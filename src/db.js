import { MongoClient } from 'mongodb';
// above are importing stuff from our mongo client package
// it's generally how we connect to the database 

let db;

// this is a some reusable module code that we can use throughout our server.js
// the cb variable represents our actual server callback function
async function connectToDb(cb){ //cb = call back


    // const client = new MongoClient('mongodb://127.0.0.1:27017');
    // below client has to connect; it's asynchronous which is why we need the await and async keywords
    // an async function allows operations to run seperate from main program allowing program to execute while program completes
    const client = new MongoClient(`mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster0.dlu0w.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`);
    await client.connect();
    // at this point our program is connected to our mongodb
    // below we select the specific database we made earlier 
    db = client.db('react-blog-db');
    cb();
}

export {
    db,
    connectToDb,
};