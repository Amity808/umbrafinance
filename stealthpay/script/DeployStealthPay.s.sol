// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "forge-std/Script.sol";
import "../src/StealthPay.sol";

contract DeployStealthPay is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        StealthPay stealthPay = new StealthPay();
        
        // Let's add the USDC testnet address the user had in local .env as a supported FHERC20 mock token
        // USDC_ADDRESS=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
        stealthPay.addSupportedToken(0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238);

        vm.stopBroadcast();
    }
}
