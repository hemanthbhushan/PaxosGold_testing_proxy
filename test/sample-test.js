const { inputToConfig } = require("@ethereum-waffle/compiler");
const { expect } = require("chai");
const { Signer } = require("ethers");
const { ethers, network } = require("hardhat");


describe("check",()=>{

  let owner,signer1,admin,proxy,impli,_proxy,signer2;

 beforeEach(async ()=>{
  [owner,signer1,signer2,admin] = await ethers.getSigners();

  const Impli = await ethers.getContractFactory("PAXGImplementation",owner.address);

  const Proxy = await ethers.getContractFactory("AdminUpgradeabilityProxy",admin.address);

   impli = await Impli.deploy();
   _proxy = await Proxy.connect(admin).deploy(impli.address);

   proxy =  impli.attach(_proxy.address);
   await proxy.connect(owner).initialize();
  //  await proxy.connect(owner).pause();

 })

 it("checking the name ",async()=>{

   const name = await proxy.name();
   const synbol = await proxy.symbol();
   const owner1 = await proxy.owner();

   expect(await proxy.supplyController()).to.equal(owner.address);
   expect(await proxy.feeController()).to.equal(owner.address);
   expect(await proxy.feeRecipient()).to.equal(owner.address);
    expect(owner1).to.equal(owner.address);

   expect(name).to.equal("Golar Token");
   expect(synbol).to.equal("GOLA");
 })
//  ----------checking for the transfer(address _to, uint256 _value)

 it("checking the transfer function",async ()=>{
  await proxy.increaseSupply(100);
  expect(await proxy.balanceOf(owner.address)).to.equal(100);
 
 
  await proxy.transfer(signer1.address,10);
  expect(await proxy.balanceOf(owner.address)).to.equal(90);
  expect(await proxy.balanceOf(signer1.address)).to.equal(10);
})
it("checking the transfer function when paused ",async()=>{
  
  await proxy.pause();
  
  expect(proxy.transfer(signer1.address,10)).to.be.revertedWith("whenNotPaused");

})
it("checking the transfer function when _to is address(0) ",async ()=>{
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
  expect(proxy.transfer(ZERO_ADDRESS,1)).to.be.revertedWith("cannot transfer to address zero");
})

it("checking the transfer function when frozen",async ()=>{

 await proxy.setAssetProtectionRole(owner.address);
 await proxy.freeze(signer1.address);
 expect(proxy.transfer(signer1.address,100)).to.be.revertedWith("address frozen");

 })
it("insufficient funds in the msg.sender in transfer function",async()=>{
  expect(proxy.transfer(signer1.address,1)).to.be.revertedWith("insufficient funds");
})
//----------checking for  function transferFrom( address _from, address _to,  uint256 _value)
 
it("checking for the transfer from function",async ()=>{
  await proxy.increaseSupply(100);
  expect(await proxy.balanceOf(owner.address)).to.equal(100);


 //here the _from address should allow the msg.sender certain amount to transfer to the _to by using the approve function
  await proxy.connect(owner).approve(signer1.address,10);
  await proxy.connect(signer1).transferFrom(owner.address,signer2.address,5);

  expect(await proxy.balanceOf(owner.address)).to.equal(95);
  expect(await proxy.balanceOf(signer2.address)).to.equal(5);
  expect(await proxy.allowance(owner.address,signer1.address)).to.equal(5);

}) 

it("checking the transferFrom function when paused ",async()=>{
  
  await proxy.pause();

  expect(proxy.transferFrom(owner.address,signer1.address,10)).to.be.revertedWith("whenNotPaused");

})
it("checking the transferFrom function when _to is address(0) ",async ()=>{
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
  expect(proxy.transferFrom(owner.address,ZERO_ADDRESS,1)).to.be.revertedWith("cannot transfer to address zero");
})

it("checking the transferFrom function when frozen",async ()=>{
  await proxy.setAssetProtectionRole(owner.address);
  await proxy.freeze(signer1.address);
  expect(proxy.transferFrom(owner.address,signer1.address,10)).to.be.revertedWith("address frozen");
 })
it("insufficient allowance ",async()=>{
  expect(proxy.transferFrom(owner.address,signer2.address,5)).to.be.revertedWith("insufficient allowance");
 
})


//------checking for disregardProposeOwner()
//here the proposed owner is removed  
it("checking for disregardProposeOwner()",async()=>{
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
await proxy.connect(owner).proposeOwner(signer1.address);
expect(await proxy.proposedOwner()).to.equal(signer1.address);

await proxy.connect(signer1).disregardProposeOwner();
expect(await proxy.proposedOwner()).to.equal(ZERO_ADDRESS);

});
it("checking the require when called by the different address other than owner or proposedOwner",async()=>{

expect(proxy.connect(signer1).disregardProposeOwner()).to.be.revertedWith("only proposedOwner or owner");
expect(proxy.disregardProposeOwner()).to.be.revertedWith("can only disregard a proposed owner that was previously set");

})

//---checking for the  claimOwnership()
// in this function the proposed owner will claim his position as the new Owner for the contract the old owner will be removed 

it("checking for claimOwnership",async()=>{
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
await proxy.proposeOwner(signer1.address);
expect(await proxy.owner()).to.equal(owner.address);
expect(await proxy.proposedOwner()).to.equal(signer1.address);

await proxy.connect(signer1).claimOwnership();
expect(await proxy.owner()).to.equal(signer1.address);
expect(await proxy.proposedOwner()).to.equal(ZERO_ADDRESS);
})
it("checking the claimOwnership for require condition",async()=>{
expect(proxy.claimOwnership()).to.be.revertedWith("onlyProposedOwner");
})

//----checking for  reclaimpaxgProxy()
//the owner claims all the balance stored in the contract address to the owner address
it("testing the reclaimPAXG",async()=>{

await proxy.increaseSupply(100);

await proxy.transfer(proxy.address,10);
expect(await proxy.balanceOf(proxy.address)).to.equal(10);

await proxy.reclaimPAXG();
expect(await proxy.balanceOf(proxy.address)).to.equal(0);
})
it("checking the reclaimPAXG with require condition",async()=>{
expect(proxy.connect(signer1).reclaimPAXG()).to.be.revertedWith("onlyOwner")
})
//---checking setAssetProtectionRole(address _newAssetProtectionRole);
//this function is used in the freez function if the account found suspectable
//initialy this will be equal to address(0);
it("check set Asset Protection Role ",async()=>{
await proxy.setAssetProtectionRole(signer1.address);
expect(await proxy.assetProtectionRole()).to.equal(signer1.address);

})
it("checking the require condition for set Asset Protection Role ",async()=>{
expect(proxy.connect(signer1).setAssetProtectionRole(signer2.address)).to.be.revertedWith("only assetProtectionRole or Owner");
})

//-----checking for wipeFrozenAddress(address _addr)
it("test wipe Frozen Address",async()=>{
await proxy.increaseSupply(100);
await proxy.transfer(signer2.address,10);
await proxy.setAssetProtectionRole(signer1.address);
await proxy.connect(signer1).freeze(signer2.address);

expect(await proxy.balanceOf(signer2.address)).to.equal(10);
expect(await proxy.totalSupply()).to.equal(100);

await proxy.connect(signer1).wipeFrozenAddress(signer2.address); 

expect(await proxy.balanceOf(signer2.address)).to.equal(0);
expect(await proxy.totalSupply()).to.equal(90);

expect(await proxy.isFrozen(signer2.address)).to.equal(true);

await proxy.connect(signer1).unfreeze(signer2.address);
expect(await proxy.isFrozen(signer2.address)).to.equal(false);
})

//checking the supplyController ,initially owner will be the supplyController if we to change use this function
it("check the supplyController",async()=>{
await proxy.setSupplyController(signer1.address);
 expect(await proxy.totalSupply()).to.equal(0);
await proxy.connect(signer1).increaseSupply(1000);
expect(await proxy.totalSupply()).to.equal(1000);
expect(await proxy.balanceOf(signer1.address)).to.equal(1000);

await proxy.connect(signer1).decreaseSupply(100);
expect(await proxy.totalSupply()).to.equal(900);
expect(await proxy.balanceOf(signer1.address)).to.equal(900);


})
it("check the require of the supplyController",async()=>{
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
expect(proxy.connect(signer2).setSupplyController(signer1.address)).to.be.revertedWith("only SupplyController or Owner");
expect(proxy.setSupplyController(ZERO_ADDRESS)).to.be.revertedWith("cannot set supply controller to address zero");

})    


//------check  setFeeController(address _newFeeController)
//initially the fee contraler will be the owner 
it("check fee controller ",async()=>{
  expect(await proxy.feeController()).to.equal(owner.address);
  await proxy.connect(owner).setFeeController(signer2.address);
  expect(await proxy.feeController()).to.equal(signer2.address);

})
it("check the fee controller  for the require conditions ",async()=>{
 expect(proxy.connect(signer1).setFeeController(signer1.address)).to.be.revertedWith( "only FeeController or Owner");
 const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
 expect(proxy.setFeeController(ZERO_ADDRESS)).to.be.revertedWith("cannot set fee controller to address zero");
})
//------check setFeeRecipient(address _newFeeRecipient)

it("check setFeeRecipient(address _newFeeRecipient) ",async()=>{
  expect(await proxy.feeRecipient()).to.be.equal(owner.address);
  await proxy.setFeeController(signer1.address);
  await proxy.connect(signer1).setFeeRecipient(signer2.address);

  expect(await proxy.feeRecipient()).to.be.equal(signer2.address);

})

//---------check  setFeeRate(uint256 _newFeeRate)

it("check setFeeRate(uint256 _newFeeRate)",async()=>{
  expect(await proxy.feeRate()).to.equal(0);
  //for 100% fee
  await proxy.setFeeRate(1000000);
  expect(await proxy.feeRate()).to.equal(1000000);
  await proxy.setFeeRecipient(signer2.address);
  expect(await proxy.balanceOf(signer2.address)).to.be.equal(0);
  await proxy.increaseSupply(200);
  await proxy.transfer(signer1.address,100);

  //as the fee is 100% the signer2 value should increase by 100

  expect(await proxy.balanceOf(signer2.address)).to.equal(100);

  //changing the fee rate to 3% of the enterend value

  await proxy.setFeeRate(30000);

  await proxy.transfer(signer1.address,100);
  expect(await proxy.balanceOf(signer2.address)).to.equal(103);
  expect(await proxy.balanceOf(signer1.address)).to.equal(97);
})
it("checking the require condition for setFeeRate(uint256 _newFeeRate)",async()=>{
  expect(proxy.setFeeRate(1000001)).to.be.revertedWith("cannot set fee rate above 100%");
})
//-----checkin the delegatecallTransfer----
})







// const ethSigUtil = require("eth-sig-util");
// const { inputToConfig } = require("@ethereum-waffle/compiler");
// const { expect } = require("chai");
// const { Signer } = require("ethers");
// const { ethers, network } = require("hardhat");
// // private key for token from address
// const privateKey = Buffer.from(
//   "43f2ee33c522046e80b67e96ceb84a05b60b9434b0ee2e3ae4b1311b9f5dcc46",
//   "hex"
// );
// // EIP-55 of ethereumjsUtil.bufferToHex(ethereumjsUtil.privateToAddress(privateKey));
// const fromAddress = "0xBd2e9CaF03B81e96eE27AD354c579E1310415F39";
// const wrongPrivateKey = Buffer.from(
//   "43f2ee33c522046e80b67e96ceb84a05b60b9434b0ee2e3ae4b1311b9f5dcc41",
//   "hex"
// );


// describe("BetaDelegatedTransfer PAXG",()=>{
//   let owner,signer1,admin,proxy,impli,impliProxy,signer2,
//    executor,
//   recipient,
//   whitelister,
//   bystander;
//   const amount = 10;
//   const serviceFeeAmount = 1;

//  beforeEach(async ()=>{
//   [owner,signer1,signer2,admin,executor,recipient,whitelister,bystander] = await ethers.getSigners();

//   const Impli = await ethers.getContractFactory("PAXGImplementation",owner.address);

//   const Proxy = await ethers.getContractFactory("AdminUpgradeabilityProxy",admin.address);

//    impli = await Impli.deploy();
//    proxy = await Proxy.connect(admin).deploy(impli.address);

//    impliProxy =  impli.attach(proxy.address);
//    await impliProxy.connect(owner).initialize();
//    await impliProxy.initializeDomainSeparator();
//   //  await impliProxy.connect(owner).pause();
//   betaDelegatedTransferContext = {
//     types: {
//       EIP712Domain: [
//         { name: "name", type: "string" },
//         { name: "verifyingContract", type: "address" }
//       ],
//       BetaDelegatedTransfer: [
//         { name: "to", type: "address" },
//         { name: "value", type: "uint256" },
//         { name: "serviceFee", type: "uint256" },
//         { name: "seq", type: "uint256" },
//         { name: "deadline", type: "uint256" }
//       ]
//     },
//     primaryType: "BetaDelegatedTransfer",
//     domain: {
//       name: "Paxos Gold",
//       verifyingContract: impliProxy.address
//     }
//   };
//   await impliProxy. connect(owner).increaseSupply(100);
//     // send the tokens to the custom wallet
//     // let { receipt } = 
//      await impliProxy.transfer(
//       fromAddress,
//       2 * (amount + serviceFeeAmount),
      
//     );
//     // let blockNumber = receipt.blockNumber;
    
//     let senderBalance = await impliProxy.balanceOf(fromAddress);
//     expect(senderBalance).to.be.equal(2 * (amount + serviceFeeAmount));
//     let executorBalance = await impliProxy.balanceOf(executor.address);
//     expect(executorBalance).to.equal(0);
//     let recipientBalance = await impliProxy.balanceOf(recipient.address);
//     expect(recipientBalance).to.equal(0);

//      // check the seq
//      let nextSeq = await impliProxy.nextSeqOf(fromAddress);
//     expect(nextSeq).to.equal(0);

//      // set the whitelister
//      await impliProxy.connect(owner).setBetaDelegateWhitelister(whitelister.address);

//      // whitelist the executor address
//      await impliProxy.connect(whitelister).whitelistBetaDelegate(executor.address);
//  })

// it("can do a delegated transfer", async ()=>{
//   // delegated transfer message
//   let message = {
//     to: recipient.address, value: amount, serviceFee: serviceFeeAmount,seq: 0,deadline: blockNumber
//   };
//   // const msg = ethers.utils.arrayify(message);

// // create delegated transfer
//    const typedData = {
//     betaDelegatedTransferContext,
//     message
//   };

// const hash = ethers.utils.arrayify(typedData);
//   // sign the delegated transfer with the token holder address
//   const sig = ethSigUtil.signTypedData(privateKey, { data: hash });

//   // commit delegated transfer
//   let { to, value, serviceFee, seq, deadline } = message;
//   const { logs } = await impliProxy.connect(executor).betaDelegatedTransfer(sig,to,value,serviceFee,seq,deadline);

//   // check balances
//   senderBalance = await impliProxy.balanceOf(fromAddress);
//   expect(senderBalance).to.equal(amount + serviceFeeAmount);
  
//   executorBalance = await impliProxy.balanceOf(executor.address);
//   expect(executorBalance).to.equal(serviceFeeAmount)
  
//   recipientBalance = await impliProxy.balanceOf(recipient.address);
//   expect(recipientBalance).to.equal(amount);

//   // check seq updated
//   nextSeq = await impliProxy.nextSeqOf(fromAddress);
//   expect(nextSeq).to.equal(1);
  

// })

 
// });

