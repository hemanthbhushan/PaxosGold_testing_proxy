const { expect } = require("chai");
const { ethers, network } = require("hardhat");


describe("PAXGImplementation contract",()=>{
    let  paxg,paxgProxy,ownerA,signer1,signer2,proxy,signer;

    beforeEach(async()=>{
      [_,ownerA,admin,signer1,signer2] = await ethers.getSigners();
      const Paxg = await ethers.getContractFactory("PAXGImplementation",ownerA.address);
      paxg = await Paxg.deploy();
      const Proxy = await ethers.getContractFactory("AdminUpgradeabilityProxy",admin.address);
      proxy = await Proxy.deploy(paxg.address);
      paxgProxy =   Paxg.attach(proxy.address);

})
describe("testing PAXG implementation",()=>{
  it("initialize will get reverted",async ()=>{
      //already called in the constructor while deployment 
      expect(paxgProxy.initialize()).to.be.revertedWith("already initialized");
   })
it("checking symbol and name ",async ()=>{
  const name = await  paxgProxy.connect(signer1).name();
   
  
  const symbol = await  paxgProxy.connect(signer1).symbol();
  //in proxy we need to initialize the function initialize cuz proxy the constructor doesnt work
  await paxgProxy.connect(ownerA).initialize();
  const owner1 = await paxgProxy.connect(signer1).owner();
  expect(await paxgProxy.connect(signer1).supplyController()).to.equal(ownerA.address);
  expect(await paxgProxy.connect(signer1).feeController()).to.equal(ownerA.address);
  expect(await paxgProxy.feeRecipient()).to.equal(ownerA.address);
  expect(owner1).to.equal(ownerA.address);
  expect(name).to.equal("Paxos Gold");
  expect(symbol).to.equal("PAXG");

})
it("check the ")


})
})


