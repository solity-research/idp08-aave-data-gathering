const Web3 = require("web3")
 
// BELOW CODES WILL BE RESTRUCTURED TO BE MORE READABLE

//HTTP PROVIDER FOR ETHEREUM MAINNET
const web3 = new Web3("https://ethereum.publicnode.com");
// HTTP PROVIDER FOR POLYGON MAIINET
//const web3 = new Web3("https://rpc.ankr.com/polygon");
// HTTP PROVIDER FOR AVALANCHE MAIINET
//const web3 = new Web3("https://rpc.ankr.com/avalanche");

//standard erc20 abi
const erc20ABI = require('./erc-20-standard-abi.json'); // ABI for ERC20

// aaave protocol v2 lending pool abi for ETHEREUM mainnet
const lendingPoolABI = require('./aave-abi-lending-pool-v2.json'); // ABI for AAVE v2 Lending Pool
// aaave protocol v2 lending pool abi for POLYGON mainnet
//const lendingPoolABI = require('./aave-abi-lending-pool-v2-polygon-market.json'); // ABI for POLYGON AAVE v2 Lending Pool
// aaave protocol v2 lending pool abi for AVALANCHE mainnet
//const lendingPoolABI = require('./aave-abi-lending-pool-v2-avalanche-market.json'); // ABI for AVALANCHE AAVE v2 Lending Pool


//aave protocol data provider abi for ETHEREUM mainnet
const aaveABI = require('./aave-abi.json'); // ABI for AAVE v2 Protocol Data Provider
// aave protocol data provider abi for POLYGON mainnet
//const aaveABI = require('./aave-abi-polygon-market.json'); // ABI for POLYGON AAVE v2 Protocol Data Provider
// aave protocol data provider abi for AVALANCHE mainnet
//const aaveABI = require('./aave-abi-avalanche-market.json'); // ABI for AVALANCHE AAVE v2 Protocol Data Provider

// aave protocol lending pool address for ETHEREUM mainnet
const lendingPoolAddress = "0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9";
// aave protocol lending pool address for POLYGON mainnet
//const lendingPoolAddress = "0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf";
// aave protocol lending pool address for AVALANCHE mainnet
//const lendingPoolAddress = "0x4F01AeD16D97E3aB5ab2B501154DC9bb0F1A5A2C";

//aave protocol data provider address for ETHEREUM mainnet
const aaveAddress = "0x057835Ad21a177dbdd3090bB1CAE03EaCF78Fc6d";
//aave protocol data provider address for POLYGON mainnet
//const aaveAddress = "0x7551b5D2763519d4e37e8B81929D336De671d46d";
//aave protocol data provider address for AVALANCHE mainnet
//const aaveAddress = "0x65285E9dfab318f57051ab2b139ccCf232945451";


//DAI address for ethereum mainnet
const daiAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F"; // DAI
// USDT address for ethereum mainnet
const usdtAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7"; // USDT



const address_Chainlink_Price_Feed = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";
const ChainlinkABI = require('./chainlink_oracle.json');



const aaveContract = new web3.eth.Contract(aaveABI, aaveAddress);
const LendingPool = new web3.eth.Contract(lendingPoolABI, lendingPoolAddress);

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

async function getAPYofEachAsset() {
  try {
    const reservesData = await aaveContract.methods.getAllReservesTokens().call();
    
    const promises = reservesData.map(async (reserveData) => {
    //console.log("reserve Data", reserveData);
    const apyData =  await getAPYforOneAsset(reserveData.tokenAddress);
    const [depositAPY, variableBorrowAPY, stableBorrowAPY] = apyData;
    console.log("------------------------------------------------");
    console.log(reserveData.symbol, depositAPY, variableBorrowAPY, stableBorrowAPY);  
    console.log("------------------------------------------------");
    const parsedData = {
      symbol: reserveData.symbol,
      depositAPY: depositAPY,
      variableBorrowAPY: variableBorrowAPY,
      stableBorrowAPY: stableBorrowAPY
    };
  
    return parsedData;
  
  });
    
    const results = await Promise.all(promises);
    console.log(results);
    return results;
    
  } catch (error) {
    console.log("Error: " + error);
  }  
}

async function getAPYforOneAsset(_assetAddress) {
  
 try {
  const reserveData = await LendingPool.methods.getReserveData(_assetAddress).call();
  //console.log("Reserve Data",reserveData);
  const liquidityIndex = reserveData.liquidityIndex;
  const variableBorrowIndex = reserveData.variableBorrowIndex;
  const currentLiquidityRate = reserveData.currentLiquidityRate;
  const currentVariableBorrowRate = reserveData.currentVariableBorrowRate;
  const currentStableBorrowRate = reserveData.currentStableBorrowRate;
  // console.log("------------------------------------------------");
  // console.log(currentLiquidityRate, currentVariableBorrowRate, currentStableBorrowRate);
  // console.log("------------------------------------------------");
  const aTokenAddress = reserveData.aTokenAddress;
  const stableDebtTokenAddress = reserveData.stableDebtTokenAddress;
  const variableDebtTokenAddress = reserveData.variableDebtTokenAddress;

  const RAY = 10**27; // 10 to the power 27
  const SECONDS_PER_YEAR = 31536000;

// Deposit and Borrow calculations
// APY and APR are returned here as decimals, multiply by 100 to get the percents

const depositAPR = currentLiquidityRate/RAY;
const variableBorrowAPR = currentVariableBorrowRate/RAY;
const stableBorrowAPR = currentStableBorrowRate/RAY;

const depositAPY = (((1 + (depositAPR / SECONDS_PER_YEAR)) ** SECONDS_PER_YEAR) - 1)*100;
const variableBorrowAPY = (((1 + (variableBorrowAPR / SECONDS_PER_YEAR)) ** SECONDS_PER_YEAR) - 1)*100;
const stableBorrowAPY = (((1 + (stableBorrowAPR / SECONDS_PER_YEAR)) ** SECONDS_PER_YEAR) - 1)*100;
// console.log("Deposit APY: " + depositAPY);
// console.log("Variable Borrow APY: " + variableBorrowAPY);
// console.log("Stable Borrow APY: " + stableBorrowAPY);
return [depositAPY, variableBorrowAPY, stableBorrowAPY];
 
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

async function getTotalSupply() {

  const reserves = await aaveContract.methods.getAllATokens().call();
  //console.log("Reserves: ", reserves);
  for (const reserve of reserves) {
    const ATokenContract = new web3.eth.Contract(erc20ABI, reserve.tokenAddress);
    const totalSupply = await ATokenContract.methods.totalSupply().call();
    console.log("Reserve: ", reserve.symbol);
    console.log("Total Supply: ", totalSupply);
    //const reserveData = await aaveContract.methods.getReserveData(reserve.tokenAddress).call();
    //console.log("Reserve Data: ", reserveData);

  }

}

async function getTotalBorrow() {
  
    const reserves = await aaveContract.methods.getAllReservesTokens().call();
    //console.log("Reserves: ", reserves);
    for (const reserve of reserves) {
      const reserveData = await LendingPool.methods.getReserveData(reserve.tokenAddress).call();
      //console.log("Reserve: ", reserve.symbol);
      console.log("reserveData", reserveData);
      const stableDebtTokenContract = new web3.eth.Contract(erc20ABI, reserveData.stableDebtTokenAddress);
     const stableDebtTotalSupply = await stableDebtTokenContract.methods.totalSupply().call();
      console.log("stableDebtTokenContract Total Supply", stableDebtTotalSupply);
      const variableDebtTokenContract = new web3.eth.Contract(erc20ABI, reserveData.variableDebtTokenAddress);
      const variableDebtTotalSupply = await variableDebtTokenContract.methods.totalSupply().call();
      console.log("variableDebtTokenContract Total Supply", variableDebtTotalSupply);
      const totalBorrow = Number(stableDebtTotalSupply) + Number(variableDebtTotalSupply);      
      console.log("Total Borrow: ", totalBorrow);
  
    }
   
}

async function getTotalBorrowSecondWay() {
  
  const reserves = await aaveContract.methods.getAllReservesTokens().call();
  //console.log("Reserves: ", reserves);
  for (const reserve of reserves) {
    const reserveData = await aaveContract.methods.getReserveData(reserve.tokenAddress).call();
    console.log("Reserve: ", reserve.symbol);
    console.log("reserveData", reserveData);
    

  }

}


  async function main(){
      //const result = await getReserveData(assetAddress);
      //getTotalSupply(); // it is working fine
      //getTotalBorrow(); // it is working fine
      getTotalBorrowSecondWay(); // it is working fine
     //const reservesData = await aaveContract.methods.getAllReservesTokens().call();
     //console.log(reservesData);
    //getSupplyBorrowAssets(); // it is working fine
    //getAPYofEachAsset();   // it is working fine
      //  getAPYforOneAsset(usdtAddress);
      //  getAPYforOneAsset(daiAddress);

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