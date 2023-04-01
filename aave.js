const Web3 = require("web3")
 
// BELOW CODES WILL BE RESTRUCTURED TO BE MORE READABLE

//HTTP PROVIDER FOR ETHEREUM MAINNET
const web3 = new Web3("https://ethereum.publicnode.com");
// HTTP PROVIDER FOR POLYGON MAIINET
//const web3 = new Web3("https://rpc.ankr.com/polygon");
// HTTP PROVIDER FOR AVALANCHE MAIINET
//const web3 = new Web3("https://rpc.ankr.com/avalanche");

//aave protocol data provider abi for ETHEREUM mainnet
const aaveABI = require('./aave-abi.json'); // ABI for AAVE v2 Protocol Data Provider
// aave protocol data provider abi for POLYGON mainnet
//const aaveABI = require('./aave-abi-polygon-market.json'); // ABI for POLYGON AAVE v2 Protocol Data Provider
// aave protocol data provider abi for AVALANCHE mainnet
//const aaveABI = require('./aave-abi-avalanche-market.json'); // ABI for AVALANCHE AAVE v2 Protocol Data Provider

//aave protocol data provider address for ETHEREUM mainnet
const aaveAddress = "0x057835Ad21a177dbdd3090bB1CAE03EaCF78Fc6d";
//aave protocol data provider address for POLYGON mainnet
//const aaveAddress = "0x7551b5D2763519d4e37e8B81929D336De671d46d";
//aave protocol data provider address for AVALANCHE mainnet
//const aaveAddress = "0x65285E9dfab318f57051ab2b139ccCf232945451";


//DAI address for ethereum mainnet
const assetAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F"; // DAI



const address_Chainlink_Price_Feed = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";
const ChainlinkABI = require('./chainlink_oracle.json');



const aaveContract = new web3.eth.Contract(aaveABI, aaveAddress);
const priceFeed = new web3.eth.Contract(ChainlinkABI, address_Chainlink_Price_Feed);


async function getTVL() {
  try {
    const reservesData = await aaveContract.methods.getAllReservesTokens().call();
    const promises = reservesData.map(async (reserveData) => {
    return getReserveData(reserveData.tokenAddress);
    });
    
    const results = await Promise.all(promises);
    const totalValueLocked = results.reduce((a, b) => a + b, 0);
    console.log(`Total value locked in Aave: ${totalValueLocked} ETH`);
    //var ethUsd = await getETHUSD();
    return totalValueLocked; //* ethUsd;
  } catch (error) {
    console.log("Error: " + error);
  }  
}


  async function getReserveData(assetAddress) {   
    try {
      const result = await aaveContract.methods.getReserveData(assetAddress).call();
      console.log(result);
      return result;
      // const totalValueLocked = Number(await web3.utils.fromWei(result.availableLiquidity, 'ether'));
      // console.log(`Total value locked in Aave: ${totalValueLocked} ETH`);
      // return totalValueLocked;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async function getSupplyBorrowAssets() {
    const reserves = await aaveContract.methods.getAllReservesTokens().call();

  // We get the reserve data for each reserve 
  const reserveDataPromises = reserves.map(async reserve => {
    const reserveData = await aaveContract.methods.getReserveData(reserve.tokenAddress).call();

    // Parse them to make it seem more readable
    const parsedData = {
      
      symbol: reserve.symbol,
      tokenAddress: reserve.tokenAddress,
      liquidityRate: web3.utils.fromWei(reserveData.liquidityRate),
      variableBorrowRate: web3.utils.fromWei(reserveData.variableBorrowRate),
      stableBorrowRate: web3.utils.fromWei(reserveData.stableBorrowRate),
      };

    return parsedData;
  });

  // Wait for all the reserve data promises to resolve
  const reserveData = await Promise.all(reserveDataPromises);

  const supplyAssets = reserveData.filter(reserve => reserve.liquidityRate !== '0');
  const borrowAssets = reserveData.filter(reserve => reserve.variableBorrowRate !== '0' || reserve.stableBorrowRate !== '0');

  console.log('Supply assets:', supplyAssets);
  console.log("***************************************");
  console.log("***************************************");
  console.log("***************************************");
  console.log('Borrow assets:', borrowAssets);

}

async function getTotalBorrowSupply() {

  const reserves = await aaveContract.methods.getAllATokens().call();
  first_Reserve_address = reserves[0].tokenAddress;
  result =  reserves[0].scaledTotalSupply();
  console.log("Result: " + result);
}


  async function main(){
      //const result = await getReserveData(assetAddress);
      //getTotalBorrowSupply();
     //const reservesData = await aaveContract.methods.getAllReservesTokens().call();
     //console.log(reservesData);
    getSupplyBorrowAssets();

     //console.log("Result new: " + (result+22));
    //const result = await getTVL();
    //console.log("Result: " + result);
  }


async function getETHUSD() {
 try {
  var roundData =  priceFeed.methods.latestRoundData().call();

  // Do something with roundData
  const priceData = roundData;
  ETHUSD = priceData.answer; 
  //console.log("Latest Round Data", roundData);
  //console.log("ETH/USD Price =", ETHUSD/10**8);
  ETHUSD = ETHUSD/10**8;
  return ETHUSD;
 } catch (error) {
  
 } 
  }

main();