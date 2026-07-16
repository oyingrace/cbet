// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

/**
 * @title CbetLotto
 * @notice Upgradeable USDT lottery contract for Celo (UUPS). Accepts bets
 *         (stakes are escrowed in the contract) and publishes draw results
 *         on-chain. Payout logic can be added in a future implementation
 *         upgrade; today winners are paid off-chain by the operator, funded
 *         from the escrowed stakes via `withdrawToken`.
 *
 * @dev Adapted from the Dream Lotto contract. Differences: denominated in USDT
 *      on Celo (6 decimals), and adds combo-5 (gameType 11). The contract itself
 *      is token-agnostic — decimals only affect the min/max bet configuration.
 *
 *      Designed for MiniPay: players call `placeBet` directly (approve +
 *      placeBet), signing with their MiniPay wallet — no permit/relayer needed.
 */
contract CbetLotto is Initializable, OwnableUpgradeable, ReentrancyGuard, UUPSUpgradeable {
    using SafeERC20 for IERC20;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Stake token (USDT on Celo, 6 decimals).
    IERC20 public token;

    uint256 public nextTicketId;
    uint256 public minBet; // token base units (USDT = 6 decimals, e.g. 1e6 = 1 USDT)
    uint256 public maxBet;

    struct DrawResult {
        uint8[] winningNumbers;
        uint64 publishedAt;
        bool published;
    }

    /// @dev drawIdHash => published result
    mapping(bytes32 => DrawResult) private _drawResults;

    /**
     * gameType encoding (matches the app's on-chain mapping):
     * - 0  = draw-2   (exactly 2 numbers)
     * - 1  = draw-3   (exactly 3 numbers)
     * - 2  = draw-4   (exactly 4 numbers)
     * - 3  = combo-2  (at least 2 numbers)
     * - 4  = combo-3  (at least 3 numbers)
     * - 5  = draw-5   (exactly 5 numbers)
     * - 6  = lucky-10 (exactly 2 numbers, range 1-10)
     * - 7  = mega-20  (exactly 2 numbers, range 1-20)
     * - 8  = turbo-30 (exactly 2 numbers, range 1-30)
     * - 9  = ultra-40 (exactly 2 numbers, range 1-40)
     * - 10 = combo-4  (at least 4 numbers)
     * - 11 = combo-5  (at least 5 numbers)
     */
    event BetPlaced(
        uint256 indexed ticketId,
        address indexed player,
        bytes32 indexed drawIdHash,
        uint8 gameType,
        uint8[] numbers,
        uint256 amount,
        string drawId
    );

    event DrawResultPublished(
        bytes32 indexed drawIdHash,
        uint8[] winningNumbers,
        string drawId,
        uint64 publishedAt
    );

    error InvalidAmount();
    error InvalidNumbers();
    error InvalidGameType();
    error DrawAlreadyPublished();
    error DrawNotPublished();

    /// @notice Initialize the proxy (replaces constructor).
    function initialize(address _token, uint256 _minBet, uint256 _maxBet, address _owner) external initializer {
        if (_token == address(0) || _owner == address(0)) revert InvalidAmount();

        __Ownable_init(_owner);

        token = IERC20(_token);
        minBet = _minBet;
        maxBet = _maxBet;
        nextTicketId = 1;
    }

    function _validateGameAndNumbers(uint8 gameType, uint8[] calldata numbers) internal pure {
        if (numbers.length == 0) revert InvalidNumbers();

        // draw-2/3/4: exactly gameType+2 numbers, range 1-90
        if (gameType <= 2) {
            uint256 requiredLength = uint256(gameType) + 2;
            if (numbers.length != requiredLength) revert InvalidNumbers();
            _requireRange(numbers, 90);
            return;
        }

        // combo-2 / combo-3: at least 2 / 3 numbers, range 1-90
        if (gameType == 3 || gameType == 4) {
            uint8 comboLevel = gameType == 3 ? 2 : 3;
            if (numbers.length < comboLevel) revert InvalidNumbers();
            _requireRange(numbers, 90);
            return;
        }

        // draw-5: exactly 5 numbers
        if (gameType == 5) {
            if (numbers.length != 5) revert InvalidNumbers();
            _requireRange(numbers, 90);
            return;
        }

        // special lucky-10/mega-20/turbo-30/ultra-40: exactly 2 numbers, capped range
        if (gameType >= 6 && gameType <= 9) {
            if (numbers.length != 2) revert InvalidNumbers();
            uint8 maxNum = gameType == 6 ? 10 : (gameType == 7 ? 20 : (gameType == 8 ? 30 : 40));
            _requireRange(numbers, maxNum);
            return;
        }

        // combo-4: at least 4 numbers
        if (gameType == 10) {
            if (numbers.length < 4) revert InvalidNumbers();
            _requireRange(numbers, 90);
            return;
        }

        // combo-5: at least 5 numbers
        if (gameType == 11) {
            if (numbers.length < 5) revert InvalidNumbers();
            _requireRange(numbers, 90);
            return;
        }

        revert InvalidGameType();
    }

    function _requireRange(uint8[] calldata numbers, uint8 maxNum) internal pure {
        for (uint256 i = 0; i < numbers.length; i++) {
            if (numbers[i] == 0 || numbers[i] > maxNum) revert InvalidNumbers();
        }
    }

    function _validateWinningNumbers(uint8[] calldata winningNumbers) internal pure {
        if (winningNumbers.length == 0 || winningNumbers.length > 90) revert InvalidNumbers();
        for (uint256 i = 0; i < winningNumbers.length; i++) {
            if (winningNumbers[i] == 0 || winningNumbers[i] > 90) revert InvalidNumbers();
        }
    }

    function _drawIdHash(string calldata drawId) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(drawId));
    }

    /**
     * @notice Place a bet. The player must have approved at least `amount` of
     *         the stake token to this contract first.
     * @param drawId    Round identifier, e.g. "20260716-1400".
     * @param gameType  On-chain game type (see encoding above).
     * @param numbers   Selected numbers.
     * @param amount    Stake amount in USDT base units (6 decimals).
     */
    function placeBet(
        string calldata drawId,
        uint8 gameType,
        uint8[] calldata numbers,
        uint256 amount
    ) external nonReentrant {
        if (amount < minBet || amount > maxBet) revert InvalidAmount();

        _validateGameAndNumbers(gameType, numbers);

        token.safeTransferFrom(msg.sender, address(this), amount);

        uint256 ticketId = nextTicketId++;
        bytes32 drawIdHash = _drawIdHash(drawId);
        emit BetPlaced(ticketId, msg.sender, drawIdHash, gameType, numbers, amount, drawId);
    }

    /**
     * @notice Publish winning numbers for a draw on-chain (owner/operator only).
     * @param drawId Same identifier used in placeBet.
     * @param winningNumbers Drawn numbers (each 1-90).
     */
    function publishDrawResult(string calldata drawId, uint8[] calldata winningNumbers) external onlyOwner {
        _validateWinningNumbers(winningNumbers);

        bytes32 drawIdHash = _drawIdHash(drawId);
        if (_drawResults[drawIdHash].published) revert DrawAlreadyPublished();

        uint64 publishedAt = uint64(block.timestamp);
        _drawResults[drawIdHash] = DrawResult({
            winningNumbers: winningNumbers,
            publishedAt: publishedAt,
            published: true
        });

        emit DrawResultPublished(drawIdHash, winningNumbers, drawId, publishedAt);
    }

    function isDrawPublished(string calldata drawId) external view returns (bool) {
        return _drawResults[_drawIdHash(drawId)].published;
    }

    function getDrawResult(string calldata drawId)
        external
        view
        returns (uint8[] memory winningNumbers, uint64 publishedAt, bool published)
    {
        DrawResult storage result = _drawResults[_drawIdHash(drawId)];
        if (!result.published) revert DrawNotPublished();
        return (result.winningNumbers, result.publishedAt, result.published);
    }

    function setLimits(uint256 _minBet, uint256 _maxBet) external onlyOwner {
        minBet = _minBet;
        maxBet = _maxBet;
    }

    /// @notice Move escrowed stake token out (e.g. to fund off-chain winner payouts).
    function withdrawToken(address to, uint256 amount) external onlyOwner {
        token.safeTransfer(to, amount);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
