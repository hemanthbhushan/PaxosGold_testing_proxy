const { expect } = require("chai");
const { ethers, network } = require("hardhat");


describe("PAXGImplementation contract",()=>{
    let  paxg,paxgProxy,owner,signer1,signer2,proxy;

    beforeEach(async()=>{
      [admin,owner,signer1,signer2] = await ethers.getSigners();
      const Paxg = await ethers.getContractFactory("PAXGImplementation",owner.address);
      paxg = await Paxg.deploy();
      const Proxy = await ethers.getContractFactory("AdminUpgradeabilityProxy");
      proxy = await Proxy.deploy(paxg.address);
      paxgProxy =   Paxg.attach(proxy.address);

})
describe("testing PAXG implementation",()=>{
  it("initialize will get reverted",async ()=>{
      //already called in the constructor while deployment 
      expect(paxgProxy.initialize()).to.be.revertedWith("already initialized");
   })
it("checking symbol and name ",async ()=>{
  const name = await  paxgProxy.name();
    // expect(name).to.equal("Paxos Gold");
  
  const symbol = await  paxgProxy.symbol();
  const owner1 = await paxgProxy.owner();
  expect(await paxgProxy.supplyController()).to.equal(owner.address);
  // expect(await paxgProxy.feeController()).to.equal(owner.address);
  // expect(await paxgProxy.feeRecipient()).to.equal(owner.address);
  // expect(owner1).to.equal(owner.address);
  // expect(name).to.equal("Paxos Gold");
  // expect(symbol).to.equal("PAXG");

})


})
})


