// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "forge-std/Script.sol";
import "../src/StealthPay.sol";
import "../src/eUSDT.sol";

contract DeployAll is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy eUSDT Token
        eUSDT token = new eUSDT();
        
        // 2. Deploy StealthPay FHE Contract
        StealthPay stealthPay = new StealthPay();
        
        // 3. Connect them together
        stealthPay.addSupportedToken(address(token));

        vm.stopBroadcast();
    }
}
