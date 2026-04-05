// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/EVoting.sol";

contract DeployEVoting is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        EVoting evoting = new EVoting();
        console.log("EVoting deployed at:", address(evoting));

        vm.stopBroadcast();
    }
}
