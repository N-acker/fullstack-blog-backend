import fs from 'fs'; //this is what we're gonna do to load our credentials.json file to set up our firebase-admin package 
import path from 'path';
import admin from 'firebase-admin';
import express from 'express';
import 'dotenv/config';
import { db, connectToDb } from './db.js';

// will replace the article info below with an actual database later
// this is basically an in-memory datbase that'll be replaced with mongodb
// let articlesInfo = [{ 
//         name:'learn-react',
//         upvotes: 0,
//         comments: [],
//     }, {
//         name: 'learn-node',
//         upvotes: 0,
//         comments: [],
//     }, {
//         name: 'mongodb',
//         upvotes: 0,
//         comments: [],
//     }]
/*after installing our mongodb data base into our project we can now */

// the below 3 lines are used for hosting our app
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// this is where we're gonna set up our firebase-admin package on our node server
// below we've loaded our credentials
const credentials = JSON.parse(
    fs.readFileSync('./credentials.json')
);

// here we're initializing our firebase admin package on our server and connecting it to our firebase project 
// we're basically telling the firebase admin package what credentials to use in order to connect to our project
// now we have firebase admin aded to our backend and we also have credentials that allow it to verify users that make requests to our servers
// this verification allows users to only make upvotes once and allows users who are logged in to add comments 
admin.initializeApp({
    credential: admin.credential.cert(credentials),
});

// this creates a new express app for us 
/* now that we have our app we can define different endpoints as well as what
 we want our server to do when one of those endpoints receives a request*/
const app = express();
app.use(express.json());
/* the line above basically tells express that whenever it receives a request that has a JSON body
or JSON payload it's going to parse that and automatically make it available to us on req.body just
like in our post request*/

app.use(express.static(path.join(__dirname, '../build'))); //for hosting our app

// below we're adding a route handler specifically for when we receive a request that isn't to one of our API routes
/*whenever our browser sends a request to our server that isn't going to the api route, we're gonna send back the 
index.html file which will take care of loading our react script and erndering our react app; now we can run our server and 
access our react app simply by sending a request to our server */
app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.join(__dirname, '../build/index.html'));
})

/* we will make it so that when our app receives a GET request on an endpoint /hello
it will simply respopnd wih a message saying hello*/

// app.get indicates the type of request aka GET request
/* app.get() takes in 2 arguments, the first is gonna be the apth/route that we want 
to listen for and the second is a callback that is called whenever the server receives
a request*/
/*the call back has 2 main arguments, the first is a request object that receives details 
about the request that we received and the second is a response object that we can send
back to whoever sent the request*/


// app.get('/hello/:name/goodbye/:otherName', (req, res) => {
//     // this lets us send back a response 
//     //const name = req.params.name; or we can use a shorter version with object destructuring 
//     console.log(req.params);
//     const {name} = req.params;
//     res.send(`Hello ${name}!!`); //this sends a response back to the server
//     /* as we see in this case the request body has nothing to do with the respopnse, 
//     we get the name form the URL itself*/
// });


// this is an endpoint that responds to POST requests 
// app.post('/hello', (req, res) => {
//     // this lets us send back a response 
//     // in order for req.body to work we need to do add the app.use just like at the top
//     /* if we don't have the app.use it will display undefined in the terminal when we 
//     make the request on postman; if I do write app.use then the request body will
//     be outputted in the terminal when we console.log(req.body)*/
// req just means reques, we can request from the body using req.body or from the url using req.params
//     // console.log(req.body);
//     // below sends Hello and the JSON body name that was sent to the server 
//     res.send(`Hello ${req.body.name}!`);
// });

/*-----------------------------------THIS PART IS FOR ADDING THE MIDDLEWARE LIKE AUTH TOKENS TO AN EXPRESS APP---------------------------------------------------------------------*/
// we call next when we're done processing things in the middleware and then we want the program to go to the actual route handlers below i.e. the app.get, app.post, etc.
// this is how we load the user automatically from the authtoken they've included with their headers 
// after doing this we go to each of the route handlers and incoroprate this function in order to verify who exactly is making the request 
// this is how our client proves they're logged into our server 
app.use(async (req, res, next) => {
    const { authtoken } = req.headers; //we're getting the auth tokens from the client side 

    if(authtoken){

        try{
            // using firebase auth aka the admin.itializeApp part to take the authtoken above and load the corresponding firebase user for that token
        req.user = await admin.auth().verifyIdToken(authtoken); // verifies auth token is valid and loads the corresponding user for that authtoken
        }catch (e){
            return res.sendStatus(400); // we add return to prevent next from being called if there is an error
        }    
    }

    req.user = req.user || {}; //to provide default value for request.user if an authtoken wasn't included aka if user wasn't signed in 

    next();  // this is in order to make sure the program execution moves to the route handlers below 
});


/*--------------------------------------------------------------THIS PART IS THE SECTION USED FOR RETURNING ARTICLES TO THE CLIENT  BY NAME ------------------------------------------*/



// This is a new endpoint that allows our client side to load the info for a given article 
// our article page is gonna need how many upvotes an article has and what comments that article has
// this endpoint allows our front end to request the server to send an article from the backend 
// our backend analyzes the request and pulls the article from our database and sends it back
app.get('/api/articles/:name', async (req, res) => {

    const {name} = req.params;
    const { uid } = req.user; //the id property on firebase users is called uid
    
    // now we are going to make an article load by its name
    // we use findOne in node compared to the findMany in mongosh; allows us to retreive one instead of many
    const article = await db.collection('articles').findOne({name});

    // we will only send the article to the client if it's in the database 
    // if the article doesn' exist send 404 implying article wasn't found
    if(article){
        // here we send it back to the client 
        // we use res.json instead of res.send since we are sending json instead of strings allowing for correct documents headers 
        // we're also gonna check if the user with the uid already upvoted on the article already; basically we're checking if the uid is inside the upvoteIds property 
        const upvoteIds = article.upvoteIds || []; // we added the empty array default value since there is a chance that the proprty won't exist in these articles since there's nothing currently in the database 
        article.canUpvote = uid && !upvoteIds.includes(uid); //making sure that the uid isn't already in upvoteIds property of our article and setting that property on the data we're sending back to client side
        res.json(article);
    }else{
        res.sendStatus(404).send('Article not found');
    }

    
});

/*--------------------WE ARE ADDING ADDITIONAL MIDDLEWARE THAT APPLY TO THE 2 ROUTE HANDLERS (ENDPOINTS) BELOW AKA THE PUT AND POST REQUEST---------------------------------*/
//if the user isn't already logged in, we don't want the user to make requests to either endpoints 
//prevents user from making requests to either of the endpoints/routehandlers below if the user isn't logged in

app.use((req, res, next) => {
    if(req.user){ //if the user exists and has included the authtoken with their request 
        next(); //goes to request handlers aka endpoints below 
    }else{
        res.sendStatus(401); //indicates user isn't allowed to access that resource 
    }
});

/*--------------------------------------------------------------THIS PART IS THE SECTION USED FOR UPVOTING ARTICLES ------------------------------------------*/
// this is the first endpoint that we've created for our project
// based on the value of the url paramater we need to figure out what article we need to upvote 
// once we figured out which article to upvote, we need to increment # of votes in the database 
// we are also gonna refactor this endpoint to only allow users who haven't upvoted the article
// in terms of this endpoint and the one below; if the user isn't already logged in, we don't want the user to make requests to either endpoints 
app.put('/api/articles/:name/upvote', async (req, res) => {

    // we use the line below to get the name URL parameter in the URL
    const {name} = req.params;
    const {uid} = req.user;
    // below we are tryinhg to find the corresponding article with the name we got above
    // articleInfo refers to our memory databse 
    // basically we want to get the article we want to upvate
    // const article = articlesInfo.find(a => a.name === name);
    // basically we are doing the same thing above as below but we are doing it with our mongodb


    // now we are going to make an article load by its name
    // we use findOne in node compared to the findMany in mongosh; allows us to retreive one instead of many
    const article = await db.collection('articles').findOne({name});

    // we will only send the article to the client if it's in the database 
    // this makes sure the article actually exists 
    if(article){
        // here we send it back to the client 
        // we use res.json instead of res.send since we are sending json instead of strings allowing for correct documents headers 
        // we're also gonna check if the user with the uid already upvoted on the article already; basically we're checking if the uid is inside the upvoteIds property 
        const upvoteIds = article.upvoteIds || []; // we added the empty array default value since there is a chance that the proprty won't exist in these articles since there's nothing currently in the database 
        const canUpvote = uid && !upvoteIds.includes(uid); //making sure that the uid isn't already in upvoteIds property of our article and setting that property on the data we're sending back to client side

        if(canUpvote){ //only if the user is allowed to upvote will we make changes to the database
             // below we are getting the article by it's name and incrementing its upvote by 1
            // THIS PART IS USED FOR UPDATING THE UPVOTE PROPERTY
            await db.collection('articles').updateOne({name}, {
                $inc: {upvotes: 1},
                $push: {upvoteIds: uid}, //this is how we add elements to arrays in mongoDB
            });
        }
        
   

        // now we are going to make an article load by its name
        // we use findOne in node compared to the findMany in mongosh; allows us to retreive one instead of many
        // THIS PART IS USED FOR SENDING OUR RESPONSE BACK TO THE CLIENT
        const updatedArticle = await db.collection('articles').findOne({name});


        // console.log(article.name);
        
   
        // after getting the aricle we want to upvote we increment the upvote property 
        // article.upvotes += 1;
        // here we are sending a response back to the client letting them know how many upvotes the article now has 
        // res.send(`The ${name} article now has ${article.upvotes} upvote(s)!!!`);
        res.json(updatedArticle);
        // above we're sending the article page so that the front-end can have access to the updated article
    } else{
        res.send ('That article doesn\'t exist');
    }
});


/*----------------------------------------------------------------THIS IS THE SECTION FOR ADDING COMMMENTS TO ARTICLES -------------------------------------------*/
// we are creating a post request since we're creating new comments 
//if the user isn't already logged in, we don't want the user to make requests to endpoint
app.post('/api/articles/:name/comments', async (req, res) => {
    
// here we will working with the request body as well
// the incoming request body will have 2 properties called postedBy containing the name and text with the comment 

    const {name} = req.params;
    const {text}= req.body;
    const {email} = req.user; // this fire base user object has an email property that is just an email that the user signed up with 

    // this searches for the articles in the database 
    // const article = articlesInfo.find(a => a.name === name);

     // basically we are doing the same thing above as below but we are doing it with our mongodb
    

    // this is how we add new comments to the article
     await db.collection('articles').updateOne({name}, {
        // we are saying that we want to push onto the comments property this new object defined by {postedBy, text}
        // the postedBy property that we're inserting into the database is set equal to the email address 
        $push: {comments: {postedBy: email, text}},
    });

     // now we are going to make an article load by its name
    // we use findOne in node compared to the findMany in mongosh; allows us to retreive one instead of many
    // THIS PART IS USED FOR SENDING OUR RESPONSE BACK TO THE CLIENT
    const article = await db.collection('articles').findOne({name}); //the updated article is sent to the user 

    // if the article exists we're going to push he article comments onto the article array
    if(article){
        // here we're are pushing the comments 
        // articlesInfo[articleName]. comments.push( username, text ); -> basically the template to push comments
        // article.comments.push({postedBy, text});
        // here we're sending back the entire array of comments to the article to show that the post was successful 
        // res.send(article.comments);
        res.json(article);
    }else{
        res.send('That article doesn\'t exist!');
    }
    
});




// here we are simply telling our server to lisen 
/* this funciton takes an argument to specify which port we should listen on and it also takes
a callback that gets called back one the server is listening but we usually use this to log out 
a message to the console to indicate that the server is listening*/
// we then run our server by writing in the terminal node src/server.js
/*If we open up the browser and write http://localhost:8000/hello then we will be brought to a 
page that says our output Hello!*/
// we connect to db by using the call back connectToDB as shwon below
// our server won't even start up entil we've connected to the database 

const PORT = process.env.PORT || 8000;

connectToDb(() => {
    console.log('You have successfully connected to the database!');
   app.listen(PORT, () => {
    console.log('Server is listening on port ' + PORT);
    });
})
