const { inputToConfig } = require("@ethereum-waffle/compiler");
const { expect } = require("chai");
const { Signer } = require("ethers");
const { ethers, network } = require("hardhat");


describe("check",()=>{

  let owner,signer1,admin,proxy,impli,impliProxy,signer2;

 beforeEach(async ()=>{
  [owner,signer1,signer2,admin] = await ethers.getSigners();

  const Impli = await ethers.getContractFactory("PAXGImplementation",owner.address);

  const Proxy = await ethers.getContractFactory("AdminUpgradeabilityProxy",admin.address);

   impli = await Impli.deploy();
   proxy = await Proxy.connect(admin).deploy(impli.address);

   impliProxy =  impli.attach(proxy.address);
   await impliProxy.connect(owner).initialize();
  //  await impliProxy.connect(owner).pause();

 })

 it("checking the name ",async()=>{

   const name = await impliProxy.name();
   const synbol = await impliProxy.symbol();
   const owner1 = await impliProxy.owner();

   expect(await impliProxy.supplyController()).to.equal(owner.address);
   expect(await impliProxy.feeController()).to.equal(owner.address);
   expect(await impliProxy.feeRecipient()).to.equal(owner.address);
    expect(owner1).to.equal(owner.address);

   expect(name).to.equal("Paxos Gold");
   expect(synbol).to.equal("PAXG")
 })
//  ----------checking for the transfer(address _to, uint256 _value)

 it("checking the transfer function",async ()=>{
  await impliProxy.increaseSupply(100);
  expect(await impliProxy.balanceOf(owner.address)).to.equal(100);
  //initiall when the contract deployed it will be in a pause state only owner can upPause it by using the unpause function
 
  await impliProxy.transfer(signer1.address,10);
  expect(await impliProxy.balanceOf(owner.address)).to.equal(90);
  expect(await impliProxy.balanceOf(signer1.address)).to.equal(10);
})
it("checking the transfer function when paused ",async()=>{
  
  // await paxg.pause();
  //initiall when the contract deployed it will be in a pause state 
  expect(impliProxy.transfer(signer1.address,10)).to.be.revertedWith("whenNotPaused");

})
it("checking the transfer function when _to is address(0) ",async ()=>{
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
  expect(impliProxy.transfer(ZERO_ADDRESS,1)).to.be.revertedWith("cannot transfer to address zero");
})

it("checking the transfer function when frozen",async ()=>{

 await impliProxy.setAssetProtectionRole(owner.address);
 await impliProxy.freeze(signer1.address);
 expect(impliProxy.transfer(signer1.address,100)).to.be.revertedWith("address frozen");

 })
it("insufficient funds in the msg.sender in transfer function",async()=>{
  expect(impliProxy.transfer(signer1.address,1)).to.be.revertedWith("insufficient funds");
})
//----------checking for  function transferFrom( address _from, address _to,  uint256 _value)
 
it("checking for the transfer from function",async ()=>{
  await impliProxy.increaseSupply(100);
  expect(await impliProxy.balanceOf(owner.address)).to.equal(100);


 //here the _from address should allow the msg.sender certain amount to transfer to the _to by using the approve function
  await impliProxy.connect(owner).approve(signer1.address,10);
  await impliProxy.connect(signer1).transferFrom(owner.address,signer2.address,5);

  expect(await impliProxy.balanceOf(owner.address)).to.equal(95);
  expect(await impliProxy.balanceOf(signer2.address)).to.equal(5);
  expect(await impliProxy.allowance(owner.address,signer1.address)).to.equal(5);

}) 

it("checking the transferFrom function when paused ",async()=>{
  
  await impliProxy.pause();

  expect(impliProxy.transferFrom(owner.address,signer1.address,10)).to.be.revertedWith("whenNotPaused");

})
it("checking the transferFrom function when _to is address(0) ",async ()=>{
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
  expect(impliProxy.transferFrom(owner.address,ZERO_ADDRESS,1)).to.be.revertedWith("cannot transfer to address zero");
})

it("checking the transferFrom function when frozen",async ()=>{
  await impliProxy.setAssetProtectionRole(owner.address);
  await impliProxy.freeze(signer1.address);
  expect(impliProxy.transferFrom(owner.address,signer1.address,10)).to.be.revertedWith("address frozen");
 })
it("insufficient allowance ",async()=>{
  expect(impliProxy.transferFrom(owner.address,signer2.address,5)).to.be.revertedWith("insufficient allowance");
 
})


//------checking for disregardProposeOwner()
//here the proposed owner is removed  
it("checking for disregardProposeOwner()",async()=>{
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
await impliProxy.connect(owner).proposeOwner(signer1.address);
expect(await impliProxy.proposedOwner()).to.equal(signer1.address);

await impliProxy.connect(signer1).disregardProposeOwner();
expect(await impliProxy.proposedOwner()).to.equal(ZERO_ADDRESS);

});
it("checking the require when called by the different address other than owner or proposedOwner",async()=>{

expect(impliProxy.connect(signer1).disregardProposeOwner()).to.be.revertedWith("only proposedOwner or owner");
expect(impliProxy.disregardProposeOwner()).to.be.revertedWith("can only disregard a proposed owner that was previously set");

})

//---checking for the  claimOwnership()
// in this function the proposed owner will claim his position as the new Owner for the contract the old owner will be removed 

it("checking for claimOwnership",async()=>{
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
await impliProxy.proposeOwner(signer1.address);
expect(await impliProxy.owner()).to.equal(owner.address);
expect(await impliProxy.proposedOwner()).to.equal(signer1.address);

await impliProxy.connect(signer1).claimOwnership();
expect(await impliProxy.owner()).to.equal(signer1.address);
expect(await impliProxy.proposedOwner()).to.equal(ZERO_ADDRESS);
})
it("checking the claimOwnership for require condition",async()=>{
expect(impliProxy.claimOwnership()).to.be.revertedWith("onlyProposedOwner");
})

//----checking for  reclaimpaxgProxy()
//the owner claims all the balance stored in the contract address to the owner address
it("testing the reclaimPAXG",async()=>{

await impliProxy.increaseSupply(100);

await impliProxy.transfer(impliProxy.address,10);
expect(await impliProxy.balanceOf(impliProxy.address)).to.equal(10);

await impliProxy.reclaimPAXG();
expect(await impliProxy.balanceOf(impliProxy.address)).to.equal(0);
})
it("checking the reclaimPAXG with require condition",async()=>{
expect(impliProxy.connect(signer1).reclaimPAXG()).to.be.revertedWith("onlyOwner")
})
//---checking setAssetProtectionRole(address _newAssetProtectionRole);
//this function is used in the freez function if the account found suspectable
//initialy this will be equal to address(0);
it("check set Asset Protection Role ",async()=>{
await impliProxy.setAssetProtectionRole(signer1.address);
expect(await impliProxy.assetProtectionRole()).to.equal(signer1.address);

})
it("checking the require condition for set Asset Protection Role ",async()=>{
expect(impliProxy.connect(signer1).setAssetProtectionRole(signer2.address)).to.be.revertedWith("only assetProtectionRole or Owner");
})

//-----checking for wipeFrozenAddress(address _addr)
it("test wipe Frozen Address",async()=>{
await impliProxy.increaseSupply(100);
await impliProxy.transfer(signer2.address,10);
await impliProxy.setAssetProtectionRole(signer1.address);
await impliProxy.connect(signer1).freeze(signer2.address);

expect(await impliProxy.balanceOf(signer2.address)).to.equal(10);
expect(await impliProxy.totalSupply()).to.equal(100);

await impliProxy.connect(signer1).wipeFrozenAddress(signer2.address); 

expect(await impliProxy.balanceOf(signer2.address)).to.equal(0);
expect(await impliProxy.totalSupply()).to.equal(90);

expect(await impliProxy.isFrozen(signer2.address)).to.equal(true);

await impliProxy.connect(signer1).unfreeze(signer2.address);
expect(await impliProxy.isFrozen(signer2.address)).to.equal(false);
})

//checking the supplyController ,initially owner will be the supplyController if we to change use this function
it("check the supplyController",async()=>{
await impliProxy.setSupplyController(signer1.address);
 expect(await impliProxy.totalSupply()).to.equal(0);
await impliProxy.connect(signer1).increaseSupply(1000);
expect(await impliProxy.totalSupply()).to.equal(1000);

await impliProxy.connect(signer1).decreaseSupply(100);
expect(await impliProxy.totalSupply()).to.equal(900);


})
it("check the require of the supplyController",async()=>{
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
expect(impliProxy.connect(signer2).setSupplyController(signer1.address)).to.be.revertedWith("only SupplyController or Owner");
expect(impliProxy.setSupplyController(ZERO_ADDRESS)).to.be.revertedWith("cannot set supply controller to address zero");

})    


//------check  setFeeController(address _newFeeController)
//initially the fee contraler will be the owner 
it("check fee controller ",async()=>{
  expect(await impliProxy.feeController()).to.equal(owner.address);
  await impliProxy.connect(owner).setFeeController(signer2.address);
  expect(await impliProxy.feeController()).to.equal(signer2.address);

})
it("check the fee controller  for the require conditions ",async()=>{
 expect(impliProxy.connect(signer1).setFeeController(signer1.address)).to.be.revertedWith( "only FeeController or Owner");
 const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
 expect(impliProxy.setFeeController(ZERO_ADDRESS)).to.be.revertedWith("cannot set fee controller to address zero");
})
//------check setFeeRecipient(address _newFeeRecipient)

it("check setFeeRecipient(address _newFeeRecipient) ",async()=>{
  expect(await impliProxy.feeRecipient()).to.be.equal(owner.address);
  await impliProxy.setFeeController(signer1.address);
  await impliProxy.connect(signer1).setFeeRecipient(signer2.address);

  expect(await impliProxy.feeRecipient()).to.be.equal(signer2.address);

})

//---------check  setFeeRate(uint256 _newFeeRate)

it("check setFeeRate(uint256 _newFeeRate)",async()=>{
  expect(await impliProxy.feeRate()).to.equal(0);
  //for 100% fee
  await impliProxy.setFeeRate(1000000);
  expect(await impliProxy.feeRate()).to.equal(1000000);
  await impliProxy.setFeeRecipient(signer2.address);
  expect(await impliProxy.balanceOf(signer2.address)).to.be.equal(0);
  await impliProxy.increaseSupply(200);
  await impliProxy.transfer(signer1.address,100);

  //as the fee is 100% the signer2 value should increase by 100

  expect(await impliProxy.balanceOf(signer2.address)).to.equal(100);

  //chenging the fee rate to 3% of the enterend value

  await impliProxy.setFeeRate(30000);

  await impliProxy.transfer(signer1.address,100);
  expect(await impliProxy.balanceOf(signer2.address)).to.equal(103);
})
it("checking the require condition for setFeeRate(uint256 _newFeeRate)",async()=>{
  expect(impliProxy.setFeeRate(1000001)).to.be.revertedWith("cannot set fee rate above 100%");
})
})