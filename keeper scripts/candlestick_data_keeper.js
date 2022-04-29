/**
 * Triggered from a message on a Cloud Pub/Sub topic.
 *
 * @param {!Object} event Event payload.
 * @param {!Object} context Metadata for the event.
 */

 const { parseEther } = require("@ethersproject/units");
 const { newKit } = require("@celo/contractkit");
 const axios = require('axios');
 const CandlestickDataFeed = require("./CandlestickDataFeed.json");
 
 exports.updateData = async (event, context) => {
   let date = new Date();
   let year = date.toLocaleString('en-GB', {year: 'numeric',   hour12: false, timeZone: 'UTC' });
   let month = date.toLocaleString('en-GB', {month: '2-digit',   hour12: false, timeZone: 'UTC' });
   let day = date.toLocaleString('en-GB', {day: '2-digit',   hour12: false, timeZone: 'UTC' });
 
   let currentDate = year + "-" + month + "-" + day;
   let ticker = "X:" + process.env.SYMBOL + "USD";
 
   let isValid = false;
   let candlesticks;
   var cloud = axios.default.create({});
   let url = process.env.BASE_URL + ticker + "/range/1/minute/" + currentDate + "/" + currentDate + "?adjusted=true&sort=desc&limit=1&apiKey=" + process.env.API_KEY;
   
   try 
   {
     let res = await cloud.get(url).then(function (data) {
       console.log("Getting data.");
       candlesticks = data.data.results;
       console.log(candlesticks);
 
       if (candlesticks.length > 0)
       {
         isValid = true;
       }
       console.log("Retrieved data.");
     });
   } 
   catch (err) {}
 
   if (isValid)
   {
     console.log("Parsing candlesticks.");
     let currentCandlestick = candlesticks[0];
     let high = parseEther(currentCandlestick.h.toString());
     let low = parseEther(currentCandlestick.l.toString());
     let close = parseEther(currentCandlestick.c.toString());
     let open = parseEther(currentCandlestick.o.toString());
     let volume = parseEther(currentCandlestick.v.toString());
     let timestamp = currentCandlestick.t / 1000;
 
     let kit = newKit("https://alfajores-forno.celo-testnet.org");
     kit.connection.addAccount(process.env.PRIVATE_KEY);
     let dataFeed = new kit.web3.eth.Contract(
       CandlestickDataFeed,
       process.env.CONTRACT_ADDRESS
     );
 
     console.log("Parsed candlesticks.");
 
     try
     {
       console.log("Updating candlesticks.");
       let txo = await dataFeed.methods.updateData(high, low, open, close, volume, timestamp);
       await kit.sendTransactionObject(txo, { from: process.env.DATA_PROVIDER_ADDRESS });
     }
     catch (err)
     {
       console.log("Cannot update data.".red, err.message);
     }
   }
   else
   {
     console.log("No candlesticks.");
   }
 };