// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/CbetLotto.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Celo mainnet native USD₮ (Tether): 0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e
        address stakeToken = vm.envOr("USDT_ADDRESS", address(0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e));
        uint256 minBet = vm.envOr("MIN_BET", uint256(1e6)); // 1 USDT (6 decimals)
        uint256 maxBet = vm.envOr("MAX_BET", uint256(100 * 1e6)); // 100 USDT

        vm.startBroadcast(deployerPrivateKey);

        address owner = vm.addr(deployerPrivateKey);

        CbetLotto implementation = new CbetLotto();

        bytes memory initData = abi.encodeCall(
            CbetLotto.initialize,
            (stakeToken, minBet, maxBet, owner)
        );

        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);
        CbetLotto lotto = CbetLotto(address(proxy));

        vm.stopBroadcast();

        console.log("CbetLotto implementation deployed at", address(implementation));
        console.log("CbetLotto proxy deployed at", address(lotto));
        console.log("Use the PROXY address in NEXT_PUBLIC_LOTTO_CONTRACT_ADDRESS");
    }
}
