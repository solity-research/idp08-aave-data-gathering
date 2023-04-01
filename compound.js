const Web3 = require("web3");
const web3 = new Web3("https://ethereum.publicnode.com");
const compoundABI = require('./compound-abi.json');
const compoundAddress = "0xc00e94Cb662C3520282E6f5717214004A7f26888"; // Compound v2
const assetAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F"; // DAI

const compoundContract = new web3.eth.Contract(compoundABI, compoundAddress);

async function getTVL() {
  try {
    const cToken = await compoundContract.methods.cToken(assetAddress).call();
    const tokenData = await compoundContract.methods.getUnderlyingBalance(cToken).call();
    const totalValueLocked = Number(web3.utils.fromWei(tokenData, "ether"));
    console.log(`Total value locked in Compound: ${totalValueLocked} ETH`);
    return totalValueLocked;
  } catch (error) {
    console.log("Error: " + error);
  }
}

async function main(){
  const result = await getTVL();
  console.log("Result: " + result);
}

main();
