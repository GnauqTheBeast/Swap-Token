// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.24;

import "hardhat/console.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract SwapToken is Ownable {
    mapping(address => mapping(address => uint256)) private rates;

    constructor() Ownable(msg.sender) {}

    event Swap(
        address indexed TokenA,
        address indexed TokenB,
        uint256 amountA,
        uint256 amountB, 
        uint256 rates
    );

    event SetRate(
        address indexed TokenA,
        address indexed TokenB,
        uint256 newRate
    );

    function exchange(address TokenA, address TokenB, uint256 amount) external {
        
    }

}