// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

contract TestImplementtion{
    uint public x;
    function updateX(uint _x) public {
        x = _x;
        
    }
}