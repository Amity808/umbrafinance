// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Test, console} from "forge-std/Test.sol";
import {StealthPay} from "../src/StealthPay.sol";

contract StealthPayTest is Test {
    StealthPay public stealthPay;
    
    // Mock token address
    address mockToken = address(0x1234);

    function setUp() public {
        stealthPay = new StealthPay();
    }

    function test_AddSupportedToken() public {
        stealthPay.addSupportedToken(mockToken);
        assertEq(stealthPay.supportedTokens(mockToken), true);
    }
}
