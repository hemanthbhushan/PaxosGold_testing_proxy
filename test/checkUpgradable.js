const { inputToConfig } = require("@ethereum-waffle/compiler");
const { expect } = require("chai");
const { Signer } = require("ethers");
const { ethers, network } = require("hardhat");


describe("check",()=>{

  let owner,signer1,admin,proxy,impli,_proxy,signer2,impli1,_proxy1;

 beforeEach(async ()=>{
  [owner,signer1,signer2,admin] = await ethers.getSigners();

  const Impli = await ethers.getContractFactory("PAXGImplementation",owner.address);
  const Impli1 = await ethers.getContractFactory("PAXGImplementation2",owner.address);

  const Proxy = await ethers.getContractFactory("AdminUpgradeabilityProxy",admin.address);

   impli = await Impli.deploy();
   _proxy = await Proxy.connect(admin).deploy(impli.address);

   proxy =  impli.attach(_proxy.address);
   await proxy.connect(owner).initialize();
  //  await proxy.connect(owner).pause();
  impli1 = await Impli1.deploy();
  await _proxy.connect(admin).upgradeTo(impli1.address);

 })

 it("checking the name ",async()=>{
  
  proxy =  impli1.attach(_proxy.address);
  await proxy.setImproved(23);
  expect(await proxy.improved()).to.equal(23);

 })
})