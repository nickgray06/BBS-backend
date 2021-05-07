const plaid = require('plaid')
const express = require('express')
const bodyParser = require('body-parser')
const dotenv = require('dotenv')
const app = express()
const cors = require('cors')

dotenv.config()

app.use(cors())

function handleError(errorMessage) {
  console.error(errorMessage)
}

const client = new plaid.Client({
  clientID: process.env.PLAID_CLIENT_ID,
  secret: process.env.PLAID_SECRET,
  env: plaid.environments.sandbox,
})


app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// // app.get('/', (req, res) => {
// //   res.json({
// //     message: "Hello World"
// //   })
// // })

app.use(express.json());

//get account balances
app.post('/accounts_balance', async (req, res) => {
  try{
    const response = await client.getBalance(req.body.access_token).catch((err) => {
      // handle error
      console.log(err);
    });
    //const accounts = response.accounts;
    res.json({
      accounts: response.accounts
    });
  }
  catch(e){
    console.log(e)
  }
});


//endpoint exchanges public token for an access token currently working on this part
app.post('/exchange_public_token', async (request, res, next) => {
  try{
  //public token cant be found
    const response = await client
    .exchangePublicToken(request.body.public_token)
    .catch((err) => {
      console.log(err)
    });
  const accessToken = response.access_token;
  const itemId = response.item_id;
  // ACCESS_TOKEN = response.access_token;
  // ITEM_ID = response.item_id;
  res.json({
    access_token: accessToken,
    item_id: itemId
  });
  console.log("access token below");
  console.log(accessToken);
  }
  catch(e){
    console.log(e)
  }
});

//endpoint returns link_token 
app.post('/create_link_token', async (request, response, next) => {
  try{
    // 1. Grab the client_user_id by searching for the current user in your database
    const user = "testUser"
    const clientUserId = "123";
    // 2. Create a link_token for the given user
    const linkTokenResponse = await client.createLinkToken({
      user: {
        client_user_id: clientUserId,
      },
      client_name: 'BBS',
      products: ['transactions'],
      country_codes: ['US'],
      language: 'en',
    });
    const link_token = linkTokenResponse.link_token;
    // 3. Send the data to the client
    response.json({ link_token });
  }
  catch(e){
    console.log(e)
  }
});

app.post('/get_access_token', async(req, res) => {
  //destructure publicToken in response data
  const {publicToken} = req.body
  const response = await client
    .exchangePublicToken(publicToken)
    .catch((err) => {
      if(!publicToken){
        return "no public token"
      }
    });
  const itemId = response.item_id;
  return res.send({access_token: response.access_token}) 
})

app.post('/transactions', async(req, res) =>{
  const {accessToken} = req.body
  const response = await client
  .getTransactions(accessToken, '2021-01-01', '2021-05-31', {
    count: 250,
    offset: 0,
  })
  .catch((err) => {
    if(!accessToken){
      return "no access token"
    }
  });
  const transactions = response.transactions
  console.log(transactions)
  return res.send({transactions: transactions}) 
})

app.post('/balances', async(req, res) => {
  const {accessToken} = req.body 
  const response = await client.getBalance(accessToken).catch((err) => {
    if(!accessToken){
      return "no access token"
    }
  });
  const accounts = response.accounts;
  return res.send({accounts: accounts})
})


app.listen(8080, () => console.log('Server started, Listening at localhost:8080'))