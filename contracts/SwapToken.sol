// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.24;

import "hardhat/console.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SwapToken is Ownable {
    mapping(address => mapping(address => uint256)) private rates;

    constructor() Ownable(msg.sender) {}

    event Swap(
        address indexed _swaper,
        address indexed _tokenA,
        address indexed _tokenB,
        uint256 _amountA,
        uint256 _amountB, 
        uint256 _rates
    );

    event SetRate(
        address indexed _tokenA,
        address indexed _tokenB,
        uint256 _newRate
    );

    function setRate(address _tokenA, address _tokenB, uint256 _rate) external onlyOwner() {
        rates[_tokenA][_tokenB] = _rate * 1e18;
        rates[_tokenB][_tokenA] = 1e18 / _rate;

        emit SetRate(_tokenA, _tokenB, _rate);
    }

    function getRate(address _tokenA, address _tokenB) public view returns(uint256) {
        return rates[_tokenA][_tokenB];
    }

    function swap(address _tokenA, address _tokenB, uint256 _amount) external payable {
        require(_tokenA != _tokenB, "Swap token must be difference");
        require(_amount > 0, "Amount must be greater than 0");

        uint256 rate = getRate(_tokenA, _tokenB);
        uint256 amountOut = _amount * rate / 1e18;

        _handleAmountIn(_tokenA, _amount);
        _handleAmountOut(_tokenB, amountOut);

        emit Swap(msg.sender, _tokenA, _tokenB, _amount, amountOut, rate);
    }

    function deposit(address _token, uint256 _amount) external payable {
        _handleAmountIn(_token, _amount);
    }

    function _handleAmountIn(address _token, uint256 _amount) internal {
        if (_isNativeToken(_token)) {
            require(_amount == msg.value, "Amount in must be equal to msg.value");
            return;
        }
        IERC20(_token).transferFrom(msg.sender, address(this), _amount);
    }

    function _handleAmountOut(address _token, uint256 _amount) internal {
        if (_isNativeToken(_token)) {
            (bool sent,) = msg.sender.call{value: _amount}("");
            require(sent, "Error sending native token");
            return;
        }
        IERC20(_token).transfer(msg.sender, _amount);
    }

    function _isNativeToken(address _token) internal pure returns(bool) {
        return _token == address(0);
    }
}