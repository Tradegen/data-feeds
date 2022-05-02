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
 const CandlestickDataFeedRegistry = require("./CandlestickDataFeedRegistry.json");
 
 async function update(timeframe) {
   let partial;
   let limit;
   if (timeframe == 1) {
     partial = "1/minute/";
     limit = "1";
   }
   else if (timeframe == 5) {
     partial = "5/minute/";
     limit = "5";
   }
   else if (timeframe == 60) {
     partial = "1/hour/";
     limit = "60";
   }
   else if (timeframe == 1440) {
     partial = "1/day/";
     limit = "1";
   }
   else {
     console.log("Unsupported timeframe: " + timeframe.toString());
     return;
   }
 
   let date = new Date();
   let year = date.toLocaleString('en-GB', {year: 'numeric',   hour12: false, timeZone: 'UTC' });
   let month = date.toLocaleString('en-GB', {month: '2-digit',   hour12: false, timeZone: 'UTC' });
   let day = date.toLocaleString('en-GB', {day: '2-digit',   hour12: false, timeZone: 'UTC' });
 
   let currentDate = year + "-" + month + "-" + day;
   let ticker = "X:" + process.env.SYMBOL + "USD";
 
   let isValid = false;
   let candlesticks;
   var cloud = axios.default.create({});
   let url = process.env.BASE_URL + ticker + "/range/" + partial + currentDate + "/" + currentDate + "?adjusted=true&sort=desc&limit=" + limit + "&apiKey=" + process.env.API_KEY;
 
   try 
   {
     let res = await cloud.get(url).then(function (data) {
       console.log("Getting data. " + timeframe.toString());
       candlesticks = data.data.results;
       console.log(candlesticks);
 
       if (candlesticks.length > 0)
       {
         isValid = true;
       }
       console.log("Retrieved data." + timeframe.toString());
     });
   } 
   catch (err) {}
 
   if (isValid)
   {
     console.log("Parsing candlesticks. " + timeframe.toString());
     let currentCandlestick = candlesticks[0];
     let high = parseEther(currentCandlestick.h.toString());
     let low = parseEther(currentCandlestick.l.toString());
     let close = parseEther(currentCandlestick.c.toString());
     let open = parseEther(currentCandlestick.o.toString());
     let volume = parseEther(currentCandlestick.v.toString());
     let timestamp = currentCandlestick.t / 1000;
 
     let contractAddress;
     if (timeframe == 1) {
       contractAddress = process.env.CONTRACT_ADDRESS_1_MIN;
     }
     else if (timeframe == 5) {
       contractAddress = process.env.CONTRACT_ADDRESS_5_MIN;
     }
     else if (timeframe == 60) {
       contractAddress = process.env.CONTRACT_ADDRESS_1_HOUR;
     }
     else if (timeframe == 1440) {
       contractAddress = process.env.CONTRACT_ADDRESS_1_DAY;
     }
 
     console.log("Parsed candlesticks. " + timeframe.toString());
 
     try
     {
       console.log("Updating candlesticks; 1-minute");
       const kit = newKit("https://alfajores-forno.celo-testnet.org");
       kit.connection.addAccount(process.env.PRIVATE_KEY);
 
       let dataFeed = new kit.web3.eth.Contract(
         CandlestickDataFeed,
         contractAddress
       );
 
       let txo = await dataFeed.methods.updateData(high, low, open, close, volume, timestamp);
       await kit.sendTransactionObject(txo, { from: process.env.DATA_PROVIDER_ADDRESS });
     }
     catch (err)
     {
       console.log("Cannot update data; " + timeframe.toString(), err.message);
     }
   }
   else
   {
     console.log("No candlesticks. " + timeframe.toString());
   }
 }
 
 exports.updateData = async (event, context) => {
   const kit = newKit("https://alfajores-forno.celo-testnet.org");
   kit.connection.addAccount(process.env.PRIVATE_KEY);
   let registry = new kit.web3.eth.Contract(
     CandlestickDataFeedRegistry,
     process.env.CONTRACT_ADDRESS_REGISTRY
   );
 
   // 5-minutes timeframe.
   let canUpdate5 = await registry.methods.canUpdate(process.env.SYMBOL, 5).call();
   // 1-hour timeframe.
   let canUpdate60 = await registry.methods.canUpdate(process.env.SYMBOL, 60).call();
   // 1-day timeframe.
   let canUpdate1440 = await registry.methods.canUpdate(process.env.SYMBOL, 1440).call();
 
   update(1);
 
   if (canUpdate5) {
     update(5);
   }
 
   if (canUpdate60) {
     update(60);
   }
 
   if (canUpdate1440) {
     update(1440);
   }
 };