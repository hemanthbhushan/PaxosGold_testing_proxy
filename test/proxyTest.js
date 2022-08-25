const { inputToConfig } = require("@ethereum-waffle/compiler");
const { expect } = require("chai");
const { Signer } = require("ethers");
const { ethers, network } = require("hardhat");


describe("check",()=>{
    let owner,signer1,signer2;

  beforeEach(async()=>{
    [owner,signer1,signer2,admin] = await ethers.getSigners();
    const Proxy = await ethers.getContractFactory("AdminUpgradeabilityProxy",admin.address);

    

  })  

    
})