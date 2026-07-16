// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/CbetLotto.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Celo mainnet cUSD: 0x765DE816845861e75A25fCA122bb6898B8B1282a
        address stakeToken = vm.envOr("CUSD_ADDRESS", address(0x765DE816845861e75A25fCA122bb6898B8B1282a));
        uint256 minBet = vm.envOr("MIN_BET", uint256(1e18)); // 1 cUSD (18 decimals)
        uint256 maxBet = vm.envOr("MAX_BET", uint256(100 * 1e18)); // 100 cUSD

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
